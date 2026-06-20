import WebSocket from 'ws';
import { SYSTEM_PROMPT } from './services/gemini.js';

const apiKey = "AIzaSyCsbXmeS9y5bGVY-TWJh5pVRWR85vElp4A";
const model = "models/gemini-3.1-flash-live-preview";
const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;

console.log("Connecting to:", geminiUrl);
const ws = new WebSocket(geminiUrl);

ws.on('open', () => {
  console.log("Connected! Sending setup frame for", model);
  const setupFrame = {
    setup: {
      model: model,
      generationConfig: {
        responseModalities: ['AUDIO']
      },
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      output_audio_transcription: {}
    }
  };
  ws.send(JSON.stringify(setupFrame));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  
  if (msg.setupComplete) {
    console.log("Sending booking text query: 'Confirm a booking for Standard Dining for 4 people on 2026-06-25 at 19:00.'");
    const queryFrame = {
      clientContent: {
        turns: [{
          role: 'user',
          parts: [{ text: "Confirm a booking for Standard Dining for 4 people on 2026-06-25 at 19:00." }]
        }],
        turnComplete: true
      }
    };
    ws.send(JSON.stringify(queryFrame));
  } else if (msg.serverContent) {
    if (msg.serverContent.outputTranscription) {
      console.log(">>> TRANSCRIPTION PART:", msg.serverContent.outputTranscription.text);
    }
    if (msg.serverContent.turnComplete) {
      console.log("--- TURN COMPLETE ---");
      ws.close();
    }
  }
});

ws.on('close', (code, reason) => {
  console.log(`Connection closed. Code: ${code}, Reason: ${reason.toString()}`);
  process.exit(0);
});

ws.on('error', (err) => {
  console.error("Error:", err);
});
