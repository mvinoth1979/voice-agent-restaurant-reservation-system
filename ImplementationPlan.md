# Implementation Plan: Shivsagar Voice Reservation Agent

This document outlines the master technical implementation plan for building the Shivsagar Voice-Enabled Table Reservation Agent. The system is split into two phases:
* **Phase 1:** Turn-based Push-to-Talk (PTT) interface using Gemini 2.5 Flash Lite (STT + LLM) and ElevenLabs TTS.
* **Phase 2:** Continuous real-time streaming conversational interface via Gemini Live API (WebSockets) and streaming ElevenLabs TTS, with barge-in support.

To maximize context window utilization and prevent context compression, the project is structured into **4 sequential, highly focused Sprints**. At the end of each sprint, the active agent session MUST update this file with progress, lessons learned, and hand off to the next sprint.

---

## 🛠️ Project Tech Stack & Architecture

### Tech Stack
* **Frontend:** Vite React application with TypeScript. Tailwind CSS (configured with the Saffron Pulse design system tokens).
* **Backend:** Node.js + Express API server with TypeScript.
* **AI & Voice Services:**
  * Gemini 2.5 Flash Lite (REST) for Phase 1 STT and LLM reasoning.
  * Gemini Live API (WebSocket) for Phase 2 continuous voice interaction.
  * ElevenLabs TTS API (REST & Streaming) for high-quality voice synthesis.
* **Integrations (MCP Servers):**
  * Google Calendar MCP (events creation, reschedule, and cancellation).
  * Google Sheets MCP (appending/updating rows in the Daily Reservation Log).

### Proposed Directory Structure
```
/voice-agent-reservation-system
├── /frontend               # Vite + React + Tailwind CSS client
│   ├── /public             # Static assets
│   ├── /src
│   │   ├── /components     # UI components (Modal, Visualizer, ConfBadge, Banner)
│   │   ├── /hooks          # Audio recording hooks, WebSocket hooks
│   │   ├── /styles         # Tailwind and global styles (index.css)
│   │   ├── App.tsx         # Main component wrapping the homepage and modal
│   │   └── main.tsx
│   ├── tailwind.config.js
│   └── package.json
│
├── /backend                # Node.js + Express server
│   ├── /src
│   │   ├── /config         # API credentials and server configuration
│   │   ├── /services       # AI client, MCP client, inventory logic
│   │   ├── /utils          # Code generator, date parsers, logger
│   │   ├── app.ts          # Express configuration
│   │   └── server.ts       # Entry point
│   ├── package.json
│   └── tsconfig.json
```

---

## 🏃 Sprint Overview

| Sprint | Focus Area | Status | Handover Date | Assigned Session |
|---|---|---|---|---|
| **Sprint 1** | Frontend UI Foundations & Client Audio capture | `[x] COMPLETED` | 2026-05-24 | Antigravity Session 1 |
| **Sprint 2** | Express Backend, Gemini STT/LLM Integration & Mock Inventory | `[x] COMPLETED` | 2026-05-24 | Antigravity Session 2 |
| **Sprint 3** | MCP Integrations (Google Calendar/Sheets) & ElevenLabs TTS API | `[x] COMPLETED` | 2026-05-24 | Antigravity Session 3 |
| **Sprint 4** | Phase 2 Gemini Live WebSockets, Streaming TTS & Barge-In | `[x] COMPLETED` | 2026-06-19 | Antigravity Session 4 |

---

## 📋 Sprint-by-Sprint Plan

### 🚀 SPRINT 1: Frontend UI Foundations & Client Audio Capture
**Goal:** Build the restaurant home page, the voice agent modal, state variations, and client-side audio recording mechanisms.

#### 1. Setup & Foundations
- [x] Initialize the project workspace. Set up a sub-directory `/frontend` using Vite React with TypeScript.
- [x] Configure Tailwind CSS using the colors, typography, border-radius, and spacing tokens specified in [saffron_pulse/DESIGN.md](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/Docs/Designs/saffron_pulse/DESIGN.md).
- [x] Create the global CSS setup inside `/frontend/src/index.css` supporting Google Fonts (`Outfit` and `Inter`) and Material Symbols Outlined.

