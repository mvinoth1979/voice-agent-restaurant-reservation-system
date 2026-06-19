import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { transcribeAudio, generateAgentResponse, ChatMessage } from './services/gemini.js';
import { 
  checkAvailability, 
  reserveSlot, 
  getAlternativeSlots, 
  generateCode, 
  releaseCode 
} from './services/inventory.js';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  appendSheetRow,
  updateSheetRowStatus
} from './services/google.js';
import { synthesizeText } from './services/elevenlabs.js';

const app = express();

app.use(cors());
app.use(express.json());

// Set up multer for in-memory audio storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // limit 10MB
  }
});

// Main process endpoint
app.post('/api/voice/process', upload.single('audio'), async (req, res) => {
  let conversationHistory: ChatMessage[] = [];
  try {
    const historyJson = req.body.conversation_history;
    const sessionId = req.body.session_id || `sess_${Math.random().toString(36).substring(2, 10)}`;
    
    if (historyJson) {
      conversationHistory = JSON.parse(historyJson);
    }
    
    let userText = '';
    
    // 1. Transcribe audio if uploaded
    if (req.file) {
      console.log(`Received audio file: ${req.file.originalname}, size: ${req.file.size} bytes`);
      try {
        userText = await transcribeAudio(req.file.buffer, req.file.mimetype || 'audio/webm');
        console.log(`Transcribed text: "${userText}"`);
      } catch (err: any) {
        console.error("Transcription failed, returning fallback error response:", err);
        const errorText = "I am having trouble transcribing your voice due to a connection limit. Please try typing in the chat below or visit shivsagar.in.";
        res.json({
          transcript: "[Transcription Error]",
          agent_text: errorText,
          agent_audio: null,
          action_result: null,
          conversation_history: conversationHistory
        });
        return;
      }
    } else if (req.body.text) {
      // Fallback for text-based triggers
      userText = req.body.text;
      console.log(`Received fallback text input: "${userText}"`);
    } else {
      res.status(400).json({ error: "Missing audio file or text input." });
      return;
    }

    if (!userText.trim()) {
      const emptyText = "I did not catch that. Could you please repeat?";
      const emptyAudio = await synthesizeText(emptyText);
      res.json({
        transcript: "",
        agent_text: emptyText,
        agent_audio: emptyAudio,
        action_result: null,
        conversation_history: conversationHistory
      });
      return;
    }

    // 2. Initial prompt generation
    let { text: agentText, action } = await generateAgentResponse(conversationHistory, userText);
    let actionResult = null;

    // 3. Structured Action Processing (Interception, Inventory, Calendar & Sheets writes)
    if (action) {
      console.log(`Gemini emitted Action: ${action}`);
      
      if (action.startsWith('[ACTION:BOOK_NEW:')) {
        // Format: [ACTION:BOOK_NEW:{occasion}:{party_size}:{date}:{time_IST}]
        const sliced = action.slice(17, -1);
        const parts = sliced.split(':');
        const occasion = parts[0] || 'Standard Dining';
        const partySize = parseInt(parts[1] || '2', 10);
        const date = parts[2] || '';
        const time = parts.slice(3).join(':');
        
        console.log(`Parsing booking: Occasion=${occasion}, PartySize=${partySize}, Date=${date}, Time=${time}`);
        
        const { available } = checkAvailability(date, time, occasion, partySize);
        
        if (available) {
          // A. Confirm reservation in local memory
          const success = reserveSlot(date, time, occasion, partySize);
          if (success) {
            const code = generateCode();
            
            // B. Write to Google Calendar
            console.log(`[INTEGRATION] Writing calendar event for ${code}...`);
            await createCalendarEvent(occasion, date, time, code);
            
            // C. Write to Google Sheets
            console.log(`[INTEGRATION] Appending log row in Google Sheets for ${code}...`);
            await appendSheetRow(
              new Date().toISOString(),
              date,
              time,
              occasion,
              partySize,
              code,
              'Confirmed',
              sessionId
            );
            
            actionResult = {
              code,
              date,
              time_ist: `${time} (IST)`,
              occasion: `${occasion} (Party of ${partySize})`
            };
            console.log(`Reserved successfully. Reservation Code: ${code}`);
          } else {
            action = null; // Internal error fallback
          }
        } else {
          // Slot is taken. Propose alternatives.
          const alternatives = getAlternativeSlots(date, occasion, partySize);
          console.log(`Slot taken. Alternatives found: ${alternatives.join(', ')}`);
          
          const supplement = `The slot at ${time} IST on ${date} is fully booked. Propose alternative slots to the user: ${alternatives.join(', ')}.`;
          
          // Re-generate response with alternative slots injection
          const regenerated = await generateAgentResponse(conversationHistory, userText, supplement);
          agentText = regenerated.text;
          action = null; // Reset action to prevent loop
        }
      } 
      else if (action.startsWith('[ACTION:CANCEL:')) {
        // Format: [ACTION:CANCEL:{code}]
        const code = action.slice(15, -1).trim();
        let normalizedCode = code.toUpperCase();
        if (!normalizedCode.startsWith('TABLE-')) {
          normalizedCode = `TABLE-${normalizedCode}`;
        }
        const success = releaseCode(normalizedCode);
        
        if (success) {
          // Delete from Google Calendar
          console.log(`[INTEGRATION] Deleting calendar event for ${normalizedCode}...`);
          await deleteCalendarEvent(normalizedCode);
          
          // Update Status in Google Sheets
          console.log(`[INTEGRATION] Updating status in Google Sheets for ${normalizedCode} to 'Cancelled'...`);
          await updateSheetRowStatus(normalizedCode, 'Cancelled');
        }
        
        actionResult = {
          status: "cancelled",
          code: normalizedCode
        };
        console.log(`Cancellation request for ${normalizedCode}: success=${success}`);
      }
      else if (action.startsWith('[ACTION:RESCHEDULE:')) {
        // Format: [ACTION:RESCHEDULE:{code}:{new_date}:{new_time_IST}]
        const sliced = action.slice(19, -1);
        const parts = sliced.split(':');
        const code = parts[0] || '';
        let normalizedCode = code.trim().toUpperCase();
        if (!normalizedCode.startsWith('TABLE-')) {
          normalizedCode = `TABLE-${normalizedCode}`;
        }
        const date = parts[1] || '';
        const time = parts.slice(2).join(':');
        
        // Check availability of new slot
        const { available } = checkAvailability(date, time, "Standard Dining", 2);
        
        if (available) {
          reserveSlot(date, time, "Standard Dining", 2);
          
          // Update Google Calendar Event
          console.log(`[INTEGRATION] Updating calendar event for reschedule: ${normalizedCode}...`);
          await updateCalendarEvent(normalizedCode, date, time);
          
          // Update Google Sheets Row
          console.log(`[INTEGRATION] Updating spreadsheet row for reschedule: ${normalizedCode}...`);
          await updateSheetRowStatus(normalizedCode, 'Rescheduled', date, time);

          actionResult = {
            status: "rescheduled",
            code: normalizedCode,
            date,
            time_ist: `${time} (IST)`
          };
          console.log(`Rescheduled ${normalizedCode} to ${date} at ${time}`);
        } else {
          const alternatives = getAlternativeSlots(date, "Standard Dining", 2);
          const supplement = `The slot at ${time} IST on ${date} is not available for reschedule. Let the user know and offer alternatives: ${alternatives.join(', ')}.`;
          
          const regenerated = await generateAgentResponse(conversationHistory, userText, supplement);
          agentText = regenerated.text;
          action = null;
        }
      }
    }

    // 4. ElevenLabs Voice Synthesis (TTS)
    console.log(`[TTS] Synthesizing response: "${agentText.substring(0, 45)}..."`);
    const agentAudio = await synthesizeText(agentText);

    // 5. Update and package history
    let historyAgentText = agentText;
    if (actionResult && actionResult.code) {
      historyAgentText += ` Your Reservation Code is ${actionResult.code}.`;
    }

    const updatedHistory: ChatMessage[] = [
      ...conversationHistory,
      { role: 'user', parts: [{ text: userText }] },
      { role: 'model', parts: [{ text: historyAgentText + (action ? ` ${action}` : '') }] }
    ];

    // Return the response payload
    res.json({
      transcript: userText,
      agent_text: agentText,
      agent_audio: agentAudio,
      action_result: actionResult,
      conversation_history: updatedHistory
    });

  } catch (error: any) {
    console.error("Endpoint Error:", error);
    res.json({
      transcript: "",
      agent_text: "I am having trouble processing that request right now. Please try again or visit shivsagar.in.",
      agent_audio: null,
      action_result: null,
      conversation_history: conversationHistory || []
    });
  }
});

export default app;
