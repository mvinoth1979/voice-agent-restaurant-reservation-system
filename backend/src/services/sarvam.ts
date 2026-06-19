import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
const SPEAKER = (process.env.SARVAM_SPEAKER || 'ritu').trim().toLowerCase();
const LANGUAGE_CODE = process.env.SARVAM_LANGUAGE || 'en-IN';

/**
 * Synthesize text into voice audio using Sarvam AI REST API.
 * Returns base64 encoded audio string (WAV format) or null.
 */
export const synthesizeTextSarvam = async (text: string): Promise<string | null> => {
  if (!SARVAM_API_KEY) {
    console.log("INFO: SARVAM_API_KEY is missing from environment.");
    return null;
  }

  try {
    const url = 'https://api.sarvam.ai/text-to-speech';

    console.log(`[SARVAM] Requesting speech synthesis for text: "${text.substring(0, 40)}..."`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        target_language_code: LANGUAGE_CODE,
        speaker: SPEAKER,
        model: 'bulbul:v3'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Sarvam AI API returned error ${response.status}:`, errorText);
      return null;
    }

    const resBody = await response.json() as any;
    if (resBody && resBody.audios && resBody.audios.length > 0) {
      console.log(`[SARVAM] Synthesis completed. Audio received.`);
      return resBody.audios[0];
    }

    return null;
  } catch (error) {
    console.error("Sarvam AI Synthesis Exception:", error);
    return null;
  }
};
