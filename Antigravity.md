# Antigravity Workspace Guide: Shivsagar Voice Agent

This file outlines the core rules, architecture, and constraints for any Antigravity session working on this repository. Keep this file compact.

## 🎯 Project Overview
An AI-powered, voice-first restaurant reservation agent on the web for Shivsagar, supporting table bookings, cancellations, and reschedules with **zero collection of PII**.

## 🛠️ Tech Stack
- **Frontend:** `/frontend` (Vite + React + TS + Tailwind CSS)
- **Backend:** `/backend` (Node.js + Express + TS)
- **AI & Voice:** Gemini 2.5 Flash Lite (Phase 1 REST) / Gemini Live (Phase 2 WebSocket), ElevenLabs TTS (REST/Streaming)
- **Database/MCP:** Google Calendar & Sheets MCP servers

## ⚠️ Critical Rules (Must Always Obey)
1. **Zero PII:** Under no circumstances ask for or store guest names, phone numbers, or emails. Use a random `TABLE-{LETTER}{2DIGITS}` code (excluding letters I and O, numbers 10-99).
2. **IST Timezone:** Display and confirm all reservation dates/times in **IST (Indian Standard Time)**.
3. **No Markdown in Voice Output:** LLM responses that are read out loud must contain plain text only (no bullet points, asterisks, or markup).
4. **FAQ Deflection:** Refuse menu, timing, location, or dietary queries and redirect users to `shivsagar.in`.
5. **15-Minute Hold:** Always include the 15-minute hold warning on confirmation.

## 📁 Reference Files
- **PRD:** [Docs/PRD_C.md](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/Docs/PRD_C.md)
- **Designs:** [Docs/Designs/](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/Docs/Designs/)
- **Plan & Sprints:** [ImplementationPlan.md](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/ImplementationPlan.md)
- **Starting Prompts:** [STARTING_PROMPTS.md](file:///d:/SS/AI/Voice%20Agent%20-%20Restaurant%20reservation%20system/STARTING_PROMPTS.md)

## 🤝 Handover Protocol
At the end of your session, you MUST:
1. Update checkboxes in `ImplementationPlan.md` for completed tasks.
2. Append a progress log under `## Handover Logs` in `ImplementationPlan.md` describing completed work, current state, and next steps.
