# Voice Agent Techniques & Implementation Analysis

This document details the voice interaction, audio processing, and guardrail techniques implemented in the Shivsagar Voice Reservation Agent, explaining how they work, why certain options were chosen, and recommending future production enhancements.

---

## 📋 Technical Matrix

| Technique | Supported? | Implementation Details | Production Recommendation |
| :--- | :--- | :--- | :--- |
| **Voice Activity Detection (VAD)** | **YES** | Client-side RMS (Root Mean Square) energy calculation of microphone buffers inside `useAudioStreamer.ts`. | Migrate to a WebAssembly WebRTC VAD or a lightweight neural model (like Silero VAD) to avoid false triggers from background noise. |
| **Turn Detection** | **YES** | Native end-of-turn classification via the Gemini Live API (`turnComplete` event). | Keep native Gemini Live classification; it is highly optimized for conversational flow. |
| **Interruption Handling (Barge-In)** | **YES** | Client intercepts VAD user speech during playback, kills local audio queue, and sends an `interrupt` command to the WebSocket proxy, which resets the Gemini queue. | Add a short fade-out to client-side playback cuts instead of abrupt silent stops to make interruptions feel more natural. |
| **Background Noise Filtering** | **PARTIAL** | Configures browser-native microphone settings (`echoCancellation`, `noiseSuppression`, `autoGainControl`) in `getUserMedia`. | Implement a client-side WebAssembly noise filter (like RNNoise) to suppress kitchen clutter and dining area chatter. |
| **Multi-Speaker Diarization** | **NO** | Ignored. The reservation modal is designed as a personal single-user session. | Keep ignored. Diarization is unnecessary overhead for a personal web-based table booking assistant. |
| **Handling User Long Pauses** | **PARTIAL** | Gemini Live handles short pauses natively. For long silences, the stream continues sending zero-energy PCM bytes. | Implement a client-side silence timeout (e.g., 30s) that plays a verbal prompt ("Are you still there?") and closes the socket after 60s. |
| **Latency Optimization** | **YES** | Direct binary streaming proxy via WebSockets, persistent backend-to-Gemini connection, and native speech-to-speech audio outputs. | Host the backend proxy in a region geographically close to the user base (e.g., AWS/Railway Mumbai) to minimize round-trip times. |
| **Thinking Budgets** | **NO** | Disabled. Reasoning models with "thinking time" introduce high conversational latency (>2s), which ruins vocal fluidity. | Keep disabled. Low-latency models (`gemini-2.5-flash`) are more than sufficient for slot bookings. |
| **Streaming Pipeline** | **YES** | Bidirectional low-latency PCM audio streaming over persistent WebSocket connections. | Implement network jitter buffering on the client to smoothly handle temporary packet dropouts. |
| **Speech-to-Speech Model** | **YES** | Fully implemented using the native Gemini Live API (`gemini-2.5-flash-native-audio-latest`). | Keep. Direct speech-to-speech bypasses STT + TTS round-trip latency, enabling real-time conversations. |
| **Guardrails** | **YES** | System prompt instructions enforcing Zero PII, FAQ deflection to `shivsagar.in`, plain text outputs (no markdown), and hold policy notice. | Implement a regex-based proxy guardrail that actively masks names/numbers in the text logs as an extra layer of privacy security. |
| **Human Escalation / Transfer** | **NO** | Bypassed. Out-of-scope queries are deflected back to visiting the main restaurant site. | Implement a transfer tag (`[ACTION:TRANSFER_TO_HUMAN]`) that hooks into Twilio to route calls to the restaurant manager during errors or escalations. |

---

## 🔍 Detailed Component Analysis

### 1. Voice Activity Detection (VAD) & Interruption (Barge-In)
* **How it works:** In `useAudioStreamer.ts`, client-side VAD calculates the Root Mean Square (RMS) energy of incoming Float32 PCM sample frames. If the energy exceeds `VAD_THRESHOLD = 0.018` for a sustained period (~50-80ms), it classifies this as user speech. If the agent is currently speaking, the client immediately:
  1. Stops the local playback scheduler.
  2. Sends an `interrupt` message to the backend proxy WebSocket.
  3. The proxy sends an empty `clientContent` message to Gemini Live to abort the model's active turn and drops any pending audio packets.
* **Why it was built this way:** Doing VAD on the client side prevents latency. Sending raw voice to the server and waiting for a server-side classification would create a noticeable lag in the agent's response to interruption.

### 2. Latency Optimization: The Holy Grail
Voice interactions require a round-trip time (RTT) under **800ms** to feel conversational. We optimized this in Phase 2 by:
* **Speech-to-Speech Direct Pipeline:** Bypassing text-to-speech APIs (Sarvam AI / ElevenLabs) during active streaming. The Gemini Live API acts as the voice synthesizer itself.
* **Persistent WebSockets:** Avoiding connection handshakes (TCP/TLS) on every turn. 
* **Low-Overhead PCM:** Audio is streamed as raw 16kHz/24kHz PCM chunks rather than compressing/decompressing heavier codecs.

### 3. Agent Guardrails
The system prompt in `gemini.ts` acts as the primary guardrail manager:
* **Zero PII:** Under no circumstances are guest names, phone numbers, or email addresses collected. The system operates strictly on a unique reservation code (`TABLE-X99`). If a user provides their name, the model ignores it and continues booking.
* **FAQ Deflection:** Non-reservation queries (e.g., menu prices, directions, allergens) are deflected to prevent hallucinations. The agent states: *"For details about our menu, hours, and location, please visit shivsagar.in."*
* **Plain Text Only:** The model is forbidden from returning markdown syntax (e.g. bolding, asterisks, tables), ensuring the text remains clean for speech synthesis and subtitle logging.

### 4. Human Escalation Recommendation
While not implemented in this prototype, a telephony deployment should support human transfer.
* **Telephony Hook:** The backend proxy can listen for a structured tag `[ACTION:TRANSFER_TO_HUMAN]` emitted by the model.
* **Triggers:**
  1. **Allergy Queries:** The AI is forbidden from giving dietary/medical advice. If the customer insists on verifying nut/gluten safety, it should transfer.
  2. **Frustration / Loop Detection:** If the system fails to parse the customer's intent after 3 attempts, it triggers a transfer.
  3. **Explicit Request:** *"Let me speak to a manager."*
* **Implementation:** The backend interceptor catches the tag and sends a SIP transfer command via Twilio or Telnyx to forward the call to the front desk.