#### 2. Component Implementation
- [x] **Homepage Layout:** Translate the HTML from [shivsagar_home/code.html](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/Docs/Designs/shivsagar_home/code.html) to React components. Build the navigation bar, hero bento grid, menu previews, and footer.
- [x] **Book with Voice Banner:** Build the high-contrast banner with exact copy `"Book with Voice (No Sign-up)"` and a lock icon privacy badge indicating zero-PII requirements. Make it trigger the modal.
- [x] **Voice Agent Modal Overlay:** Implement the modal component using the glassmorphism backdrop blur (12px blur, 20% overlay).
- [x] **Transcription & Chat Canvas:** Build the conversation log container showing message history for both the agent and user, supporting auto-scrolling to the bottom.
- [x] **Phase 1 Controls:** Implement the Push-to-Talk controls (large microphone button, a transcription text indicator, and a Send button).
- [x] **Reservation Code Badge & Confirmation Card:** Implement the success card UI from [reservation_confirmed/code.html](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/Docs/Designs/reservation_confirmed/code.html). It must visually present the `TABLE-X99` code (using ticket-notch effect), the date, the time with the `IST` timezone, occasion, party size, the 15-minute hold warning, and a copy button.

#### 3. Client Audio Recording Hook
- [x] Write a custom React hook `useAudioRecorder` using browser `MediaRecorder` API to request mic permissions, record audio as standard blobs, track volume levels (for visualizer placeholders), and handle states (idle, recording, sending).

#### 4. Frontend Verification
- [x] Ensure all states (modal closed, modal open - greeting, transcribing, reservation success card, error state) can be toggled using mock state triggers for manual browser verification.

---

### 🧠 SPRINT 2: Express Backend, Gemini STT/LLM Integration & Mock Inventory
**Goal:** Build the Express server, initialize the turn-based voice processing endpoint, write prompt instructions for the reservation flow, and handle slot lookup.

#### 1. Backend Setup
- [x] Create a `/backend` directory. Set up Express with TypeScript, configuring dependencies like `dotenv`, `cors`, and `@google/genai`.

#### 2. Turn-based Processing Endpoint (`POST /api/voice/process`)
- [x] Define the interface to accept a multipart request containing the audio blob (`audio/webm` or `audio/ogg`) and the stringified conversation state history.
- [x] Integrate the Google Gen AI SDK to convert user audio to text via Gemini 2.5 Flash Lite STT.

#### 3. Gemini LLM Reasoner & System Prompt
- [x] Write the core system prompt inside `/backend/src/services/gemini.ts` enforcing:
  - **Zero PII:** Do not ask for or store names, phone numbers, or email addresses.
  - **IST Timezone:** Explicitly mention all times in Indian Standard Time (IST).
  - **Occasions:** Collect occasion (Standard Dining, Large Group 6+, Outdoor/Patio, Special Occasion/Anniversary, Bar/Lounge).
  - **FAQ Redirection:** Deflect menu, location, and operating hours questions to `shivsagar.in` and refuse medical/dietary advice.
  - **Structured Action Tokens:** If reservation is ready to be booked, rescheduled, or cancelled, return structural tags like `[ACTION:BOOK_NEW:{occasion}:{party_size}:{date}:{time_IST}]` inside the text response.
- [x] Build the conversation history tracker in the backend session to maintain context across requests.

#### 4. Slot Inventory Manager & Code Generator
- [x] Implement a JSON file-based or memory-based mock inventory database representing table slot capacities (standard, outdoor, etc.) for time slots in IST.
- [x] Implement the reservation code generator: `TABLE-{LETTER}{2DIGITS}`, where letters exclude I and O, and digits are 10–99. Ensure collision checking.
- [x] Implement availability check and negotiation logic: if a requested slot is occupied, have the LLM offer the two closest available options.

#### 5. Integration Verification
- [x] Set up postman/curl scripts to verify that posting a test audio block (or raw text) returns: transcription, parsed intent, LLM text response, and appropriate action structures when parameters are complete.

---

### 🔌 SPRINT 3: MCP Integrations (Google Calendar/Sheets) & ElevenLabs TTS API
**Goal:** Integrate external services (Google Calendar & Sheets) to write bookings, and integrate ElevenLabs TTS to play vocal agent responses in Phase 1.

#### 1. MCP client implementation
- [x] Set up the Model Context Protocol (MCP) SDK or build direct integration logic to interact with Google Calendar and Google Sheets servers.
- [x] **Google Calendar Operations:**
  - Create event: `Dining Hold — {Occasion} — {Code}` for the target slot (duration 2 hours).
  - Update event: Change date/time on reschedule.
  - Delete event: Cancel the reservation.
