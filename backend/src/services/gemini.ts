import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not defined in the environment.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const SYSTEM_PROMPT = `
You are the voice-enabled table reservation agent for Shiv Sagar restaurant. Your ONLY capabilities are helping users with:
1. Making a new booking (book_new)
2. Rescheduling an existing booking (reschedule_reservation)
3. Cancelling an existing booking (cancel_reservation)
4. Checking table availability (check_availability)

CRITICAL ZERO-PII RULE:
- Never ask for, collect, or record names, phone numbers, emails, or any other personal information. The restaurant operates strictly on a "Reservation Code" system. If the user volunteers their name or number, ignore it and do not store it.

RESERVATION RULES:
- All dates/times must be confirmed in IST (Indian Standard Time).
- Supported dining occasions are: "Standard Dining", "Large Group" (for 6+ guests), "Outdoor/Patio", "Special Occasion/Anniversary", "Bar/Lounge".
- If the party size is 6 or more, recommend "Large Group".
- If a slot is fully booked or unavailable, state that the slot is taken and suggest alternatives (provided in the context).
- Reservation codes follow the format TABLE-X99.
- Always remind the user of the 15-minute hold policy upon confirmation.

RESPONSE RULES:
- Do not use markdown, bullet points, asterisks, bolding, or special characters. Keep responses conversational, clear, and concise because your output will be converted to speech.
- If asked about the menu, timings, location, directions, or allergies, say: "For details about our menu, hours, and location, please visit shivsagar.in." and do not provide any details. Refuse any dietary or medical advice.

 You must emit a structured action token at the end of your response when you have gathered all details to execute a backend action. Do not attempt to search, verify, or validate the reservation code yourself. If the user provides a reservation code along with slot details for reschedule or cancellation, assume it is valid and immediately emit the corresponding ACTION tag. The backend will perform the actual database validation and return an error if necessary.
- To book a new table (when occasion, party_size, date, and slot_time are confirmed): [ACTION:BOOK_NEW:{occasion}:{party_size}:{date}:{time_IST}]
  Example: "Your table is ready to be booked. [ACTION:BOOK_NEW:Standard Dining:4:2026-05-25:19:00]"
- To cancel (when code is provided and user confirms cancellation): [ACTION:CANCEL:{code}]
  Example: "I will cancel your booking. [ACTION:CANCEL:TABLE-A23]"
- To reschedule (when code and new slot details are confirmed): [ACTION:RESCHEDULE:{code}:{new_date}:{new_time_IST}]
  Example: "I will move your table. [ACTION:RESCHEDULE:TABLE-K47:2026-05-26:18:00]"
`;

/**
 * Transcribe short voice audio using Gemini 2.5 Flash STT capability.
 */
export const transcribeAudio = async (buffer: Buffer, mimeType: string): Promise<string> => {
  try {
    // Clean mimeType of parameters like codecs
    const cleanedMimeType = mimeType.split(';')[0].trim();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: buffer.toString('base64'),
            mimeType: cleanedMimeType
          }
        },
        "You are an expert audio transcription tool. Transcribe the spoken words in the audio clip accurately. If the audio contains only background noise, static, breathing, or silence with no clear spoken words, output absolutely nothing (an empty string). Do not add any conversational replies, commentary, formatting, or explanations. Only return the raw text transcript of the spoken words."
      ]
    });
    
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini STT Error:", error);
    throw new Error("Failed to transcribe audio.");
  }
};

/**
 * Generate the next conversational turn from the agent.
 */
export const generateAgentResponse = async (
  history: ChatMessage[],
  newTranscript: string,
  contextSupplement?: string
): Promise<{ text: string; action: string | null }> => {
  try {
    // Append the user's latest text transcript
    const updatedHistory: ChatMessage[] = [
      ...history,
      {
        role: 'user',
        parts: [{ text: newTranscript + (contextSupplement ? `\n\n[Context: ${contextSupplement}]` : '') }]
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: updatedHistory.map(h => ({
        role: h.role,
        parts: h.parts
      })),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2
      }
    });

    const agentText = response.text || "";
    
    // Parse actions if any (e.g. [ACTION:BOOK_NEW:Standard Dining:4:2026-05-25:19:00])
    const actionMatch = agentText.match(/\[ACTION:[^\]]+\]/);
    const action = actionMatch ? actionMatch[0] : null;
    
    // Remove the action token from the spoken text so it is clean for TTS
    const cleanedText = agentText.replace(/\[ACTION:[^\]]+\]/g, '').trim();

    return {
      text: cleanedText,
      action: action
    };
  } catch (error) {
    console.error("Gemini LLM Error:", error);
    return {
      text: "I am having trouble processing that request. Please try again or visit shivsagar.in.",
      action: null
    };
  }
};
