import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { SYSTEM_PROMPT } from './gemini.js';
import { 
  checkAvailability, 
  reserveSlot, 
  getAlternativeSlots, 
  generateCode, 
  releaseCode 
} from './inventory.js';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  appendSheetRow,
  updateSheetRowStatus
} from './google.js';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
const SARVAM_SPEAKER = (process.env.SARVAM_SPEAKER || 'anushka').trim().toLowerCase();
const SARVAM_LANGUAGE = process.env.SARVAM_LANGUAGE || 'en-IN';
export const initVoiceSocketServer = (server: Server) => {
  const wss = new WebSocketServer({ noServer: true });

  // Attach to the http server upgrade event
  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
    
    if (pathname === '/api/voice/stream') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (clientWs: WebSocket) => {
    console.log('[liveProxy] Client connected to voice stream.');
    
    let geminiWs: WebSocket | null = null;
    let ttsWs: WebSocket | null = null;
    
    let accumulatedText = '';
    let actionBuffer = '';
    let inActionTag = false;
    const sessionId = `sess_live_${Math.random().toString(36).substring(2, 10)}`;

    // Helper to send JSON safely
    const sendToClient = (event: string, data: any) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ event, data }));
      }
    };

    // Close connections cleanly
    const cleanup = () => {
      console.log('[liveProxy] Cleaning up sockets.');
      if (geminiWs) {
        try { geminiWs.close(); } catch(e) {}
        geminiWs = null;
      }
      if (ttsWs) {
        try { ttsWs.close(); } catch(e) {}
        ttsWs = null;
      }
    };

    clientWs.on('close', () => {
      console.log('[liveProxy] Client disconnected.');
      cleanup();
    });

    clientWs.on('error', (err) => {
      console.error('[liveProxy] Client WebSocket error:', err);
      cleanup();
    });

    // 1. Initialize Gemini Live connection
    if (!GEMINI_API_KEY) {
      console.error('[liveProxy] Error: GEMINI_API_KEY is not defined.');
      sendToClient('error', 'Gemini API key is not configured.');
      clientWs.close();
      return;
    }

    const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;
    
    try {
      geminiWs = new WebSocket(geminiUrl);
    } catch(err) {
      console.error('[liveProxy] Failed to create Gemini WebSocket:', err);
      sendToClient('error', 'Failed to connect to Gemini Live service.');
      clientWs.close();
      return;
    }

    // 2. Initialize TTS stream helper (Sarvam AI)
    const connectTTS = () => {
      if (!SARVAM_API_KEY) {
        console.warn('[liveProxy] WARNING: SARVAM_API_KEY is missing. Speech output will be bypassed.');
        return;
      }

      const sarvamUrl = 'wss://api.sarvam.ai/text-to-speech/ws?model=bulbul:v3';
      console.log('[liveProxy] Connecting to Sarvam AI Live WebSocket...');
      try {
        ttsWs = new WebSocket(sarvamUrl, {
          headers: {
            'api-subscription-key': SARVAM_API_KEY
          }
        });
        
        ttsWs.on('open', () => {
          console.log('[liveProxy] Connected to Sarvam AI Live TTS.');
          // Send config handshake
          ttsWs?.send(JSON.stringify({
            type: 'config',
            data: {
              target_language_code: SARVAM_LANGUAGE,
              speaker: SARVAM_SPEAKER,
              output_audio_codec: 'pcm',
              speech_sample_rate: 16000
            }
          }));
        });

        ttsWs.on('message', (data) => {
          try {
            const frame = JSON.parse(data.toString());
            if (frame.type === 'audio' && frame.data && frame.data.audio) {
              // Send the raw PCM base64 back to client
              sendToClient('audio', frame.data.audio);
            }
          } catch(e) {
            console.error('[liveProxy] Error parsing Sarvam AI response:', e);
          }
        });

        ttsWs.on('error', (err) => {
          console.error('[liveProxy] Sarvam AI WebSocket error:', err);
        });

        ttsWs.on('close', () => {
          console.log('[liveProxy] Sarvam AI WebSocket closed.');
        });
      } catch (err) {
        console.error('[liveProxy] Failed to connect to Sarvam AI:', err);
      }
    };

    connectTTS();

    // 3. Configure Gemini Live handlers
    geminiWs.on('open', () => {
      console.log('[liveProxy] Connected to Gemini Live API.');
      
      // Send session setup frame
      const setupFrame = {
        setup: {
          model: 'models/gemini-2.0-flash-exp',
          generationConfig: {
            responseModalities: ['TEXT'] // We want text output to stream to ElevenLabs
          },
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          }
        }
      };
      
      geminiWs?.send(JSON.stringify(setupFrame));
      sendToClient('ready', 'Connected and ready.');
    });

    geminiWs.on('message', async (data) => {
      try {
        const response = JSON.parse(data.toString());
        
        // Handle Gemini streaming content
        if (response.serverContent) {
          const modelTurn = response.serverContent.modelTurn;
          if (modelTurn && modelTurn.parts) {
            for (const part of modelTurn.parts) {
              if (part.text) {
                const text = part.text;
                
                // Parse and strip action tags in real-time
                let cleanText = '';
                for (let i = 0; i < text.length; i++) {
                  const char = text[i];
                  if (char === '[') {
                    inActionTag = true;
                    actionBuffer = '[';
                  } else if (char === ']') {
                    inActionTag = false;
                    actionBuffer += ']';
                    
                    // Parse action token
                    await processLiveAction(actionBuffer, sendToClient, sessionId);
                    actionBuffer = '';
                  } else {
                    if (inActionTag) {
                      actionBuffer += char;
                    } else {
                      cleanText += char;
                    }
                  }
                }
                
                if (cleanText) {
                  accumulatedText += cleanText;
                  sendToClient('transcript', cleanText);
                  
                  // Forward clean text to TTS stream
                  if (ttsWs && ttsWs.readyState === WebSocket.OPEN) {
                    ttsWs.send(JSON.stringify({
                      type: 'text',
                      data: { text: cleanText }
                    }));
                  }
                }
              }
            }
          }
          
          // Complete Turn
          if (response.serverContent.turnComplete) {
            console.log(`[liveProxy] Gemini turn complete: "${accumulatedText}"`);
            
            // Flush TTS stream
            if (ttsWs && ttsWs.readyState === WebSocket.OPEN) {
              ttsWs.send(JSON.stringify({
                type: 'flush'
              }));
            }
            accumulatedText = '';
          }
        }
        
        // Handle Gemini interruption signal (VAD triggered)
        if (response.serverContent?.interrupted) {
          console.log('[liveProxy] Gemini live channel reports interruption.');
          sendToClient('interrupted', 'Gemini reports model interruption.');
          // Restart TTS to dump active generation
          if (ttsWs) {
            try { ttsWs.close(); } catch(e) {}
            connectTTS();
          }
        }
      } catch(err) {
        console.error('[liveProxy] Error parsing Gemini Live response:', err);
      }
    });

    geminiWs.on('error', (err) => {
      console.error('[liveProxy] Gemini Live WebSocket error:', err);
      sendToClient('error', 'Lost connection to Gemini Live server.');
      clientWs.close();
    });

    geminiWs.on('close', () => {
      console.log('[liveProxy] Gemini Live connection closed.');
      clientWs.close();
    });

    // 4. Handle client actions
    clientWs.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.event === 'audio') {
          // Client streaming raw PCM audio (base64)
          if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
            geminiWs.send(JSON.stringify({
              realtimeInput: {
                mediaChunks: [{
                  mimeType: 'audio/pcm;rate=16000',
                  data: message.data
                }]
              }
            }));
          }
        } 
        
        else if (message.event === 'text') {
          // Client fallback text typed in
          if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
            geminiWs.send(JSON.stringify({
              clientContent: {
                turns: [{
                  role: 'user',
                  parts: [{ text: message.data }]
                }],
                turnComplete: true
              }
            }));
          }
        }
        
        else if (message.event === 'interrupt') {
          // VAD Interruption signal from client
          console.log('[liveProxy] Client triggered interruption.');
          
          // Reset TTS socket
          if (ttsWs) {
            try { ttsWs.close(); } catch(e) {}
            connectTTS();
          }
          
          // Send interrupt frame to Gemini Live if active
          if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
            // Note: The Live API handles interruptions by receiving user media chunks, 
            // but we can explicitly reset the turn state by closing/reopening or sending a client turn
            // We notify Gemini by sending empty clientContent to clear output queues
            geminiWs.send(JSON.stringify({
              clientContent: {
                turns: [],
                turnComplete: false
              }
            }));
          }
        }
      } catch(err) {
        console.error('[liveProxy] Error processing client message:', err);
      }
    });
  });
};

