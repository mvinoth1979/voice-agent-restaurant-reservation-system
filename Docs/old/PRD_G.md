# [cite_start]Product Requirements Document (PRD): Shivsagar Voice Reservation Agent [cite: 21]

## 1. Executive Summary & Why This Works

[cite_start]This document outlines the requirements for a web-based Voice Agent designed to manage table reservations for Shivsagar restaurants[cite: 21]. [cite_start]The agent handles end-to-end booking, rescheduling, and cancellations entirely through voice, utilizing modern LLM and TTS infrastructure[cite: 22].

**Why this product will work:**
* [cite_start]**Zero-Friction Privacy:** By eliminating the need for Personally Identifiable Information (PII) like phone numbers and emails, the barrier to entry for diners drops to near zero[cite: 23].
* [cite_start]**Operational Efficiency:** It frees restaurant staff from manning the phones during peak hours, simultaneously eliminating manual data entry errors[cite: 24].
* [cite_start]**Instant Gratification:** Diners get immediate feedback on availability and instant confirmation with a unique code[cite: 25].

---

## [cite_start]2. Market Landscape & Alternatives [cite: 26]

| Alternative | Description | Shortcomings |
| :--- | :--- | :--- |
| [cite_start]**Traditional Phone Calls** [cite: 27] | [cite_start]Calling the host stand[cite: 27]. | [cite_start]High wait times, dropped calls, staff unavailable during peak rushes, language barriers[cite: 27]. |
| [cite_start]**Third-Party Apps (Zomato/Swiggy)** [cite: 28] | [cite_start]Aggregator platforms[cite: 28]. | [cite_start]Take hefty commissions, force users to create accounts, and require sharing PII[cite: 28]. |
| [cite_start]**Web Forms** [cite: 29] | [cite_start]Standard HTML forms on the restaurant site[cite: 29]. | [cite_start]Slow, tedious to fill out on mobile, lacks real-time negotiation if the preferred slot is full[cite: 30]. |

---

## [cite_start]3. User Pain Points & Anecdotes [cite: 31]

### Diners
* [cite_start]**Pain Point:** Waiting on hold or navigating clunky web interfaces just to secure a table[cite: 31].
* [cite_start]**Anecdote:** "I tried calling on a Friday evening to book a table for 6. I listened to the busy tone for 10 minutes, finally got through, and could barely hear the host over the background noise, only to be told they were fully booked." [cite: 32]

### [cite_start]Restaurant Managers [cite: 33]
* [cite_start]**Pain Point:** High abandonment rate of phone calls and manual errors in booking logs[cite: 33].
* [cite_start]**Anecdote:** "During our lunch rush, my front-of-house staff was so busy seating people that we missed five calls. Later, we realized two reservations were written down for the wrong day, leading to double-booked tables and angry customers." [cite: 34]

---

## [cite_start]4. Goals & Success Metrics [cite: 35]

* [cite_start]**Task Completion Rate (TCR):** Target > 85% of voice sessions ending in a successful booking, cancellation, or definitive answer[cite: 35].
* [cite_start]**Latency Phase 1:** < 2.5 seconds from user sending audio to agent response[cite: 36].
* [cite_start]**Latency Phase 2:** < 800ms Time to First Byte (TTFB) for audio response[cite: 37].
* [cite_start]**Zero PII Leakage:** 100% compliance in avoiding the collection of names, numbers, or emails[cite: 38].
* [cite_start]**Deflection Rate:** Target 100% successful redirection to shivsagar.in for menu, timing, and non-reservation inquiries[cite: 39].

---

## [cite_start]5. Phases of Implementation [cite: 40]

### [cite_start]Phase 1: Push-to-Talk (Turn-Based) [cite: 40]
* [cite_start]**Experience:** Web application interface where the user must click a microphone button, speak, and click send[cite: 40]. [cite_start]The agent processes the chunk of audio, responds via voice, and the user must click again to reply[cite: 41].
* [cite_start]**Tech Stack (STT/LLM):** Gemini 2.5 Flash Lite (fast processing for discrete text/audio turns)[cite: 42].
* [cite_start]**Tech Stack (TTS):** ElevenLabs API for localized, high-quality voice synthesis[cite: 43].
* [cite_start]**Focus:** Nailing the conversational logic, backend MCP integrations (Calendar/Sheets), and robust intent routing[cite: 44].

