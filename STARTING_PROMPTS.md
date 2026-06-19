# Starting Prompts for Sequential Antigravity Sessions

This file contains the initial prompts to feed into each sequential session. Use these prompts to bootstrap the corresponding session.

---

## 🚀 Session 1 Prompt (Sprint 1: Frontend UI & Client Audio Capture)

```markdown
You are Antigravity, a coding assistant. We are starting a project to build the Shivsagar Voice-Enabled Table Reservation Agent. 

Your task is to execute **Sprint 1** of the implementation plan. 

Please follow these steps:
1. Read the Product Requirements Document in [PRD_C.md](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/Docs/PRD_C.md) and the Design System Guidelines in [DESIGN_G.md](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/Docs/Designs/DESIGN_G.md) to understand the requirements and brand identity.
2. Read the master [ImplementationPlan.md](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/ImplementationPlan.md) in the workspace root. Look for the "SPRINT 1" section.
3. Inspect the pre-generated static design HTML files in [shivsagar_home/code.html](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/Docs/Designs/shivsagar_home/code.html), [voice_agent_phase_2_continuous/code.html](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/Docs/Designs/voice_agent_phase_2_continuous/code.html), and [reservation_confirmed/code.html](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/Docs/Designs/reservation_confirmed/code.html).
4. Initialize the `/frontend` Vite React project with TypeScript and Tailwind CSS. Translate the HTML designs and Tailwind classes into modular React components (Homepage, VoiceModal, VoiceVisualizer, ConfirmationCard).
5. Implement the client-side audio recording mechanisms using browser `MediaRecorder` API to capture microphone inputs. Set up mock states so the user can click through all UI steps (closed, listening, transcribing, reservation confirmed success).
6. Verify your implementation by running a local dev server and testing the layouts.
7. Before finishing, update [ImplementationPlan.md](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/ImplementationPlan.md):
   - Mark all Sprint 1 checkbox items as completed (`[x]`).
   - Add a `## Handover Status: Sprint 1 Completed` section at the bottom of the file detailing the directory layout, how components are linked, visual states built, and what variables/states the backend will need to interact with.
```

---

## 🧠 Session 2 Prompt (Sprint 2: Backend & Gemini Text Integration)

```markdown
You are Antigravity, a coding assistant. We are working on the Shivsagar Voice-Enabled Table Reservation Agent. 

Your task is to execute **Sprint 2** of the implementation plan.

Please follow these steps:
1. Read the Product Requirements Document in [PRD_C.md](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/Docs/PRD_C.md) to review reservation flow specifications, and read [ImplementationPlan.md](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/ImplementationPlan.md) to inspect the handover status from Sprint 1.
2. Verify the directory layout and ensure the frontend components are running.
3. Initialize the `/backend` directory using Node.js + Express with TypeScript.
4. Implement a `POST /api/voice/process` endpoint to accept multipart requests containing audio blobs and stringified conversation history. Use Gemini 2.5 Flash Lite STT to transcribe user voice input.
5. Create a robust system prompt for Gemini 2.5 Flash Lite LLM that enforces: zero-PII collection (names, numbers, emails are prohibited), IST timezone confirmation, occasion/size slots gathering, deflecting menu/hours queries to `shivsagar.in`, and printing structured tags like `[ACTION:BOOK_NEW:{occasion}:{party_size}:{date}:{time_IST}]` on booking ready.
6. Build a JSON/in-memory database to store restaurant slot capacities and implement a collision-resistant reservation code generator (`TABLE-{LETTER}{2DIGITS}`). Integrate slot verification: if a selected slot is full, the agent must negotiate and offer alternative slots.
7. Verify backend functions using mock requests or curl scripts to test transcription parsing, slot checks, and LLM text responses.
8. Before finishing, update [ImplementationPlan.md](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/ImplementationPlan.md):
   - Mark all Sprint 2 checkbox items as completed (`[x]`).
   - Add a `## Handover Status: Sprint 2 Completed` section at the bottom of the file detailing backend routes, system prompt structure, action parsing format, and the database schema.
```

---

## 🔌 Session 3 Prompt (Sprint 3: MCP Integrations & ElevenLabs TTS)

```markdown
You are Antigravity, a coding assistant. We are working on the Shivsagar Voice-Enabled Table Reservation Agent. 

Your task is to execute **Sprint 3** of the implementation plan.

Please follow these steps:
1. Read the Product Requirements Document in [PRD_C.md](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/Docs/PRD_C.md) and inspect [ImplementationPlan.md](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/ImplementationPlan.md) to read the handover status from Sprint 2.
2. Review the backend and frontend code to understand current routing and processing schemas.
3. Integrate Google Calendar and Google Sheets API operations on the backend (using Google's client SDKs or configuring MCP server integrations as specified). Make the backend write Calendar entries (`Dining Hold — {Occasion} — {Code}`) and Google Sheets reservation logs (Status Confirmed/Rescheduled/Cancelled) using the unique code.
4. Integrate the ElevenLabs TTS API into the backend processing flow: send the text generated by Gemini to ElevenLabs to synthesize voice audio, and return it base64-encoded to the client.
5. Connect frontend and backend: play ElevenLabs's base64 voice responses in the browser upon receiving the process API payload, update the chat log, and render the confirmation card if the backend returns a successful booking.
6. Verify the end-to-end turn-based voice booking, reschedule, and cancel flows manually.
7. Before finishing, update [ImplementationPlan.md](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/ImplementationPlan.md):
   - Mark all Sprint 3 checkbox items as completed (`[x]`).
   - Add a `## Handover Status: Sprint 3 Completed` section at the bottom of the file summarizing Google API / MCP server setups, ElevenLabs authentication parameters, client-side playback mechanisms, and the state of the PTT system.
```

---

## ⚡ Session 4 Prompt (Sprint 4: Phase 2 WebSockets, Streaming & Barge-In)

```markdown
You are Antigravity, a coding assistant. We are working on the Shivsagar Voice-Enabled Table Reservation Agent. 

Your task is to execute the final **Sprint 4** of the implementation plan, transitioning the agent to a streaming, continuous listening interface.

Please follow these steps:
1. Read [PRD_C.md](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/Docs/PRD_C.md) and inspect [ImplementationPlan.md](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/ImplementationPlan.md) to understand current state and the handover details from Sprint 3.
2. Set up a WebSocket proxy on the backend to establish a persistent bidirectional connection between the browser and the Gemini Live API.
3. Modify the frontend hook to capture raw PCM audio chunks continuously and stream them over WebSockets instead of using the MediaRecorder blob-posting route. Implement a client-side player for gapless playback of incoming audio chunks.
4. Integrate ElevenLabs Streaming TTS to synthesize audio dynamically as Gemini Live text streams back to the backend proxy.
5. Implement client-side Barge-In support: detect voice energy during agent speaking, immediately halt browser playback, notify the backend to cancel current TTS generation, and reset Gemini Live to active listening.
6. Redesign the voice modal UI using the glowing audio visualizer and waveform pulse components from [voice_agent_phase_2_continuous/code.html](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/Docs/Designs/voice_agent_phase_2_continuous/code.html).
7. Test latency metrics, interruption responsiveness, and handle edge cases (e.g. socket reconnects and noisy environments).
8. Before finishing, update [ImplementationPlan.md](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/ImplementationPlan.md):
   - Mark all Sprint 4 checkbox items as completed (`[x]`).
   - Add a `## Handover Status: Sprint 4 Completed` section at the bottom of the file summarizing the final streaming WebSocket architecture, barge-in thresholds, and validation findings. Write a final walkthrough of the application.
```
