import dotenv from 'dotenv';

dotenv.config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// Standard default voice: Rachel (warm female voice) or a configured custom voice
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; 
const MODEL_ID = 'eleven_turbo_v2_5'; // Fast, low latency model

/**
 * Synthesize text into voice audio using ElevenLabs REST API.
 * Returns base64 encoded audio string or null.
 */
export const synthesizeText = async (text: string): Promise<string | null> => {
  if (!ELEVENLABS_API_KEY) {
    console.log("INFO: ELEVENLABS_API_KEY is missing from environment. Skipping synthesis (client will degrade to visual-only or browser Web Speech).");
    return null;
  }

  try {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
    
    console.log(`[ELEVENLABS] Requesting speech synthesis for text: "${text.substring(0, 40)}..."`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: text,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ElevenLabs API returned error ${response.status}:`, errorText);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`[ELEVENLABS] Synthesis completed. Audio size: ${buffer.length} bytes.`);
    return buffer.toString('base64');
  } catch (error) {
    console.error("ElevenLabs Synthesis Exception:", error);
    return null;
  }
};
