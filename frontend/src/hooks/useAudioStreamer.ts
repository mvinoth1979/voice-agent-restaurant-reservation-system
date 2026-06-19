import { useState, useRef, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const WS_URL = API_URL.replace(/^http/, 'ws') + '/api/voice/stream';

export interface UseAudioStreamerProps {
  onTranscriptReceived?: (text: string) => void;
  onActionResultReceived?: (data: any) => void;
  onInterrupted?: () => void;
  onReady?: () => void;
  onError?: (error: string) => void;
}

export const useAudioStreamer = ({
  onTranscriptReceived,
  onActionResultReceived,
  onInterrupted,
  onReady,
  onError
}: UseAudioStreamerProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [volume, setVolume] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recordContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Playback scheduler variables
  const nextPlayTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  
  // VAD thresholds
  const VAD_THRESHOLD = 0.018; // Energy threshold to trigger barge-in
  const speechVolumeHistoryRef = useRef<number[]>([]);

  // 1. Initialize WebSocket connection
  const connectStream = () => {
    if (socketRef.current) return;
    
    console.log('[useAudioStreamer] Connecting to:', WS_URL);
    const ws = new WebSocket(WS_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('[useAudioStreamer] WebSocket connected.');
      setIsConnected(true);
      if (onReady) onReady();
    };

    ws.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.event === 'audio') {
          // Play synthesized base64 PCM frames
          handleIncomingAudio(message.data);
        } 
        
        else if (message.event === 'transcript') {
          if (onTranscriptReceived) {
            onTranscriptReceived(message.data);
          }
        } 
        
        else if (message.event === 'action_result') {
          if (onActionResultReceived) {
            onActionResultReceived(message.data);
          }
        } 
        
        else if (message.event === 'interrupted') {
          console.log('[useAudioStreamer] Server reports interruption.');
          stopAllPlayback();
          if (onInterrupted) onInterrupted();
        } 
        
        else if (message.event === 'error') {
          if (onError) onError(message.data);
        }
      } catch (e) {
        console.error('[useAudioStreamer] Error parsing server packet:', e);
      }
    };

    ws.onerror = (err) => {
      console.error('[useAudioStreamer] WebSocket error:', err);
      if (onError) onError('Connection error occurred.');
    };

    ws.onclose = () => {
      console.log('[useAudioStreamer] WebSocket connection closed.');
      setIsConnected(false);
      socketRef.current = null;
      stopAllPlayback();
    };
  };

  const disconnectStream = () => {
    stopRecording();
    cleanupWebSocket();
    stopAllPlayback();
  };

  const cleanupWebSocket = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
  };

  // Send textual query to Gemini Live
  const sendTextQuery = (text: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        event: 'text',
        data: text
      }));
    }
  };

  // Send explicit interrupt trigger
  const sendInterruptSignal = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        event: 'interrupt'
      }));
    }
  };

  // Convert Float32 samples to 16-bit Int16 PCM array buffer
  const convertFloat32ToInt16 = (float32Array: Float32Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
  };

  // Convert binary ArrayBuffer to Base64 string
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // 2. Microphone downsampler & capture pipeline
  const startRecording = async () => {
    if (isRecording) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      // Downsample directly to 16000Hz via browser API
      const recordContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });
      recordContextRef.current = recordContext;

      const source = recordContext.createMediaStreamSource(stream);
      
      // bufferSize 2048, 1 input channel, 1 output channel
      const scriptProcessor = recordContext.createScriptProcessor(2048, 1, 1);
      scriptProcessorRef.current = scriptProcessor;

      scriptProcessor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        
        // A. Calculate RMS (Root Mean Square) energy to check VAD
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        
        // Map average energy to 0-100 visualizer scale
        setVolume(Math.min(100, Math.round(rms * 400)));

        // B. Client-side Barge-In Interruption Detection
        if (isAgentSpeaking && rms > VAD_THRESHOLD) {
          // Verify it's sustained speech, not just a single pop/noise click
          speechVolumeHistoryRef.current.push(rms);
          if (speechVolumeHistoryRef.current.length >= 2) { // ~50-80ms of audio
            console.log('[useAudioStreamer] User speech detected (Barge-In). Stopping playback.');
            stopAllPlayback();
            sendInterruptSignal();
            if (onInterrupted) onInterrupted();
            speechVolumeHistoryRef.current = [];
          }
        } else {
          speechVolumeHistoryRef.current = [];
        }

        // C. Base64 encode and send PCM raw bytes
        const pcmBuffer = convertFloat32ToInt16(inputData);
        const base64Pcm = arrayBufferToBase64(pcmBuffer);
        
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            event: 'audio',
            data: base64Pcm
          }));
        }
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(recordContext.destination);

      setIsRecording(true);
    } catch (err) {
      console.error('[useAudioStreamer] Microphone start failed:', err);
      if (onError) onError('Microphone access denied.');
    }
  };

  const stopRecording = () => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (recordContextRef.current) {
      recordContextRef.current.close();
      recordContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setVolume(0);
  };

  // 3. Gapless Audio Queue Playback
  const handleIncomingAudio = (base64String: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 16000
        });
        nextPlayTimeRef.current = audioContextRef.current.currentTime;
      }
      
      const audioCtx = audioContextRef.current;
      
      // Decode base64 PCM string to Int16
      const binaryString = window.atob(base64String);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const int16Samples = new Int16Array(bytes.buffer);
      const float32Samples = new Float32Array(int16Samples.length);
      for (let i = 0; i < int16Samples.length; i++) {
        float32Samples[i] = int16Samples[i] / 32768; // Convert back to float [-1.0, 1.0]
      }

      // Create browser audio buffer
      const audioBuffer = audioCtx.createBuffer(1, float32Samples.length, 16000);
      audioBuffer.copyToChannel(float32Samples, 0);

      // Schedule play source node gaplessly
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);

      // Prevent scheduled play times slipping behind current time
      const playTime = Math.max(nextPlayTimeRef.current, audioCtx.currentTime);
      source.start(playTime);
      
      // Update scheduler time
      nextPlayTimeRef.current = playTime + audioBuffer.duration;
      
      setIsAgentSpeaking(true);
      activeSourcesRef.current.push(source);

      source.onended = () => {
        // Remove from active list
        activeSourcesRef.current = activeSourcesRef.current.filter(src => src !== source);
        if (activeSourcesRef.current.length === 0) {
          setIsAgentSpeaking(false);
        }
      };
    } catch(err) {
      console.error('[useAudioStreamer] Error playing chunk:', err);
    }
  };

  const stopAllPlayback = () => {
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    activeSourcesRef.current = [];
    setIsAgentSpeaking(false);
    
    // Reset scheduler reference time
    if (audioContextRef.current) {
      nextPlayTimeRef.current = audioContextRef.current.currentTime;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      cleanupWebSocket();
      stopAllPlayback();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    isConnected,
    isRecording,
    isAgentSpeaking,
    volume,
    connectStream,
    disconnectStream,
    startRecording,
    stopRecording,
    sendTextQuery,
    stopAllPlayback
  };
};
