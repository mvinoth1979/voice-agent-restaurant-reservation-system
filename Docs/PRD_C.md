# PRD: Shiv Sagar Voice Reservation Agent
### Product Requirements Document — v1.0
**Prepared for:** Shiv Sagar Restaurant  
**Date:** May 2026  
**Status:** Draft for Review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Why This Product Will Work](#2-why-this-product-will-work)
3. [Market Landscape & Alternatives](#3-market-landscape--alternatives)
4. [User Pain Points & Anecdotes](#4-user-pain-points--anecdotes)
5. [Goals & Success Metrics](#5-goals--success-metrics)
6. [Product Scope & Features](#6-product-scope--features)
7. [Voice Agent Design — Intents & Flows](#7-voice-agent-design--intents--flows)
8. [Technical Architecture](#8-technical-architecture)
9. [Edge Cases & Constraints](#9-edge-cases--constraints)
10. [Phase 1: Push-to-Speak MVP](#10-phase-1-push-to-speak-mvp)
11. [Phase 2: Streaming Conversational Agent](#11-phase-2-streaming-conversational-agent)
12. [Go-to-Market Plan](#12-go-to-market-plan)
13. [Risks & Mitigations](#13-risks--mitigations)
14. [Appendix](#14-appendix)

---

## 1. Executive Summary

Shiv Sagar is a high-traffic restaurant that receives a significant volume of reservation requests across phone, WhatsApp, and walk-in channels. Managing these bookings manually is error-prone, time-consuming for staff, and frustrating for diners who must wait on hold or repeat information to multiple people.

This document outlines the requirements for a **voice-enabled table reservation assistant** embedded directly on the Shiv Sagar website. The assistant handles the full reservation lifecycle — booking, rescheduling, and cancellation — through a natural voice conversation, without collecting any personally identifiable information. It automatically writes reservation details to Google Calendar and a Google Sheets log via MCP integrations and issues the guest a unique Reservation Code.

The product ships in two phases:

- **Phase 1 (Push-to-Speak):** User clicks a microphone button, speaks, clicks send; the agent processes and responds. Simple, reliable, no streaming complexity.
- **Phase 2 (Live Streaming):** Full duplex streaming via Gemini Live API. The agent listens continuously, handles interruptions, and responds with near-zero latency — a phone-like experience in the browser.

**Technology Stack:** Gemini 2.5 Flash Lite (STT + LLM), ElevenLabs Streaming (TTS), Google Calendar MCP, Google Sheets MCP.

---

## 2. Why This Product Will Work

### 2.1 The Reservation Problem at Scale

Restaurants in the 100–300 cover range are caught in a bind: they are too busy to rely entirely on walk-ins, but too small to justify enterprise reservation platforms that cost ₹30,000–₹80,000/month and require dedicated staff training. The current reality at most mid-market Indian restaurants is a patchwork of WhatsApp messages to the manager, a physical ledger behind the counter, and the occasional Google Form that no one checks in time.

The result: double-bookings, forgotten reservations, miscommunicated table sizes, and no-shows with no accountability mechanism.

### 2.2 Diners Are Already Comfortable with Voice

India's voice adoption curve has accelerated dramatically. Over 500 million Indians now regularly use voice search (Google India, 2024). Familiarity with voice assistants — through Google Assistant, Siri, and JioVoice — has reduced the friction of talking to a bot. The key difference is context: a voice agent *on a restaurant's own website* with a clear, narrow purpose (reservations only) is far less intimidating than a general-purpose assistant.

### 2.3 Zero PII = Zero Friction

Most reservation systems ask for a phone number and full name, which creates hesitation among privacy-conscious users and regulatory complexity for the restaurant. This product issues a **Reservation Code** instead. The diner presents the code at arrival. No database of personal information to manage, no DPDP Act compliance overhead for PII storage, no risk of data leakage.

### 2.4 Autonomous Backend Execution

The agent doesn't just collect information — it acts on it. By writing directly to Google Calendar and Google Sheets via MCP, the system eliminates the manual transcription step that is the single biggest source of errors in restaurant reservations. A kitchen manager who opens their daily sheet in the morning sees a complete, accurate log populated overnight.

### 2.5 The Right Moment for This Technology

Gemini 2.5 Flash Lite offers a very favorable quality-to-cost ratio for real-time voice tasks. ElevenLabs's Indian-English TTS produces natural, accent-appropriate speech that diners in India will trust more than generic American-accented voice models. The combination makes this product buildable at low operating cost while feeling premium.

---

## 3. Market Landscape & Alternatives

### 3.1 Existing Reservation Platforms

| Platform | Type | Pricing (approx.) | Key Gap for Shiv Sagar |
|---|---|---|---|
| **Dineout / EazyDiner** | Marketplace + booking widget | Commission per cover + SaaS fee | Third-party marketplace; discoverability drives traffic away from direct brand; no voice; PII-heavy |
| **Resy** | SaaS reservation management | $249–$899/mo USD | US-centric; no voice; complex onboarding; no Indian TTS |
| **OpenTable** | Marketplace + SaaS | Per-cover fees; ~$249/mo base | Same marketplace problems; expensive; no voice |
| **Typeform / Google Forms** | DIY form-based | Free–$50/mo | No real-time confirmation; no calendar integration; no voice; UX is poor on mobile |
| **WhatsApp chatbots (Interakt, Wati)** | Messaging | ₹2,500–₹8,000/mo | Text only; requires WhatsApp Business API approval; limited flow control; no TTS |
| **Custom IVR systems** | Telephony | ₹15,000+ setup | DTMF only; terrible UX; requires phone number management; no web presence |
| **Kore.ai / Yellow.ai** | Enterprise voice bot platform | ₹40,000–₹1,50,000/mo | Built for enterprise call centers; gross overkill; requires 3-month implementation |

### 3.2 Why None of These Work Here

1. **Marketplace platforms** take a cut of revenue and train diners to book via the platform rather than directly, eroding the restaurant's direct relationship with guests.
2. **SaaS platforms** are priced for US/EU markets and don't understand the Indian dining context (IST timezone, Indian English accents, occasion types relevant to Indian dining culture).
3. **Form and messaging bots** lack the immediacy and conversational quality that reduces abandonment.
4. **Enterprise voice platforms** are 10x overkill for a single-restaurant deployment.

This product fills a clear gap: a **lightweight, voice-first, directly-hosted reservation agent** built specifically for the Indian mid-market restaurant context.

---

## 4. User Pain Points & Anecdotes

### 4.1 The Diner Perspective

**Anecdote 1 — The Unanswered Call**
> *"I tried calling Shiv Sagar three times on a Friday evening. The line was busy each time. I ended up going to a competitor and later heard from a friend that Shiv Sagar does have tables but the phone was just never picked up."*
> — Feedback paraphrased from common restaurant review patterns on Zomato.

This is the single most common failure mode. A restaurant that is actually full does not lose revenue, but a restaurant where the phone rings out loses bookings to competitors unnecessarily.

**Anecdote 2 — The Special Occasion Miss**
> *"We were planning a surprise anniversary dinner. I called and the person who picked up didn't note that it was an anniversary. We arrived and were seated at a regular table near the entrance. The whole surprise was ruined."*

Without structured data capture (occasion type, special notes), nuanced requirements fall through the cracks in manual booking.

**Anecdote 3 — The No-Confirmation Anxiety**
> *"I booked over WhatsApp and the manager said 'noted'. I wasn't sure if my table was actually confirmed or not. I arrived and found the table wasn't held."*

Lack of a confirmation artifact (a code, a calendar invite, a receipt) breeds anxiety and erodes trust.

**Anecdote 4 — The Noisy Caller**
> *"I was trying to book while commuting on the metro. I had to step off the train to repeat my details three times because whoever was on the other end couldn't hear me."*

Phone-based reservations fail in noisy real-world environments. A browser-based voice agent with noise suppression on the client side handles this more gracefully.

### 4.2 The Restaurant Manager Perspective

**Anecdote 5 — The Double-Booking Disaster**
> *"Two families showed up for the same 8:30 table. Someone had written the second booking on a scrap of paper and forgot to cross-reference the ledger. We had to split them up and one family left upset."*

Manual ledger management at peak hours is error-prone. An automated system that writes atomically to a single source of truth prevents this class of error.

**Anecdote 6 — The Post-Service Reconciliation**
> *"Every night after service I have to go through WhatsApp messages, call logs, and the physical book to figure out who actually came and who was a no-show. It takes 45 minutes and I often miss things."*

Structured digital logs (Google Sheets daily reservation log) eliminate this post-service reconciliation burden.

**Anecdote 7 — The Menu Call Flood**
> *"Maybe 40% of reservation calls turn into menu questions. What's the vegetarian option, is there a kids menu, what time do you open. My staff spend half the call on things the website already answers."*

The voice agent's explicit refusal to answer menu/timings questions (redirecting to shivsagar.in) deflects this load entirely.

---

## 5. Goals & Success Metrics

### 5.1 Primary Goals

| # | Goal | Rationale |
|---|---|---|
| G1 | Reduce unanswered/abandoned reservation attempts to near-zero | The agent is always available; no phone to ring out |
| G2 | Eliminate manual data entry for reservations | MCP integrations write directly to Calendar and Sheets |
| G3 | Issue every confirmed booking a Reservation Code | Creates accountability, enables frictionless arrival |
| G4 | Handle cancellations and reschedules without staff involvement | Reduces manager interruptions during service |
| G5 | Respect user privacy — no PII collected | Regulatory simplicity; user trust |

### 5.2 Success Metrics

#### Phase 1 Metrics (Push-to-Speak)
| Metric | Baseline (Day 0) | 30-Day Target | 90-Day Target |
|---|---|---|---|
| Reservation completion rate (starts booking → receives code) | N/A (new product) | ≥ 60% | ≥ 75% |
| Avg. turns to complete a booking | N/A | ≤ 8 | ≤ 6 |
| Agent error rate (misunderstood intent) | N/A | ≤ 20% | ≤ 10% |
| Google Calendar entry accuracy | N/A | 100% | 100% |
| Google Sheets log accuracy | N/A | 100% | 100% |
| Staff time spent on manual booking entry | Baseline TBD | −50% | −80% |

#### Phase 2 Metrics (Streaming)
| Metric | Phase 1 Baseline | Phase 2 Target |
|---|---|---|
| First-response latency | < 3s (PTT processing) | < 800ms (streaming) |
| Interruption handling success rate | N/A | ≥ 90% |
| Booking completion rate | ≥ 75% | ≥ 85% |
| User-reported conversation naturalness (CSAT) | N/A | ≥ 4.0/5.0 |
| Background noise robustness | Basic | High (VAD + noise suppression) |

#### Business Metrics (Both Phases)
| Metric | 6-Month Target |
|---|---|
| % of all reservations going through voice agent | ≥ 40% |
| Reduction in no-shows (vs. unconfirmed WhatsApp bookings) | ≥ 25% |
| Monthly cost of operating voice agent | < ₹5,000/month |
| Manager hours saved per week on reservation admin | ≥ 5 hours |

---

## 6. Product Scope & Features

### 6.1 Web Application

The voice agent is embedded in a **dedicated Reservation page** on the Shiv Sagar website (or as a floating widget on all pages).

#### Must-Have Features
- **Voice Agent Widget:** Embeddable chat/voice component accessible from any page
- **Push-to-Speak Interface (Phase 1):** Large, accessible microphone button; visual recording indicator; send button
- **Live Streaming Interface (Phase 2):** Always-on listening mode; animated voice waveform; barge-in/interrupt support
- **Conversation Transcript Panel:** Running text transcript of the conversation (agent + user turns)
- **Reservation Confirmation Card:** Displayed in UI when booking is confirmed — shows Reservation Code, date/time, occasion, 15-minute hold notice
- **Cancellation/Reschedule Flow UI:** Allows user to enter an existing code and trigger the appropriate intent
- **Redirect Banner:** Prominent link to shivsagar.in for menu/hours queries

#### Nice-to-Have Features
- **Code Copy Button:** One-tap copy of Reservation Code
- **Calendar Export:** "Add to my calendar" button (.ics export) after confirmation
- **Animated Avatar:** Simple animated character for the agent to increase warmth
- **Session Persistence:** Conversation state preserved on page refresh within session

### 6.2 Voice Agent

#### Supported Intents

| Intent | Trigger Phrases | Description |
|---|---|---|
| `book_new` | "I want to book a table", "Reserve a table", "Can I get a table for..." | Full new booking flow |
| `reschedule_reservation` | "I want to change my reservation", "Can I move my booking", "Reschedule TABLE-B99" | Modifies existing reservation using code |
| `cancel_reservation` | "Cancel my reservation", "I want to cancel TABLE-B99", "I can't make it" | Cancels existing reservation using code |
| `check_availability` | "Are you free on Saturday at 8?", "What slots do you have for Sunday?" | Availability inquiry without commitment |
| `general_faq_deflect` | Menu questions, timings, location questions | Deflects to shivsagar.in |

#### Occasion Types Supported
1. Standard Dining
2. Large Group (6+ guests)
3. Outdoor / Patio
4. Special Occasion / Anniversary
5. Bar / Lounge

---

## 7. Voice Agent Design — Intents & Flows

### 7.1 Master Conversation Flow

```
START
  │
  ▼
GREET
"Welcome to Shiv Sagar! I'm your table reservation assistant.
 Would you like to make a new booking, check availability,
 or manage an existing reservation?"
  │
  ├── book_new ──────────────────────────────────────────────┐
  ├── reschedule_reservation ──── [Collect Code] ────────┐   │
  ├── cancel_reservation ─────── [Collect Code] ──────┐  │   │
  └── check_availability ──────────────────────────┐  │  │   │
                                                   │  │  │   │
```

### 7.2 `book_new` Flow

```
COLLECT OCCASION
"What kind of dining experience are you looking for?
 Standard dining, a large group, outdoor or patio seating,
 a special occasion like an anniversary, or the bar and lounge?"

  → Standard Dining / Large Group / Outdoor / Special Occasion / Bar Lounge

COLLECT PARTY SIZE
"How many guests will be joining?"

  → [number] (validate: Large Group requires ≥ 6; flag if mismatch with occasion)

COLLECT DATE/TIME PREFERENCE
"What day and time were you thinking? Please mention IST."

  → Parse: today/tomorrow/day-of-week + time
  → Normalize to specific date + time slot in IST

CHECK AVAILABILITY (mock inventory lookup)
  ├── Slot available → Offer it
  │   "We have a table available on [Date] at [Time] IST. Shall I confirm that for you?"
  │
  └── Slot NOT available → Offer two nearest available slots
      "That slot is taken, but I can offer you [Slot A] IST or [Slot B] IST.
       Which would you prefer?"

CONFIRM SELECTION
"Just to confirm: [Occasion], [Party Size] guests, [Date] at [Time] IST.
 Does that sound right?"

  → Yes → EXECUTE BOOKING
  → No  → RESTART date/time collection

EXECUTE BOOKING
  1. Generate Reservation Code: TABLE-{LETTER}{2DIGITS} (e.g., TABLE-B99)
  2. MCP → Google Calendar: Create event
     Title: "Dining Hold — {Occasion} — {Code}"
     Date/Time: confirmed slot (IST)
     Duration: 2 hours (default)
     Status: Tentative
  3. MCP → Google Sheets (Daily Reservation Log): Append row
     Columns: [Timestamp, Date, Time (IST), Occasion, Party Size, Code, Status=Confirmed]
  4. Respond to user:
     "Your table is reserved! Your Reservation Code is {Code}.
      Please quote this code when you arrive. We'll hold the table for 15 minutes
      past your booking time. Have a wonderful dining experience at Shiv Sagar!"

END
```

### 7.3 `reschedule_reservation` Flow

```
COLLECT CODE
"Please share your Reservation Code — it looks like TABLE-B99."

LOOK UP RESERVATION (Sheets lookup by code)
  ├── Found → Confirm current booking details
  │   "I found your reservation: [Occasion] on [Date] at [Time] IST.
  │    What would you like to change it to?"
  │
  └── Not found → 
      "I couldn't find that code. Could you double-check it?
       Codes look like TABLE-B99."

COLLECT NEW DATE/TIME PREFERENCE
  → [Same as book_new date/time collection + availability check]

CONFIRM NEW SLOT
EXECUTE RESCHEDULE
  1. MCP → Google Calendar: Update event to new slot
  2. MCP → Google Sheets: Update row — Status=Rescheduled, new Date/Time
  3. Respond:
     "Done! Your reservation {Code} has been moved to [New Date] at [New Time] IST.
      The table will be held for 15 minutes. See you then!"
```

### 7.4 `cancel_reservation` Flow

```
COLLECT CODE
LOOK UP RESERVATION
CONFIRM CANCELLATION INTENT
"I found your reservation for [Occasion] on [Date] at [Time] IST.
 Are you sure you want to cancel?"

  → Yes → EXECUTE CANCELLATION
           1. MCP → Google Calendar: Delete / mark event as Cancelled
           2. MCP → Google Sheets: Update row — Status=Cancelled
           3. Respond: "Your reservation {Code} has been cancelled.
                        We hope to welcome you at Shiv Sagar another time!"
  → No  → Return to main menu
```

### 7.5 `check_availability` Flow

```
COLLECT DATE/TIME PREFERENCE
CHECK AVAILABILITY (mock inventory)
REPORT AVAILABLE SLOTS
"On [Date], we have availability at [Slot A], [Slot B], and [Slot C] IST.
 Would you like me to book one of those for you?"

  → Yes → Transition to book_new from COLLECT OCCASION step
  → No  → "No problem! Visit shivsagar.in or come back anytime to book."
```

### 7.6 Greeting Script (Full)

```
"Hello and welcome to Shiv Sagar! I'm your table reservation assistant.
 I can help you book a new table, check availability, or manage an existing
 reservation using your Reservation Code.
 What would you like to do today?"
```

### 7.7 Overflow & Edge Handling Scripts

| Situation | Agent Response |
|---|---|
| No slots on requested date | "I'm sorry, we're fully booked on [Date]. Would you like to try [Date+1] or [Date+2] instead?" |
| Ambiguous date ("this weekend") | "Just to confirm — do you mean Saturday [Date] or Sunday [Date], all times in IST?" |
| Large group < 6 | "For groups of 6 or more I'd recommend selecting Large Group. For [N] guests, Standard Dining works perfectly. Which shall I go with?" |
| Medical/allergy query | "I'm not able to provide medical or nutritional advice. For specific dietary concerns, please contact the restaurant directly through shivsagar.in." |
| Menu / timings query | "For the full menu, restaurant hours, and location details, please visit shivsagar.in — all the information is there!" |
| Unrecognized input (3 attempts) | "I'm having trouble understanding. Let me connect you to our reservations page where you can also fill a form. Visit shivsagar.in." |
| User interrupts mid-speech | [Agent stops immediately] "Of course, go ahead." |

---

## 8. Technical Architecture

### 8.1 System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser (User's Device)                      │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              React Web Application                        │   │
│  │                                                           │   │
│  │  ┌──────────────┐    ┌──────────────────────────────┐   │   │
│  │  │  Voice Widget │    │   Conversation Transcript     │   │   │
│  │  │  (Phase 1:    │    │   + Reservation Card UI       │   │   │
│  │  │  Push-to-Talk)│    └──────────────────────────────┘   │   │
│  │  │  (Phase 2:    │                                        │   │
│  │  │  Streaming)   │                                        │   │
│  │  └──────┬───────┘                                        │   │
│  └─────────┼──────────────────────────────────────────────┘   │
│            │ WebRTC / MediaStream API                           │
│            │ (Phase 2: WebSocket / WebRTC to Gemini Live)       │
└────────────┼────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend API Server (Node.js)                 │
│                                                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │  Session Manager│  │  Reservation      │  │  Slot Inventory│  │
│  │  + State Store  │  │  Code Generator   │  │  (Mock DB/    │  │
│  └────────┬────────┘  └────────┬─────────┘  │  Sheets-backed)│  │
│           │                    │             └───────────────┘  │
│           ▼                    ▼                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    MCP Orchestrator                       │   │
│  └───────────────┬────────────────────┬────────────────────┘   │
│                  │                    │                          │
│         ┌────────▼──────┐    ┌────────▼──────┐                 │
│         │ Google Calendar│    │ Google Sheets  │                 │
│         │ MCP Server    │    │ MCP Server     │                 │
│         └───────────────┘    └────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI / Voice Services                            │
│                                                                   │
│  Phase 1:                          Phase 2:                      │
│  ┌─────────────────────────┐      ┌──────────────────────────┐  │
│  │ Gemini 2.5 Flash Lite   │      │ Gemini Live API           │  │
│  │  - STT (audio → text)   │      │  (bidirectional streaming  │  │
│  │  - LLM (text → text)    │      │   STT + LLM in one conn.) │  │
│  └─────────────────────────┘      └──────────────────────────┘  │
│  ┌─────────────────────────┐      ┌──────────────────────────┐  │
│  │ ElevenLabs Streaming TTS    │      │ ElevenLabs Streaming TTS      │  │
│  │  (text → Indian-English │      │  (streaming audio chunks) │  │
│  │   audio, non-streaming) │      └──────────────────────────┘  │
│  └─────────────────────────┘                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Data Flow — Phase 1 (Push-to-Speak)

```
1. User presses MIC → MediaRecorder captures audio → User presses SEND
2. Browser POSTs audio blob to /api/voice/process
3. Backend sends audio to Gemini 2.5 Flash Lite STT → transcription text
4. Backend sends [system prompt + conversation history + transcription] to Gemini 2.5 Flash Lite LLM
5. LLM returns: {intent, next_state, response_text, actions[]}
6. Backend executes actions (MCP Calendar write, Sheets write, code generation) if any
7. Backend sends response_text to ElevenLabs TTS → audio buffer
8. Backend returns {transcript, response_text, audio_base64, reservation_data?} to browser
9. Browser plays audio; displays transcript + any reservation card
```

### 8.3 Data Flow — Phase 2 (Streaming)

```
1. Browser opens WebSocket/WebRTC connection to Gemini Live API (via backend proxy)
2. Browser streams raw PCM audio chunks continuously
3. Gemini Live handles VAD (voice activity detection) internally
4. On detected user utterance → Gemini processes STT + LLM in-stream
5. LLM response chunks streamed back to backend
6. Backend streams response_text chunks to ElevenLabs TTS → audio chunks
7. Audio chunks streamed to browser and played in order via AudioWorklet
8. On barge-in (user speaks while agent is speaking):
   - Browser detects audio input → sends interrupt signal
   - Backend cancels pending ElevenLabs TTS stream
   - Gemini Live resets to listening state
9. Actions (MCP writes) triggered when LLM emits action tokens
```

### 8.4 Reservation Code Generation

```javascript
// Format: TABLE-{LETTER}{2DIGITS}
// Letter: A–Z (excluding I, O to avoid confusion)
// Digits: 10–99
// Collision check against active reservations in Sheets

function generateReservationCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // 24 chars, no I/O
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const digits = String(Math.floor(Math.random() * 90) + 10); // 10–99
  return `TABLE-${letter}${digits}`;
}
```

### 8.5 System Prompt (Core LLM Instruction)

```
You are the table reservation assistant for Shiv Sagar restaurant.
Your ONLY functions are: book_new, reschedule_reservation,
cancel_reservation, and check_availability.

RULES:
- Never ask for names, phone numbers, email addresses, or any PII.
- All times must be stated in IST (Indian Standard Time).
- Always repeat the date and time clearly on confirmation.
- If asked about food, menu, allergies, nutrition, or restaurant hours,
  redirect to shivsagar.in.
- Refuse medical/nutritional advice entirely.
- If no slots are available, offer the next available day.
- Speak clearly and concisely; this will be converted to speech.
- Do not use markdown, bullet points, or special characters in responses.
- Reservation Codes follow the format TABLE-X99.
- When you have all information to book, emit: [ACTION:BOOK_NEW:{occasion}:{party_size}:{date}:{time_IST}]
- When cancelling, emit: [ACTION:CANCEL:{code}]
- When rescheduling, emit: [ACTION:RESCHEDULE:{code}:{new_date}:{new_time_IST}]
```

### 8.6 Mock Slot Inventory Schema

```json
{
  "2026-05-25": {
    "18:00": { "standard": 3, "large_group": 1, "outdoor": 2, "special": 1, "bar": 4 },
    "19:00": { "standard": 2, "large_group": 0, "outdoor": 1, "special": 2, "bar": 4 },
    "20:00": { "standard": 0, "large_group": 0, "outdoor": 0, "special": 1, "bar": 2 },
    "21:00": { "standard": 4, "large_group": 1, "outdoor": 1, "special": 0, "bar": 3 }
  }
}
```

### 8.7 Google Sheets Log Schema

| Column | Type | Example |
|---|---|---|
| Timestamp | ISO DateTime | 2026-05-25T19:32:00+05:30 |
| Reservation Date | Date | 2026-05-26 |
| Reservation Time (IST) | Time | 20:00 IST |
| Occasion | Enum | Special Occasion/Anniversary |
| Party Size | Integer | 4 |
| Reservation Code | String | TABLE-K47 |
| Status | Enum | Confirmed / Cancelled / Rescheduled |
| Session ID | UUID | sess_abc123 (no PII, internal only) |

---

## 9. Edge Cases & Constraints

### 9.1 Privacy Constraints

| Constraint | Implementation |
|---|---|
| No names collected | System prompt prohibits asking; LLM trained to deflect attempts to volunteer names |
| No phone numbers collected | Same as above |
| No email addresses collected | Same as above |
| Session ID only for internal logging | UUID, not tied to any identity |
| Audio not stored | Audio is processed in-flight; no recording persisted on server |

### 9.2 Conversation Edge Cases

| Edge Case | Handling Strategy |
|---|---|
| User speaks before agent finishes (Phase 2) | Voice Activity Detection triggers interrupt; agent stops TTS; resumes listening |
| Background noise triggers false VAD (Phase 2) | Gemini Live's built-in noise suppression; confidence threshold on STT |
| User provides time in ambiguous format ("evening") | Agent asks for clarification: "When you say evening, do you mean around 7 PM, 8 PM, or later?" |
| User says "today" at 10 PM (no slots left) | Agent detects no available slots for today, automatically offers tomorrow |
| User provides code in wrong format | Agent prompts: "Codes look like TABLE-B99. Could you try again?" |
| User asks to book for a past date | Agent flags it: "That date has already passed. Did you mean [same day next week]?" |
| Large group size given but occasion is Standard | Agent suggests correcting occasion to Large Group; user can override |
| Repeated misunderstanding (3+ turns) | Agent offers fallback: "I'm having trouble. You can also reserve at shivsagar.in." |
| MCP write fails (network error) | Agent informs user of failure, provides code verbally and asks them to save it; logs error; auto-retry |
| Slot taken between offer and confirmation (race condition) | Re-check availability on confirmation; if taken, offer next two available |
| User attempts medical/allergy advice | Hard refusal: "I can only help with table reservations. For dietary concerns please contact the restaurant via shivsagar.in." |
| User speaks non-English (Hindi, Tamil, etc.) | Phase 1: Gemini STT handles multilingual input; respond in English. Phase 2 (future): add language detection + ElevenLabs Hindi/Tamil TTS |

### 9.3 Technical Edge Cases

| Edge Case | Handling |
|---|---|
| Browser microphone permission denied | Clear error UI: "Please allow microphone access and reload the page." |
| Slow network / high latency in Phase 1 | Loading spinner; timeout after 15s with retry prompt |
| WebSocket disconnect in Phase 2 | Auto-reconnect with exponential backoff; conversation state preserved in backend session |
| ElevenLabs TTS API unavailable | Fallback to browser Web Speech API (less natural); notify user of degraded experience |
| Gemini API rate limit hit | Queue request; show "just a moment" message; max 10s wait before error |
| Google Calendar MCP auth expired | Backend alerts; email notification to admin; log manual code for staff to enter |
| Duplicate reservation code generated | Retry code generation up to 5 times; if all collide (extremely unlikely), use timestamp-based suffix |

---

## 10. Phase 1: Push-to-Speak MVP

### 10.1 Objectives

- Validate the reservation flow end-to-end
- Prove MCP integrations work reliably
- Establish baseline conversation completion rates
- Ship in < 4 weeks

### 10.2 User Experience

```
[Reservation Page]

┌─────────────────────────────────────────────────────────────┐
│                   🍽️ Reserve Your Table                       │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Agent: "Welcome to Shiv Sagar! I'm your table     │    │
│  │  reservation assistant. Would you like to make a    │    │
│  │  new booking, check availability, or manage an     │    │
│  │  existing reservation?"                             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  You: [transcript appears here after send]          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│         ┌─────────────────────────────────────┐              │
│         │  🎙️  Hold to speak, then tap SEND   │              │
│         │                                       │              │
│         │    [● RECORD]        [► SEND]         │              │
│         └─────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### 10.3 Technical Milestones

| Week | Deliverable |
|---|---|
| Week 1 | Backend API skeleton; Gemini 2.5 Flash Lite STT + LLM integration; system prompt tuning |
| Week 1 | Mock slot inventory; reservation code generator; conversation state machine |
| Week 2 | Google Calendar MCP integration; Google Sheets MCP integration; end-to-end booking flow |
| Week 2 | Cancel and reschedule flows; code lookup in Sheets |
| Week 3 | ElevenLabs TTS integration; audio playback in browser |
| Week 3 | React UI: voice widget, transcript panel, reservation confirmation card |
| Week 4 | End-to-end testing (all 5 intents, all edge cases); performance tuning; internal demo |
| Week 4 | Soft launch (internal staff testing); bug fixes; documentation |

### 10.4 API Contracts

**POST /api/voice/process**
```json
Request:
{
  "session_id": "sess_uuid",
  "audio": "base64_encoded_webm",
  "conversation_history": [ {"role": "user|agent", "content": "..."} ]
}

Response:
{
  "transcript": "I'd like to book a table for Saturday",
  "agent_text": "What kind of dining experience...",
  "agent_audio": "base64_encoded_mp3",
  "action_result": null | { "code": "TABLE-B99", "date": "...", "time_ist": "..." },
  "conversation_history": [ ... ]
}
```

---

## 11. Phase 2: Streaming Conversational Agent

### 11.1 Objectives

- Sub-800ms first-audio-byte latency from end of user speech
- Barge-in / interruption handling
- Natural conversation rhythm without push-to-talk friction
- Background noise robustness via Gemini Live's built-in VAD + noise suppression

### 11.2 Technology Choices

| Component | Phase 1 | Phase 2 | Rationale for Change |
|---|---|---|---|
| STT | Gemini 2.5 Flash Lite (REST, per-request) | Gemini Live API (WebSocket, streaming) | Eliminates STT round-trip; Live API processes audio as it arrives |
| LLM | Gemini 2.5 Flash Lite (REST) | Gemini Live API (same connection) | STT + LLM fused in single streaming session; no inter-service latency |
| TTS | ElevenLabs (REST, full response) | ElevenLabs Streaming (chunked HTTP/WebSocket) | First audio chunk plays while rest is still being generated |
| Audio Pipeline | MediaRecorder → Blob → POST | AudioWorklet → PCM chunks → WebSocket | Low-latency raw PCM streaming |

### 11.3 Streaming Architecture

```
Browser                     Backend (Proxy)              Gemini Live         ElevenLabs Streaming
  │                              │                             │                     │
  │──── WebSocket connect ──────>│                             │                     │
  │                              │──── Live API connect ──────>│                     │
  │                              │                             │                     │
  │──── PCM audio chunks ───────>│──── audio chunks ─────────>│                     │
  │                              │                             │── (VAD detects      │
  │                              │                             │    end of speech)   │
  │                              │<─── text chunks ───────────│                     │
  │                              │──── text chunks ────────────────────────────────>│
  │                              │<────────────────────────── audio chunks ─────────│
  │<─── audio chunks ───────────│                             │                     │
  │     (plays immediately)      │                             │                     │
  │                              │                             │                     │
  │── (user speaks / barge-in) ─>│                             │                     │
  │                              │──── interrupt signal ──────>│                     │
  │                              │──── cancel TTS stream ──────────────────────────>│
  │                              │                             │                     │
```

### 11.4 Barge-In Implementation

```javascript
// AudioWorklet processor detects energy above threshold while agent is speaking
// → sends interrupt message to backend
// → backend sends cancellation to Gemini Live and ElevenLabs
// → clears audio playback queue
// → agent enters listening state

const BARGE_IN_ENERGY_THRESHOLD = 0.02;
const BARGE_IN_SUSTAINED_MS = 150; // 150ms of audio above threshold = real speech
```

### 11.5 Phase 2 Milestones

| Week | Deliverable |
|---|---|
| Week 1 (of Phase 2) | Gemini Live API integration; WebSocket audio pipeline; VAD testing |
| Week 2 | ElevenLabs Streaming TTS; audio chunk playback with AudioWorklet |
| Week 2 | Barge-in detection and interrupt handling |
| Week 3 | UI upgrade: animated waveform, always-on listening indicator, visual barge-in feedback |
| Week 3 | Noise robustness testing (simulated metro, restaurant, outdoor environments) |
| Week 4 | End-to-end Phase 2 testing; latency benchmarking; CSAT survey integration |
| Week 4 | Phase 2 launch; Phase 1 deprecated (or kept as fallback for unsupported browsers) |

---

## 12. Go-to-Market Plan

### 12.1 Pre-Launch (2 Weeks Before Phase 1)

**Internal Preparation**
- Staff training: Show kitchen/floor staff how to look up reservations in Google Sheets
- Calendar setup: Configure the Google Calendar "Dining Reservations" calendar shared with manager
- Sheets setup: Create the "Daily Reservation Log" sheet with correct column schema
- MCP auth: Set up OAuth credentials for Calendar + Sheets MCP servers

**Technical Validation**
- 50 internal test reservations across all occasion types
- Verify all MCP writes are accurate
- Voice quality review with 3–5 team members (accent, background noise)
- Load test: 20 concurrent sessions

### 12.2 Phase 1 Launch

**Soft Launch (Week 1)**
- Widget live on reservation page; URL shared with 20 regular customers for feedback
- Manager monitors Google Sheets daily log manually; verifies accuracy
- Feedback form embedded below widget; collect 30 responses

**Public Launch (Week 2)**
- Announcement on Shiv Sagar's Instagram and Google Business Profile
- Post content: "Book your table instantly with our new voice assistant — no call, no wait, no forms."
- Table tent cards in restaurant: QR code linking to reservation page
- Staff verbally tell departing guests: "You can now reserve your next table by voice on our website."

### 12.3 Marketing Channels

| Channel | Message | Timing |
|---|---|---|
| Instagram / Facebook | Short video demo of voice booking in 30 seconds | Phase 1 launch week |
| Google Business Profile | Updated reservation link to new voice page | Pre-launch |
| WhatsApp broadcast (opt-in past guests) | "Try our new voice booking — skip the call!" | Phase 1 week 2 |
| In-restaurant QR codes (table tents, receipt footer, menu insert) | "Reserve your next table by voice" | Phase 1 launch |
| Zomato / Swiggy partner page description | Mention voice booking option | Phase 1 launch |
| Local food blogger / influencer | Invite 2–3 Chennai food bloggers for a demo dinner | Phase 2 launch |

### 12.4 Phase 2 Launch

**Narrative Shift:** "From booking a table to having a real conversation with Shiv Sagar."

- 15-second Instagram Reel showing natural back-and-forth voice conversation
- Side-by-side: "Old way (phone call with hold music)" vs "New way (instant voice agent)"
- Feature in Chennai food tech / restaurant industry newsletter if applicable

### 12.5 Pricing & Operating Costs

| Service | Estimated Monthly Cost |
|---|---|
| Gemini 2.5 Flash Lite (STT + LLM) | ₹1,500–₹3,000 (at ~500 reservations/month) |
| ElevenLabs Streaming TTS | ₹500–₹1,500 |
| Backend hosting (small VPS / Cloud Run) | ₹800–₹1,500 |
| Google Workspace (Calendar + Sheets) | Already in use |
| **Total** | **~₹3,000–₹6,000/month** |

This compares to ₹30,000–₹80,000/month for enterprise alternatives — a **5–15x cost advantage**.

---

## 13. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Users don't trust speaking to a bot for reservations | Medium | High | Clear branding ("Powered by Shiv Sagar"); instant confirmation card; easy fallback to shivsagar.in |
| Gemini Live API latency spikes in India | Medium | High | Backend deployed in asia-south1 (Mumbai); monitor p95 latency; fallback to Phase 1 PTT mode |
| ElevenLabs TTS quality regression on updates | Low | Medium | Pin to specific API version; monitor with automated audio quality checks |
| MCP calendar/sheets write failures | Low | High | Retry logic; admin alert on failure; fallback code delivery via on-screen display |
| Users attempt to book with PII (volunteer their name) | High | Low | System prompt instructs LLM to acknowledge but not store; PII is never written to any backend |
| Double booking due to race condition | Low | High | Distributed lock on slot during confirmation window (Redis-based, 30s TTL) |
| Voice agent hallucinating menu prices / availability | Medium | Medium | Strict system prompt with grounding rules; FAQ deflect to shivsagar.in; no menu data in context |
| Browser microphone not supported (old devices) | Low | Low | Graceful degradation to text-only chat interface |
| Regulatory change on voice data in India | Low | Medium | Audio is never persisted; architecture is designed for zero data retention |

---

## 14. Appendix

### 14.1 Reservation Code Alphabet

Letters used: A B C D E F G H J K L M N P Q R S T U V W X Y Z  
*(I and O excluded to avoid confusion with 1 and 0)*

Format: `TABLE-[LETTER][DIGIT][DIGIT]` → 24 × 90 = **2,160 unique active codes**  
This is sufficient for any restaurant's concurrent active reservations.

### 14.2 Occasion Type → Table Configuration Mapping

| Occasion | Min Tables | Setup Notes |
|---|---|---|
| Standard Dining | 2-person or 4-person table | Default setup |
| Large Group (6+) | Combined 6–10 person setup | Requires advance arrangement; agent notes this in Sheets |
| Outdoor / Patio | Patio section tables | Weather-dependent (future: check weather API) |
| Special Occasion / Anniversary | Preferred corner or private nook | Agent adds note to Calendar event |
| Bar / Lounge | Bar counter or high-top tables | No minimum party size constraint |

### 14.3 IST Timezone Handling

All times collected from users are assumed to be IST unless stated otherwise. The system prompt enforces this. All Calendar events are created with timezone `Asia/Kolkata`. All Sheets entries include the IST suffix explicitly.

### 14.4 Future Roadmap (Post-Phase 2)

| Feature | Priority | Notes |
|---|---|---|
| Hindi + Tamil language support | High | ElevenLabs supports Hindi/Tamil TTS natively |
| Weather-aware outdoor seating | Medium | Integrate weather API; warn if rain forecast |
| Waitlist management | Medium | "We're full but add you to the waitlist" flow |
| No-show follow-up | Low | Requires some form of contact — conflicts with no-PII rule; review policy |
| Voice agent on WhatsApp (WABA) | High | Majority of Indian diners prefer WhatsApp; same voice backend |
| Occasion-aware table dressing | Low | Pass occasion flag to kitchen via Sheets; staff act on it |
| Dynamic slot pricing | Low | Require deeper integration with POS |
| Multi-restaurant support | Medium | Franchise expansion; multi-tenant architecture from Phase 1 |

### 14.5 Accessibility Considerations

- **Keyboard navigation:** All UI elements (mic button, send button, transcript) are keyboard-accessible
- **Screen reader support:** ARIA labels on all interactive elements; transcript updates announced via `aria-live`
- **Font size:** Minimum 16px body text; transcript uses 14px minimum
- **Color contrast:** WCAG AA compliant on all text + background combinations
- **Text fallback:** Users who cannot use voice can switch to text input mode

---

*Document Owner: Product Team, Shiv Sagar*  
*Last Updated: May 2026*  
*Next Review: After Phase 1 Soft Launch*