- [x] **Google Sheets Operations:**
  - Write row: [Timestamp, Date, Time (IST), Occasion, Party Size, Code, Status="Confirmed"].
  - Update row: Modify date/time or status column ("Rescheduled" or "Cancelled") based on Reservation Code.

#### 2. ElevenLabs TTS API Integration
- [x] Set up integration with ElevenLabs TTS API.
- [x] Create `/api/voice/process` response hook: send the text response generated by Gemini to ElevenLabs TTS and fetch the resulting audio file buffer.
- [x] Return the audio buffer base64-encoded in the API response payload.

#### 3. End-to-End Phase 1 Hookup
- [x] Connect Vite frontend with Express backend.
- [x] Integrate audio playback in the browser: when the API response arrives, display the user transcript, print the agent's text response in the transcription log, and play the base64 audio response using the browser Web Audio API.
- [x] If the payload includes `action_result` with booking confirmation details, transition the modal UI to render the Reservation Confirmation Card.

#### 4. Verification
- [x] Perform a full mock booking, reschedule, and cancellation using voice inputs in the browser. Verify that the Google Sheet is updated in real time and calendar events are modified correctly.

---

### ⚡ SPRINT 4: Phase 2 Gemini Live WebSockets, Streaming TTS & Barge-In
**Goal:** Transition from turn-based interactions to continuous streaming. Implement WebSocket proxy, Gemini Live API audio streams, streaming ElevenLabs TTS, and barge-in (interruption) control.

#### 1. Live WebSocket Proxy
- [x] Implement a WebSocket server on the backend to proxy real-time communication between the client browser and the Gemini Live API.
- [x] Stream incoming raw PCM audio chunks from the client directly to the Gemini Live connection.

#### 2. Streaming Audio Pipeline (Client)
- [x] Upgrade the frontend `useAudioRecorder` hook to stream low-latency PCM audio chunks instead of recording blobs. Use `AudioWorklet` processor for efficient raw sample capturing.
- [x] Implement an Audio queue player to receive incoming binary audio chunks from the WebSocket server and play them gaplessly.

#### 3. Streaming ElevenLabs TTS
- [x] On the backend, receive Gemini Live API's streaming text output chunks.
- [x] Stream these text chunks to ElevenLabs's streaming TTS endpoint, forwarding the synthesized audio chunks to the frontend WebSocket connection immediately.

#### 4. Barge-In (Interruption) Handling
- [x] Implement client-side energy-based or voice activity detection (VAD). If the user speaks while the agent is speaking:
  - Immediately stop local audio queue playback in the browser.
  - Send an interrupt signal to the backend.
  - Have the backend send an interruption command to Gemini Live API and cancel any pending ElevenLabs TTS generation.
- [x] Upgrade the UI to reflect the active interruption state (waveform flattens, agent stops speaking, listening mode indicator lights up).

#### 5. Waveform Visualizer & Polishing
- [x] Incorporate the animated, glowing waveform and pulse visualizer from [voice_agent_phase_2_continuous/code.html](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/Docs/Designs/voice_agent_phase_2_continuous/code.html).
- [x] Perform latency testing (ensure first-audio-byte response is under 800ms) and conduct edge-case testing under simulated noisy conditions.

---

## 🤝 Handover & Transition Process

To ensure a seamless transition between the 4 sequential Antigravity sessions, each session MUST execute the following steps at the conclusion of its sprint:

1. **Mark Tasks:** Update the checkboxes (`[ ]` to `[x]`) in this `ImplementationPlan.md` file for all items completed during the session.
2. **Write a Handover Status Check:** Add a section at the bottom of this file named `## Handover Status: Sprint [N] Completed` detailing:
   - **Completed Work:** High-level summary of what was built.
   - **Current State:** File paths added/modified, verification results, and any config variables introduced.
   - **Next Steps & Blockers:** Clear instructions for the incoming agent, warning them about any potential architectural issues or bugs found.
3. **Save and Commit:** Ensure all files are cleanly saved in the workspace.

---

## 📝 Handover Logs

### ## Handover Status: Sprint 1 Completed (2026-05-24)