/**
 * Handle structural reservation actions emitted from the live model text stream.
 */
async function processLiveAction(action: string, sendToClient: (event: string, data: any) => void, sessionId: string) {
  console.log(`[liveProxy] Parsing action token: ${action}`);
  try {
    if (action.startsWith('[ACTION:BOOK_NEW:')) {
      const sliced = action.slice(17, -1);
      const parts = sliced.split(':');
      const occasion = parts[0] || 'Standard Dining';
      const partySize = parseInt(parts[1] || '2', 10);
      const date = parts[2] || '';
      const time = parts.slice(3).join(':');
      
      const { available } = checkAvailability(date, time, occasion, partySize);
      
      if (available) {
        const success = reserveSlot(date, time, occasion, partySize);
        if (success) {
          const code = generateCode();
          console.log(`[liveProxy] Reservation created via streaming: ${code}`);
          
          await createCalendarEvent(occasion, date, time, code);
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
          
          sendToClient('action_result', {
            code,
            date,
            time_ist: `${time} (IST)`,
            occasion: `${occasion} (Party of ${partySize})`
          });
        }
      }
    } 
    
    else if (action.startsWith('[ACTION:CANCEL:')) {
      const code = action.slice(15, -1).trim();
      let normalizedCode = code.toUpperCase();
      if (!normalizedCode.startsWith('TABLE-')) {
        normalizedCode = `TABLE-${normalizedCode}`;
      }
      
      const success = releaseCode(normalizedCode);
      if (success) {
        await deleteCalendarEvent(normalizedCode);
        await updateSheetRowStatus(normalizedCode, 'Cancelled');
      }
      
      sendToClient('action_result', {
        status: 'cancelled',
        code: normalizedCode
      });
    } 
    
    else if (action.startsWith('[ACTION:RESCHEDULE:')) {
      const sliced = action.slice(19, -1);
      const parts = sliced.split(':');
      const code = parts[0] || '';
      let normalizedCode = code.trim().toUpperCase();
      if (!normalizedCode.startsWith('TABLE-')) {
        normalizedCode = `TABLE-${normalizedCode}`;
      }
      const date = parts[1] || '';
      const time = parts.slice(2).join(':');
      
      const { available } = checkAvailability(date, time, "Standard Dining", 2);
      if (available) {
        reserveSlot(date, time, "Standard Dining", 2);
        await updateCalendarEvent(normalizedCode, date, time);
        await updateSheetRowStatus(normalizedCode, 'Rescheduled', date, time);
        
        sendToClient('action_result', {
          status: 'rescheduled',
          code: normalizedCode,
          date,
          time_ist: `${time} (IST)`
        });
      }
    }
  } catch(err) {
    console.error('[liveProxy] Action processing failed:', err);
  }
}
