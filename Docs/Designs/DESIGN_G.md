# Design System & Guidelines: Shivsagar Voice Reservation Agent

This document outlines the core design language, components, and user flows for the Shivsagar Voice Agent web integration. It is intended to guide the generation of UI components in Stitch by Google.

## 1. Brand Identity & Styling

* [cite_start]**Vibe:** Modern, fast, appetizing, and highly accessible. The design must reduce friction and highlight the absence of data entry[cite: 10, 23].
* **Color Palette:**
    * **Primary Action:** Saffron Orange (`#F47920`) - Used for the main microphone button, active states, and primary CTAs.
    * **Secondary/Accent:** Warm Red (`#D32F2F`) - Used for visualizers or secondary emphasis.
    * **Success:** Leaf Green (`#2E7D32`) - Used for the final reservation confirmation screen.
    * **Background:** Off-White (`#FDFBF7`) - A warm, clean background to contrast with the vibrant brand colors.
    * **Text (Primary):** Deep Charcoal (`#2D2D2D`) - For maximum readability.
    * **Text (Secondary/Muted):** Medium Gray (`#757575`) - For disclaimers and timezone information.
* **Typography:**
    * **Headings:** `Outfit` (Sans-serif, geometric, friendly).
    * **Body & UI Text:** `Inter` (Sans-serif, highly legible, neutral).

## 2. Core UI Components

* [cite_start]**Entry Banner:** A high-contrast banner placed on the `shivsagar.in` homepage[cite: 64, 67]. [cite_start]Copy must read: "Book with Voice (No Sign-up)"[cite: 67].
* [cite_start]**Voice Modal:** A responsive overlay that hosts the chat option to reserve a table[cite: 6].
    * [cite_start]*Phase 1 Controls:* Distinct "Mic" and "Send" buttons[cite: 40].
    * [cite_start]*Phase 2 Controls:* Single, persistent glowing/animated audio visualizer indicating continuous listening[cite: 44, 45].
* [cite_start]**Reservation Code Badge:** A visually distinct card or badge used on the confirmation screen to display codes like `TABLE-B99`[cite: 11].

## 3. User Flow & Screen States

[cite_start]The UI must visually support the following conversational flow[cite: 11]:

1.  [cite_start]**Idle/Entry:** User sees the "Book with Voice" banner on the homepage[cite: 67].
2.  **Greeting & Occasion Collection:** Modal opens. [cite_start]Agent asks for occasion (Standard Dining, Large Group 6+, Outdoor/Patio, Special Occasion/Anniversary, Bar/Lounge)[cite: 11]. UI displays a helpful tooltip or listening animation.
3.  [cite_start]**Time Preference & Negotiation:** Agent collects day/time preference[cite: 11]. [cite_start]UI may show a spinner during the mock inventory check[cite: 11, 53].
    * [cite_start]*Edge Case State:* If fully booked, UI reflects the agent offering two alternative slots or stating it is fully booked for that day[cite: 11, 61].
4.  [cite_start]**Confirmation State:** Display the unique Reservation Code prominently[cite: 8]. [cite_start]The UI must explicitly display the time zone as "IST" [cite: 15, 60] [cite_start]and remind the user of the 15-minute hold policy[cite: 13, 57].

## 4. Accessibility & Constraints

* [cite_start]**Privacy First:** Do not include input fields for phone numbers, emails, or names[cite: 14]. The UI should explicitly market this as a feature.
* [cite_start]**Clarity:** Ensure high contrast for all text, especially the Reservation Code and the "IST" timezone indicator[cite: 15, 60].
* [cite_start]**Barge-in Support (Phase 2):** The UI visualizer must immediately react (e.g., stop animating the agent's speech pattern) when the user interrupts the agent[cite: 19, 66].