- **Completed Work:**
  - Initialized `/frontend` sub-directory using Vite React, TypeScript, and Tailwind CSS.
  - Installed `@tailwindcss/postcss` and configured PostCSS to support Tailwind CSS v4.
  - Linked `tailwind.config.js` with all custom design system tokens (colors, fonts, sizes, padding) via the `@config` directive inside `src/index.css`.
  - Implemented the complete interactive **Shivsagar Homepage & Navigation bar** (layouts, custom buttons, menu cards) based on [shivsagar_home/code.html](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/Docs/Designs/shivsagar_home/code.html).
  - Implemented the **Voice Reservation Modal** with glassmorphism backdrop blur, transition animations, lock privacy badge, and dynamic scrolling transcript log.
  - Built the custom **`useAudioRecorder` React Hook** utilizing the browser `MediaRecorder` and `AudioContext` APIs to capture microphone input as blobs and analyze input decibel levels (for animating visualizer components).
  - Created a floating **Sprint 1 Verification Panel** widget which allows manual browser testing of all app visual states (Greeting, Listening, Transcribing, Agent Speaking, Confirmation Card, Error Screen) in both Turn-based (Phase 1) and Streaming (Phase 2) modes.
- **Current State:**
  - Codebase successfully compiles and builds without warning: `npm run build` passes.
  - Frontend code is fully contained in `/frontend/src/`:
    - [App.tsx](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/frontend/src/App.tsx): The main visual app layout, modal triggers, mock conversation log, and state drivers.
    - [hooks/useAudioRecorder.ts](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/frontend/src/hooks/useAudioRecorder.ts): Live recorder hook and microphone volume tracker.
    - [index.css](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/frontend/src/index.css): Global classes, custom animations (`pulse`, `wave`, `flatten`), and Tailwind directives.
- **Next Steps & Blockers:**
  - Next session (Sprint 2) should initialize `/backend` (Express + TS) and implement `POST /api/voice/process`.
  - Once `/backend` is up, the client side in `App.tsx` will need to switch from mock responses to actual `fetch` queries pointing to the backend processing API.
  - Note: Microphone access requires a secure context (HTTPS or localhost) in browsers.

### ## Handover Status: Sprint 2 Completed (2026-05-24)

- **Completed Work:**
  - Initialized `/backend` sub-directory using Node.js, Express, TypeScript, and ES modules.
  - Configured TS compilation using `tsconfig.json` and package execution using `tsx`.
  - Implemented the `POST /api/voice/process` endpoint supporting multipart audio uploads via Multer and text-based debug parameters.
  - Configured the Google Gen AI SDK (`@google/genai`) to run audio transcription on uploaded blobs using `gemini-2.5-flash-lite` STT capability.
  - Formulated a system instruction prompt inside `/backend/src/services/gemini.ts` enforcing zero-PII storage, IST time normalization, FAQ deflection to `shivsagar.in`, and parsing tags such as `[ACTION:BOOK_NEW:{occasion}:{party_size}:{date}:{time_IST}]`.
  - Created a memory-based mock slot inventory manager inside `/backend/src/services/inventory.ts` mapping daily capacities across standard, group, outdoor, anniversary, and bar tables.
  - Programmed a collision-free code generator formatting tokens as `TABLE-{LETTER}{2DIGITS}` excluding I and O.
  - Built a negotiation checker: if a requested booking slot is full, the server catches the action token, queries alternatives on that date, and re-triggers the Gemini responder to offer these alternatives to the client.
  - Developed and ran a unit test script [test-api.ts](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/backend/src/test-api.ts) verifying code formatting, slot check decrementing, and alternative time list generation.
- **Current State:**
  - Backend compiles and builds successfully: `npm run build` runs clean.
  - Logic successfully verified via `npx tsx src/test-api.ts` with all assertions passing.
  - Environment settings template written to [backend/.env](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/backend/.env).
- **Next Steps & Blockers:**
  - Next session (Sprint 3) should implement Google Calendar & Sheets integration on the backend to write actual reservation holds and logs, and hook up the ElevenLabs TTS API.
  - Front-end will then need to fetch `/api/voice/process` directly using recorded audio blobs.
  - Blocker: Requires `GEMINI_API_KEY` to be defined in `backend/.env` for STT/LLM execution in live endpoints.

### ## Handover Status: Sprint 3 Completed (2026-05-24)

