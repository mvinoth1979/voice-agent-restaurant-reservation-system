# Shivsagar Voice Reservation Agent: System Architecture

This document describes the technical architecture of the Shivsagar Voice-Enabled Restaurant Reservation system, detailing the components, flow, and providers for both the turn-based (Phase 1) and live streaming (Phase 2) interfaces.

---

## 1. High-Level Architecture Overview

The system is built on a split architecture supporting two distinct phases of voice interactions:
1. **Phase 1: Push-To-Talk (PTT)** - A turn-based HTTP request-response flow using discrete audio files, Gemini 2.5 Flash for transcription and reasoning, and Sarvam AI for text-to-speech.
2. **Phase 2: Live Streaming** - A low-latency, full-duplex WebSocket-based interface powered by the Gemini Multimodal Live API, enabling direct speech-to-speech reasoning and instant barge-in.

```mermaid
graph TD
    %% Define Nodes
    subgraph Frontend ["Client Browser (React + TypeScript)"]
        UI["Homepage & Voice Modal UI"]
        Rec["Recorder Hook (useAudioRecorder)"]
        Stream["Streamer Hook (useAudioStreamer)"]
        QueuePlayer["Audio Queue Player (Web Audio API)"]
        VAD["Client VAD (Energy Detection)"]
    end

    subgraph Backend ["Express Server (Node.js + TS)"]
        API["HTTP Endpoint (/api/voice/process)"]
        WS["WebSocket Server (/api/voice/stream)"]
        Proxy["Live WebSocket Proxy (liveProxy.ts)"]
        Inventory["Local Slot Inventory Manager"]
    end

    subgraph ExternalServices ["External Providers & APIs"]
        GeminiSTT["Google AI Studio (Gemini 2.5 Flash STT)"]
        GeminiLLM["Google AI Studio (Gemini 2.5 Flash LLM)"]
        SarvamTTS["Sarvam AI (TTS API)"]
        GeminiLive["Google AI Studio (Gemini Live API - WebSocket)"]
        CalendarAPI["Google Calendar API (MCP / Service Account)"]
        SheetsAPI["Google Sheets API (MCP / Service Account)"]
    end

    %% Flows for Phase 1 (Turn-Based)
    UI -->|1. Record Button| Rec
    Rec -->|2. HTTP POST Audio Blob| API
    API -->|3. Transcribe Audio| GeminiSTT
    GeminiSTT -->|4. Text Transcript| API
    API -->|5. Generate Conversational Chat| GeminiLLM
    GeminiLLM -->|6. Agent Text & Action Tags| API
    API -->|7. Generate Speech Audio| SarvamTTS
    SarvamTTS -->|8. Audio Bytes (MPEG)| API
    API -->|9. JSON Response (Transcript, Text, Audio)| UI

    %% Flows for Phase 2 (Live Streaming)
    UI -->|1. Connect Streaming| Stream
    Stream -->|2. WebSocket Connection| WS
    WS --> Proxy
    Stream -->|3. Record PCM Chunks (16kHz)| Stream
    Stream -->|4. Stream PCM (Base64) Chunks| WS
    Proxy -->|5. Stream Input PCM Chunks| GeminiLive
    GeminiLive -->|6. Stream Output PCM (24kHz) Chunks| Proxy
    GeminiLive -->|7. Stream Output Transcription & Action Tags| Proxy
    Proxy -->|8. Forward Output PCM Chunks| Stream
    Stream -->|9. Gapless Audio Queue| QueuePlayer
    Proxy -->|10. Forward Clean Text Transcript| Stream
    Stream -->|11. Render Real-time Subtitles| UI

    %% Action Execution & DB writes
    API -->|Manage Slots| Inventory
    Proxy -->|Manage Slots| Inventory
    API -->|Create/Cancel Calendar Holds| CalendarAPI
    Proxy -->|Create/Cancel Calendar Holds| CalendarAPI
    API -->|Write Sheets Booking Log| SheetsAPI
    Proxy -->|Write Sheets Booking Log| SheetsAPI
```

---

## 2. Component Directory

### A. Frontend Client
* **UI Components:** Built using React, Tailwind CSS, and custom styles matching the *Saffron Pulse* design token library. Key elements include the homepage grid, bento menu items, voice overlay glassmorphism modal, transcription conversation log, and confirmation card badge.
* **Recorder Hook (`useAudioRecorder`):** Uses HTML5 MediaRecorder to capture user microphone input as standard audio blobs for turn-based processing.
* **Streamer Hook (`useAudioStreamer`):** Features an `AudioWorklet` processor downsampling browser microphone capture to 16kHz PCM chunks in real-time, streaming base64 chunks, and managing a gapless scheduled `AudioContext` queue player at 24kHz.
* **VAD (Voice Activity Detection):** Client-side Root Mean Square (RMS) energy analyzer that monitors volume levels. If the user speaks while the agent is playing audio, VAD triggers an immediate local playback stop and sends an interrupt signal to the backend.

### B. Backend Server
* **Express Server (`server.ts` & `app.ts`):** Serves HTTP endpoints and hosts the WebSocket upgrade server handling upgrades for `/api/voice/stream`.
* **Live Proxy (`liveProxy.ts`):** A lightweight bidirectional proxy bridging client WebSockets and Google AI Studio's Live endpoint.
  * Translates client audio chunk payloads into Gemini's `BidiGenerateContentRealtimeInput` scheme.
  * Configures the session with `responseModalities: ["AUDIO"]` and enables `output_audio_transcription: {}`.
  * Intercepts real-time model text transcripts, parses action tags (e.g. `[ACTION:BOOK_NEW:...]`), executes slot updates, and forwards the cleaned text and native output audio chunks back to the client.
* **Slot Inventory Manager (`inventory.ts`):** Controls standard and group seating rules, checks availability, and handles slot negotiation in case of occupancy collisions.

### C. External Providers & Integrations
* **Google AI Studio (Gemini):**
  * `gemini-2.5-flash`: Handles turn-based audio-to-text transcription (STT) and LLM conversation/actions reasoning.
  * `gemini-2.5-flash-native-audio-latest`: Powers the real-time speech-to-speech session over WebSocket.
* **Sarvam AI (`bulbul:v3`):** Synthesizes agent text replies into high-quality spoken audio for turn-based PTT mode.
* **Google Calendar API:** Handles booking holds (`Dining Hold — {Occasion} — {Code}`) lasting 2 hours, rescheduling updates, and cancellations.
* **Google Sheets API:** Appends daily booking logs (timestamp, date, occasion, party size, reservation code, status) and updates columns on rescheduling/cancellations.
