# Stitch by Google: UI Design Prompts for Shivsagar Voice Agent

Use the following prompts in Stitch by Google to generate the screens for the Shivsagar restaurant website and the integrated voice reservation agent. The design should reflect a vibrant, modern Indian restaurant (think warm saffron and deep red tones) while maintaining a highly functional, low-friction tech aesthetic.

## 1. Homepage & Entry Point
**Prompt to Stitch:**
[cite_start]"Design a modern restaurant homepage desktop and mobile web view for 'Shivsagar'. The color palette should feature an appetizing Saffron Orange (#F47920) as the primary action color, a clean Off-White (#FDFBF7) background, and Deep Charcoal (#2D2D2D) for text. The typography should use 'Outfit' for modern, bold headings and 'Inter' for highly legible body text. The hero section must feature a prominent banner with the exact copy: 'Book with Voice (No Sign-up)'[cite: 67]. [cite_start]This banner should look clickable and inviting, perhaps featuring a subtle microphone icon, emphasizing that the voice agent is hosted on the web application as a chat option to reserve a table[cite: 6]. [cite_start]Ensure the page feels fast and frictionless[cite: 9]."

## 2. Phase 1: Push-to-Talk Voice Interface Modal
**Prompt to Stitch:**
"Design a clean, centered modal window overlaying the blurred restaurant homepage. [cite_start]This is for Phase 1 of a voice reservation agent, which is a turn-based push-to-talk experience[cite: 40]. [cite_start]The UI must include a prominent, un-pressed microphone button, a text area showing transcribed text, and a 'Send' button[cite: 40]. [cite_start]The agent processes the chunk of audio, responds via voice, and the user must click again to reply[cite: 41]. [cite_start]Include a privacy badge that explicitly states 'No Phone or Email Required' to highlight the zero-PII constraint[cite: 14, 23]. Use soft shadows and rounded corners (8px radius) to make the interface feel approachable."

## 3. Phase 2: Streaming / Continuous Listening Interface
**Prompt to Stitch:**
"Design the Phase 2 version of the voice reservation agent modal. [cite_start]This version features a seamless, natural conversation where the mic remains open and the agent listens continuously[cite: 44, 45]. The UI should feature a dynamic, glowing microphone or an active audio visualizer waveform (using the primary Saffron Orange #F47920 and a secondary Warm Red #D32F2F) to indicate the system is actively listening. There should be no 'Send' button. [cite_start]The UI must clearly indicate that the user can interrupt the voice agent at any time, visually representing the system's ability to handle barge-ins and stop speaking[cite: 19, 46, 48]. Keep the UI minimal to focus on the conversation."

## 4. Success / Confirmation Screen
**Prompt to Stitch:**
"Design a success state modal for the voice reservation agent. [cite_start]The design must emphasize instant gratification[cite: 25]. [cite_start]The focal point of the screen must be a clearly displayed, unique Reservation Code styled like a ticket or badge (e.g., 'TABLE-B99')[cite: 11]. [cite_start]Below the code, display the confirmed details: the date, the time with the 'IST' time zone explicitly stated, and the dining occasion[cite: 11, 15]. [cite_start]Include a friendly confirmation message stating that the restaurant will hold the table for 15 minutes past the booking time and wishing them a great day[cite: 13, 57]. The design should feel celebratory but clean, using a subtle green success accent (#2E7D32)."