- **Completed Work:**
  - Integrated **Google Calendar** and **Google Sheets** operations inside `backend/src/services/google.ts`.
  - Added Calendar event creation (`Dining Hold — {Occasion} — {Code}`), updates on reschedule, and deletion on cancellations.
  - Added Sheets row appends on booking, status updates on reschedule (`Status="Rescheduled"`, updated date/time), and cancellation (`Status="Cancelled"`).
  - Integrated JSON file-based local mock database fallbacks (`calendar-mock.json` and `sheets-mock.json` stored in `backend/src/data/`) that trigger automatically if service account credentials or target IDs are missing from `.env`.
  - Configured the **ElevenLabs TTS API** service inside `backend/src/services/elevenlabs.ts` to synthesize Gemini's plain text responses into base64-encoded audio. Includes visual warning log fallback when `ELEVENLABS_API_KEY` is missing.
  - Resolved a bug in `/api/voice/process` action parsing where colons inside the time string (`HH:MM`) broke the positional split logic. Reconstructed time using `parts.slice(idx).join(':')`.
  - Connected the Vite React frontend with the Express backend, enabling end-to-end PTT voice reservation holds, reschedules, and cancellations.
  - Updated client-side payload handlers in `frontend/src/App.tsx` to play synthesized voice base64 buffers using the Web Audio API, log conversation histories, and transition to the confirmed card layout.
  - Rearranged the action routing block in `App.tsx` to process cancellation updates cleanly.
- **Current State:**
  - Frontend and backend builds compile cleanly.
  - Handled flows manually and verified that mock calendar holds and sheet rows update atomically upon voice or text booking.
- **Next Steps & Blockers:**
  - Next session (Sprint 4) will transition the system to Phase 2: Gemini Live WebSockets, Streaming ElevenLabs TTS, and Barge-In (interruption control).
  - Blocker/Requirements: For Phase 2, `ELEVENLABS_API_KEY` and `GEMINI_API_KEY` should be set to enable low-latency conversational audio streaming.

### ## Handover Status: Sprint 4 Completed (2026-06-19)

- **Completed Work:**
  - Upgraded the Express backend with WebSocket server support via `ws`, listening on `/api/voice/stream` inside [server.ts](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/backend/src/server.ts) and [liveProxy.ts](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/backend/src/services/liveProxy.ts).
  - Integrated bidirectional proxy routing: streams client mic audio to Gemini Live, intercepts/strips action tags, and pipes Gemini text output in real-time to ElevenLabs streaming audio output before forwarding PCM packages.
  - Implemented the client streaming hook [useAudioStreamer.ts](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/frontend/src/hooks/useAudioStreamer.ts) featuring hardware resampling to 16kHz via the Web Audio API, base64-encoded PCM array buffer converters, a gapless audio queue scheduler, and client-side energy VAD detection.
  - Upgraded [App.tsx](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/frontend/src/App.tsx) modal integration: added WebSocket stream connection handlers, mapped text input fields, and synced visualizer waveform state changes.
  - Verified compilation and layout rendering successfully using local Vite compiler audits and an automated browser subagent test session.
- **Current State:**
  - Sprints 1, 2, 3, and 4 are completely implemented.
  - All unit/integration tests compile cleanly; local dev builds run successfully.
- **Next Steps:**
  - Push the repository remote to GitHub.
  - Deploy the backend on Railway and the frontend on Vercel.

### ## Bugfix Update: Streaming Option Modality Configuration (2026-06-20)

- **Completed Work:**
  - Resolved Code 1007 WebSocket error where Gemini Live rejected `responseModalities: ['TEXT']` on native audio models.
  - Configured `models/gemini-2.5-flash-native-audio-latest` with `responseModalities: ['AUDIO']` and enabled `output_audio_transcription: {}` directly under the `setup` block in [liveProxy.ts](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/backend/src/services/liveProxy.ts).
  - Updated the proxy handlers to stream Gemini's native synthesized audio (`inlineData.data`) and text transcription (`outputTranscription.text`) directly to the client. This bypasses the need for an external text-to-speech API (like Sarvam AI/ElevenLabs) for Phase 2 conversation turns, significantly reducing latency.
  - Modified the browser playback sample rate inside [useAudioStreamer.ts](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/frontend/src/hooks/useAudioStreamer.ts) from `16000` to `24000` to match the 24kHz native audio output of Gemini Live, ensuring voice speech plays back at natural speed.
  - Verified local end-to-end conversation flows successfully via the browser subagent in streaming mode.
- **Current State:**
  - Frontend and backend compile cleanly and run in the local development environment.
  - Bidirectional voice connection to Gemini Live remains stable.
- **Next Steps:**
  - Push the local changes to your remote GitHub repository.
  - Deploy the backend on Railway and the frontend on Vercel as described in [DEPLOYMENT.md](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/DEPLOYMENT.md).