### [cite_start]Phase 2: Full Streaming & Conversational AI [cite: 44]
* [cite_start]**Experience:** A seamless, natural conversation[cite: 44]. [cite_start]The mic remains open[cite: 44]. [cite_start]The agent listens continuously, responds with low latency, and handles interruptions seamlessly[cite: 45].
* [cite_start]**Tech Stack (Core API):** Gemini Live API (handles multimodal streaming, Voice Activity Detection, and barge-ins)[cite: 46].
* [cite_start]**Tech Stack (TTS):** ElevenLabs Streaming (if bypassing native Live TTS for specific local accents)[cite: 47].
* [cite_start]**Focus:** Background noise filtering, handling user barge-ins (stopping the agent's speech mid-sentence), and achieving sub-second conversational latency[cite: 48].

---

## [cite_start]6. Features & Conversational Flow [cite: 49]

### [cite_start]Core Intents [cite: 49]
1.  [cite_start]**book_new**: Initiate a new reservation[cite: 49].
2.  [cite_start]**reschedule_reservation**: Change the time/date of an existing code[cite: 50].
3.  [cite_start]**cancel_reservation**: Release a booked code[cite: 50].
4.  [cite_start]**check_availability**: Query open slots for a specific day/time[cite: 51].

### [cite_start]The Standard Booking Flow [cite: 51]
1.  [cite_start]**Greeting:** Welcomes the user[cite: 51].
2.  [cite_start]**Occasion Collection:** Asks for the dining occasion (Standard Dining, Large Group 6+, Outdoor/Patio, Special Occasion/Anniversary, Bar/Lounge)[cite: 52].
3.  [cite_start]**Time Preference:** Collects preferred day and time[cite: 53].
4.  [cite_start]**Inventory Check (If available):** Offer slot[cite: 53].
5.  [cite_start]**Inventory Check (If unavailable):** Offer two closest available alternative slots[cite: 54]. 
6.  [cite_start]**Confirmation & Code Generation:** Upon user agreement, generate a random code (e.g., TABLE-B99)[cite: 54].
7.  [cite_start]**Backend Execution (Google Calendar):** Create a tentative event titled Dining Hold — {Occasion} — {Code} via MCP[cite: 55].
8.  [cite_start]**Backend Execution (Google Sheets):** Append {date, occasion, slot, code} to the "Daily Reservation Log" worksheet via MCP[cite: 56].
9.  [cite_start]**Closing:** Repeat the date/time clearly, state the timezone (IST), inform the user the table is held for 15 minutes past booking time, and wish them a great day[cite: 57].

---

## [cite_start]7. Edge Cases & Guardrails [cite: 58]

* [cite_start]**Strict Privacy Firewall:** The LLM prompt must strictly forbid asking for names, emails, or phone numbers[cite: 58]. [cite_start]If a user volunteers this information, the agent must ignore it and state it only needs the Reservation Code[cite: 59].
* [cite_start]**Time Zone Clarity:** The agent must explicitly state "IST" (Indian Standard Time) upon confirmation to avoid booking discrepancies[cite: 60].
* **Slot Overflow/Unavailable:** If the requested day is fully booked, the agent must clearly state, "We are fully booked for that day," and immediately offer availability for the preceding or following day[cite: 61].
* [cite_start]**Refusal of Medical/Allergy Advice:** If a user asks, "Is this dish safe for my severe peanut allergy?" [cite: 62][cite_start], the agent must respond: "I cannot provide medical or nutritional advice. Please consult our staff upon arrival regarding severe allergies."[cite: 63].
* **General Inquiries (Deflection):** If asked about the menu, opening hours, or location, the agent must state: "For menu details, timings, and other information, please check our website at shivsagar.in."[cite: 64].
* [cite_start]**Interruptions & Noise (Phase 2):** Voice Activity Detection (VAD) must filter out standard restaurant/street noise[cite: 65]. [cite_start]If the user speaks while the agent is generating TTS, the agent must immediately halt playback and listen to the new input[cite: 66].

---

## [cite_start]8. Go-To-Market (GTM) Plan [cite: 67]

1.  [cite_start]**Beta Launch (Web Only):** Deploy the Phase 1 web app via a prominent "Book with Voice (No Sign-up)" banner on the shivsagar.in homepage[cite: 67]. [cite_start]Monitor transcripts for drop-offs and routing errors[cite: 68].
2.  [cite_start]**In-Restaurant Awareness:** Place QR codes on table tents and receipts with the copy: "Next time, book in 30 seconds using our Voice Agent. No account, no phone number required."[cite: 68].
3.  [cite_start]**Phase 2 Rollout & Marketing Push:** Once the streaming experience is live, launch social media campaigns highlighting the conversational nature of the bot[cite: 69]. [cite_start]Focus the messaging on privacy ("We don't want your data, we just want to seat you") and speed ("Skip the hold music")[cite: 70].
4.  [cite_start]**Staff Training:** Train front-of-house staff to recognize the TABLE-XXX codes and check them against the automatically populated Google Sheet/Calendar, ensuring seamless handoff from the AI agent to the physical restaurant experience[cite: 71].
