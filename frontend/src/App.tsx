import { useState, useEffect, useRef } from 'react';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useAudioStreamer } from './hooks/useAudioStreamer';

interface Message {
  sender: 'agent' | 'user';
  text: string;
  timestamp: Date;
}

export default function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalScale, setModalScale] = useState(false);
  
  // Phase modes for testing: 'phase1' (push-to-talk) or 'phase2' (streaming)
  const [phaseMode, setPhaseMode] = useState<'phase1' | 'phase2'>('phase2');
  
  // Voice Modal Internal States (Greeting, Listening, Transcribing, Agent Speaking, Confirmed, Error)
  const [visualState, setVisualState] = useState<'greeting' | 'listening' | 'transcribing' | 'speaking' | 'confirmed' | 'error'>('greeting');

  // Conversation history log
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'agent',
      text: "Welcome to Shiv Sagar! I'm your table reservation assistant. Would you like to make a new booking, check availability, or manage an existing reservation?",
      timestamp: new Date()
    }
  ]);

  // Client microphone recorder hook
  const {
    isRecording,
    audioBlob,
    volume,
    startRecording,
    stopRecording,
    clearRecording
  } = useAudioRecorder();

  // Client live stream hook
  const streamer = useAudioStreamer({
    onTranscriptReceived: (tokenText) => {
      setMessages(prev => {
        const copy = [...prev];
        if (copy.length > 0 && copy[copy.length - 1].sender === 'agent') {
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = {
            ...last,
            text: last.text + tokenText
          };
        } else {
          copy.push({
            sender: 'agent',
            text: tokenText,
            timestamp: new Date()
          });
        }
        return copy;
      });
      setVisualState('speaking');
    },
    onActionResultReceived: (data) => {
      if (data.status === 'cancelled') {
        setVisualState('greeting');
        alert(`Reservation ${data.code} cancelled successfully.`);
      } else if (data.status === 'rescheduled') {
        setReservationData({
          code: data.code,
          date: data.date,
          time: data.time_ist,
          occasion: data.occasion || 'Standard Dining'
        });
        setVisualState('confirmed');
        alert(`Reservation ${data.code} rescheduled successfully.`);
      } else if (data.code) {
        setReservationData({
          code: data.code,
          date: data.date,
          time: data.time_ist,
          occasion: data.occasion || 'Standard Dining'
        });
        setVisualState('confirmed');
      }
    },
    onInterrupted: () => {
      setVisualState('listening');
    },
    onReady: () => {
      streamer.startRecording();
      setVisualState('listening');
    },
    onError: (err) => {
      console.error('[useAudioStreamer] Error:', err);
      setVisualState('error');
    }
  });

  // Selected reservation details for success card
  const [reservationData, setReservationData] = useState({
    code: 'TABLE-K47',
    date: 'Oct 24, 2026',
    time: '8:30 PM (IST)',
    occasion: 'Special Occasion/Anniversary (Party of 4)'
  });

  const [transcriptionInput, setTranscriptionInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Auto scroll transcript to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, visualState]);

  const setFemaleVoice = (utterance: SpeechSynthesisUtterance) => {
    try {
      const voices = window.speechSynthesis.getVoices();
      const female = voices.find(v => 
        v.lang.startsWith('en') && 
        (v.name.toLowerCase().includes('female') || 
         v.name.toLowerCase().includes('zira') || 
         v.name.toLowerCase().includes('samantha') || 
         v.name.toLowerCase().includes('google us english') ||
         v.name.toLowerCase().includes('hazel') ||
         v.name.toLowerCase().includes('microsoft'))
      );
      if (female) utterance.voice = female;
    } catch (e) {}
  };

  // Handle open/close animation of modal
  const openModal = () => {
    setModalOpen(true);
    // Let browser apply flex display, then trigger transition
    setTimeout(() => setModalScale(true), 20);
    
    const greetingText = "Welcome to Shiv Sagar! I'm your table reservation assistant. Would you like to make a new booking, check availability, or manage an existing reservation?";
    
    // Set visualState to speaking and queue message
    setVisualState('speaking');
    setMessages([
      {
        sender: 'agent',
        text: greetingText,
        timestamp: new Date()
      }
    ]);

    if (phaseMode === 'phase2') {
      streamer.connectStream();
    } else {
      // Speak the greeting
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(greetingText);
        setFemaleVoice(utterance);
        utterance.onend = () => {
          setVisualState('greeting');
        };
        utterance.onerror = (e) => {
          console.error("Speech synthesis greeting error:", e);
          setVisualState('greeting');
        };
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error("Speech synthesis error on open:", e);
        setVisualState('greeting');
      }
    }
  };

  const closeModal = () => {
    setModalScale(false);
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      } catch (e) {}
    }
    if (phaseMode === 'phase2') {
      streamer.disconnectStream();
    }
    setTimeout(() => {
      setModalOpen(false);
      clearRecording();
    }, 300);
  };

  // Session ID state persisting across conversational turns
  const [sessionId] = useState(() => `sess_${Math.random().toString(36).substring(2, 10)}`);

  // Audio Playback Helper
  const playBase64Audio = (base64String: string) => {
    try {
      // Stop current audio if any is playing
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      const binaryString = atob(base64String);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const isWav = base64String.startsWith('UklGR');
      const blob = new Blob([bytes.buffer], { type: isWav ? 'audio/wav' : 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;

      audio.onended = () => {
        setVisualState(phaseMode === 'phase2' ? 'listening' : 'greeting');
        if (phaseMode === 'phase2') {
          startRecording();
        }
        currentAudioRef.current = null;
      };

      audio.onerror = (e) => {
        console.error("Audio element error:", e);
        setVisualState(phaseMode === 'phase2' ? 'listening' : 'greeting');
        if (phaseMode === 'phase2') {
          startRecording();
        }
        currentAudioRef.current = null;
      };

      audio.play();
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  };

  // Main HTTP POST Request runner
  const sendPayload = async (payload: FormData | { text: string; conversation_history: string; session_id: string }) => {
    setVisualState('transcribing');
    try {
      const isFormData = payload instanceof FormData;
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/voice/process`, {
        method: 'POST',
        headers: isFormData ? {} : { 'Content-Type': 'application/json' },
        body: isFormData ? payload : JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('API server returned error');
      }
      
      const data = await response.json();

      // A. If transcription arrived (for voice uploads), log user chat message
      if (isFormData && data.transcript) {
        setMessages(prev => [...prev, { sender: 'user', text: data.transcript, timestamp: new Date() }]);
      }

      // B. Display Agent Text reply
      if (data.agent_text) {
        setMessages(prev => [...prev, { sender: 'agent', text: data.agent_text, timestamp: new Date() }]);
        setVisualState('speaking');
      }

      // C. Play synthesized voice audio
      if (data.agent_audio) {
        playBase64Audio(data.agent_audio);
      } else if (data.agent_text) {
        // Fallback to browser Web Speech API
        try {
          window.speechSynthesis.cancel(); // Stop any ongoing speech
          const utterance = new SpeechSynthesisUtterance(data.agent_text);
          setFemaleVoice(utterance);
          utterance.onend = () => {
            setVisualState(phaseMode === 'phase2' ? 'listening' : 'greeting');
            if (phaseMode === 'phase2') {
              startRecording();
            }
          };
          utterance.onerror = (e) => {
            console.error("SpeechSynthesis error:", e);
            setVisualState(phaseMode === 'phase2' ? 'listening' : 'greeting');
            if (phaseMode === 'phase2') {
              startRecording();
            }
          };
          window.speechSynthesis.speak(utterance);
        } catch (speechErr) {
          console.error("Web Speech API failed or not supported:", speechErr);
          setVisualState(phaseMode === 'phase2' ? 'listening' : 'greeting');
        }
      }

      // D. Verify if reservation successfully confirmed, rescheduled, or cancelled
      if (data.action_result) {
        if (data.action_result.status === 'cancelled') {
          setVisualState('greeting');
          alert(`Reservation ${data.action_result.code} cancelled successfully.`);
        } else if (data.action_result.status === 'rescheduled') {
          setReservationData({
            code: data.action_result.code,
            date: data.action_result.date,
            time: data.action_result.time_ist,
            occasion: data.action_result.occasion || 'Standard Dining'
          });
          setVisualState('confirmed');
          alert(`Reservation ${data.action_result.code} rescheduled successfully.`);
        } else if (data.action_result.code) {
          setReservationData({
            code: data.action_result.code,
            date: data.action_result.date,
            time: data.action_result.time_ist,
            occasion: data.action_result.occasion || 'Standard Dining'
          });
          setVisualState('confirmed');
        }
      }
    } catch (error) {
      console.error("API Integration error:", error);
      setVisualState('error');
      setMessages(prev => [...prev, {
        sender: 'agent',
        text: "I am having trouble connecting to the reservation system right now. Please try again or visit shivsagar.in.",
        timestamp: new Date()
      }]);
    }
  };

  // Live text input processing
  const handleSendText = () => {
    if (!transcriptionInput.trim()) return;

    const userText = transcriptionInput;
    setMessages(prev => [...prev, { sender: 'user', text: userText, timestamp: new Date() }]);
    setTranscriptionInput('');

    if (phaseMode === 'phase2') {
      streamer.sendTextQuery(userText);
    } else {
      const historyPayload = messages.map(m => ({
        role: m.sender === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.text }]
      }));

      sendPayload({
        text: userText,
        conversation_history: JSON.stringify(historyPayload),
        session_id: sessionId
      });
    }
  };

  // Handle mock actions from verification panel
  const triggerMockState = (state: typeof visualState) => {
    setVisualState(state);
    if (state === 'confirmed') {
      setMessages(prev => [
        ...prev,
        {
          sender: 'agent',
          text: "Your table is reserved! Your Reservation Code is TABLE-K47. We will hold the table for 15 minutes past your booking time. Have a wonderful dining experience!",
          timestamp: new Date()
        }
      ]);
    } else if (state === 'error') {
      setMessages(prev => [
        ...prev,
        {
          sender: 'agent',
          text: "I'm having trouble booking. Please connect to our website directly at shivsagar.in to make a manual reservation.",
          timestamp: new Date()
        }
      ]);
    } else if (state === 'listening') {
      if (phaseMode === 'phase2') {
        streamer.startRecording();
      } else {
        startRecording();
      }
    }
  };

  // Client microphone trigger hook connection
  useEffect(() => {
    if (audioBlob) {
      const historyPayload = messages.map(m => ({
        role: m.sender === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.text }]
      }));

      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice_input.webm');
      formData.append('conversation_history', JSON.stringify(historyPayload));
      formData.append('session_id', sessionId);

      sendPayload(formData);
    }
  }, [audioBlob]);

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md antialiased selection:bg-primary-container selection:text-white min-h-screen flex flex-col relative">
      
      {/* 🛠️ MOCK VERIFICATION CONTROLLER (Floating Widget) */}
      <div className="fixed bottom-4 left-4 z-[9999] bg-white border border-outline/30 rounded-xl p-4 shadow-2xl max-w-sm">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-surface-variant">
          <span className="material-symbols-outlined text-primary text-[20px]">construction</span>
          <span className="font-headline-md text-sm font-bold text-on-surface">Sprint 1 Verification Panel</span>
        </div>
        <div className="flex flex-col gap-2">
          <div>
            <label className="block text-xs font-semibold text-muted-text mb-1">Interaction Mode:</label>
            <div className="flex gap-2">
              <button 
                className={`flex-1 text-xs py-1.5 px-3 rounded-lg border font-semibold transition-all ${phaseMode === 'phase1' ? 'bg-primary-container text-white border-transparent' : 'bg-surface-alt border-outline-variant text-on-surface-variant'}`}
                onClick={() => { setPhaseMode('phase1'); setVisualState('greeting'); }}
              >
                Phase 1: Push-To-Talk
              </button>
              <button 
                className={`flex-1 text-xs py-1.5 px-3 rounded-lg border font-semibold transition-all ${phaseMode === 'phase2' ? 'bg-primary-container text-white border-transparent' : 'bg-surface-alt border-outline-variant text-on-surface-variant'}`}
                onClick={() => { setPhaseMode('phase2'); setVisualState('listening'); }}
              >
                Phase 2: Streaming
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-text mb-1">Trigger Modal States:</label>
            <div className="grid grid-cols-3 gap-1">
              <button onClick={() => triggerMockState('greeting')} className="text-[10px] bg-surface-alt border border-outline-variant p-1 rounded hover:bg-surface-container-high">Greeting</button>
              <button onClick={() => triggerMockState('listening')} className="text-[10px] bg-surface-alt border border-outline-variant p-1 rounded hover:bg-surface-container-high">Listening</button>
              <button onClick={() => triggerMockState('transcribing')} className="text-[10px] bg-surface-alt border border-outline-variant p-1 rounded hover:bg-surface-container-high">Transcribing</button>
              <button onClick={() => triggerMockState('speaking')} className="text-[10px] bg-surface-alt border border-outline-variant p-1 rounded hover:bg-surface-container-high">Speaking</button>
              <button onClick={() => triggerMockState('confirmed')} className="text-[10px] bg-surface-alt border border-outline-variant p-1 rounded hover:bg-surface-container-high">Confirmed</button>
              <button onClick={() => triggerMockState('error')} className="text-[10px] bg-surface-alt border border-outline-variant p-1 rounded hover:bg-surface-container-high">Error State</button>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button 
              onClick={() => { setModalOpen(true); setModalScale(true); }}
              className="flex-1 bg-green-700 text-white text-xs py-1 rounded font-bold hover:bg-green-800"
            >
              Open Modal
            </button>
            <button 
              onClick={() => { setMessages([]); setVisualState('greeting'); }}
              className="flex-1 bg-gray-600 text-white text-xs py-1 rounded font-bold hover:bg-gray-700"
            >
              Clear State
            </button>
          </div>
        </div>
      </div>

      {/* TOP NAVIGATION BAR */}
      <header className="bg-surface/80 backdrop-blur-md shadow-sm sticky top-0 z-50 transition-transform duration-150 docked full-width">
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
          {/* Brand Logo */}
          <a className="font-headline-md text-headline-md font-bold text-primary hover:opacity-85 transition-opacity" href="#">Shivsagar</a>
          {/* Navigation Links (Web) */}
          <nav className="hidden md:flex items-center gap-gutter">
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-low px-3 py-2 rounded-md" href="#menu">Menu</a>
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-low px-3 py-2 rounded-md" href="#location">Location</a>
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-low px-3 py-2 rounded-md" href="#gallery">Gallery</a>
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-low px-3 py-2 rounded-md" href="#about">About</a>
          </nav>
          {/* Trailing Action */}
          <button 
            className="hidden md:flex items-center gap-2 bg-primary-container text-white px-4 py-2 rounded-lg font-label-md text-label-md shadow-interactive transition-all duration-200 hover:bg-[#E06A1A]"
            onClick={openModal}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
            Book with Voice
          </button>
          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-on-surface-variant p-2 hover:bg-surface-container-low rounded-full transition-colors">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT CANVAS */}
      <main className="flex-grow w-full">
        
        {/* HERO SECTION */}
        <section className="relative w-full px-margin-mobile md:px-margin-desktop py-stack-lg md:py-24 max-w-container-max mx-auto flex flex-col md:flex-row items-center gap-gutter overflow-hidden">
          {/* Hero Text */}
          <div className="w-full md:w-1/2 flex flex-col gap-stack-md z-10">
            <div className="inline-flex items-center gap-2 bg-surface-alt px-3 py-1.5 rounded-full w-fit mb-4 border border-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-muted-text">lock</span>
              <span className="font-label-md text-label-md text-on-surface-variant">Zero-PII: No Phone or Email Required</span>
            </div>
            <h1 className="font-display-lg text-display-lg text-on-surface">Modern Indian<br/><span className="text-primary-container">Effortless Dining.</span></h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mt-2 mb-6">
              Experience vibrant flavors with zero friction. Tap below to speak with our AI host and secure your table instantly.
            </p>
            {/* Prominent Voice Banner */}
            <button 
              className="group relative w-full md:w-auto bg-primary-container text-white rounded-xl p-6 flex flex-col items-center justify-center gap-3 shadow-ambient shadow-interactive transition-all duration-300 hover:bg-[#E06A1A] overflow-hidden"
              onClick={openModal}
            >
              <div className="absolute inset-0 bg-white/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 ease-out"></div>
              <span className="material-symbols-outlined text-[48px] animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
              <span className="font-headline-md text-headline-md font-bold z-10">Book with Voice (No Sign-up)</span>
              <span className="font-label-md text-label-md opacity-80 z-10">Tap to start speaking</span>
            </button>
          </div>
          {/* Hero Image Bento */}
          <div className="w-full md:w-1/2 grid grid-cols-2 grid-rows-2 gap-4 h-[400px] md:h-[500px]">
            <div className="col-span-2 row-span-1 rounded-2xl overflow-hidden shadow-ambient bg-surface-container">
              <img 
                alt="Restaurant Interior" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_lNedg9QDQ8JfzP2sjRF0Zrl8NMT9YsadG1qj7Ex8eFSybD2OcZ_IlkDpNfeSqJ7NolNi_EYtfNLapnLf6ggAySGwN9WXjiN9Ot83NlIsUsu35a-d6VH8Rfu9j4YlzYI7w_j2NjOIegVR4LnQJCmFhl2NZ5GN6d732QxQUqP_U1mtVxNj99PuxnGpjH5IJkfdp0c9eH8bUgqu2oL4wSmAhYgZATFyWjUXnsOhAfu_oxx1L25IzjWvB3y544LZw70g-3OP-tl5jUKL"
              />
            </div>
            <div className="col-span-1 row-span-1 rounded-2xl overflow-hidden shadow-ambient bg-surface-container">
              <img 
                alt="Plated Dish" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjkxdaD-pfPt_ympwMnwe2lgTm2_oa8sSrbtPSR4otqmAcwo4av-vILqz3n5lybrznzaE0wCLpMo1N2lkT4I8QcNO2C07t7tQ3_3YqpzV7brdIfNXcEVwCUpb_DC4dkQlxjkls-jE-IYsmhKLpAxQblbngOvehwC13nxHQ6ND_crJZlUzVNSIrGB2eBSlJMCN1QsEmVG0v128vLvjqz6nlHxgwJ23bkS68hYQQF_5IqPSXqVi2EKjmD7lvrxFYFpijlOD2nrGxegRV"
              />
            </div>
            <div className="col-span-1 row-span-1 rounded-2xl overflow-hidden shadow-ambient bg-surface-container flex items-center justify-center p-6 text-center">
              <div>
                <span className="material-symbols-outlined text-primary-container text-[40px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                <h3 className="font-headline-lg text-headline-lg font-bold text-on-surface">Fast.</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Table in seconds.</p>
              </div>
            </div>
          </div>
        </section>

        {/* MENU PREVIEW */}
        <section className="w-full bg-surface-alt py-24" id="menu">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Curated Signatures</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2">A glimpse into our modern Indian kitchen.</p>
              </div>
              <a className="inline-flex items-center gap-1 font-label-md text-label-md text-primary-container hover:text-[#E06A1A] transition-colors" href="#">
                Full Menu <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Menu Item 1 */}
              <div className="bg-white rounded-xl overflow-hidden shadow-ambient group cursor-pointer border border-outline/10 hover:border-primary-container/30 transition-all">
                <div className="h-48 overflow-hidden">
                  <img 
                    alt="Samosa Chaat" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBK1wRB546iVbWVLB6xgfu4dmfwr20F0wU1AZpP_EvIf7lFPpw7BpjsPZyOLC1TnK1hOpd3AdLxMeGshT1yD985S2trzXvHdiFm2Rd6awEd6_689e2GQv6SpbQpY-0YjcGQrc-gRgXI5PxjJ-dEivQ3zUI0mfm_BuxjkrFEwOLnYvPB9yZt5FEVRaRLsyli8UqHJUAggZK0IeroHS3HC8qYA4m2ZM4Cj1uA2hq2kDnHbVgU1o9CoWhYxg0rv7naMdeGztfUypna3ypC"
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Samosa Tartlet</h3>
                    <span className="font-label-md text-label-md text-primary-container font-bold">$12</span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm">Spiced potato, mint emulsion, tamarind glaze in a crisp shell.</p>
                </div>
              </div>
              {/* Menu Item 2 */}
              <div className="bg-white rounded-xl overflow-hidden shadow-ambient group cursor-pointer border border-outline/10 hover:border-primary-container/30 transition-all">
                <div className="h-48 overflow-hidden">
                  <img 
                    alt="Biryani" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCB6_NB9D7WDjUTm262oQ0y2_L8th-LvZhVqt3JHkL3jZj4zi-9Yv5fXHlC9l1Uoge3Z5S7Wbwq3zjFq-aSNUpgJ14txdb2KAcDqCu6RgtVb-fQvhYX4pFi1US_jd_ZUBVeMsV9AtZJQ7nAgAG0zIXB0qeMBUZpzv-YBPmStL2xLjnGGJkAzef-tz_d657nSv433o4RQcoNQ0g_k3virZ49pN0WeM3oELBh-5OFY9qcPHt725x6kqpPTTyS6W0Gfl0ZC5rOX2ukHtdp"
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Saffron Dum Biryani</h3>
                    <span className="font-label-md text-label-md text-primary-container font-bold">$24</span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm">Aged basmati, slow-cooked root vegetables, saffron infusion.</p>
                </div>
              </div>
              {/* Menu Item 3 */}
              <div className="bg-white rounded-xl overflow-hidden shadow-ambient group cursor-pointer border border-outline/10 hover:border-primary-container/30 transition-all">
                <div className="h-48 overflow-hidden">
                  <img 
                    alt="Paneer Tikka" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpd4lZyO1NJ2YMdQ24_arK7H2-K_NU3n-TfRMkRFb4WxR5y-uYAs0tYLfcSNIOX0P-JV0auDpHFwr4jwFlIve7m9U80cb37RX6HR2-HkSmJLowrCDxGehnFUUkDXM4oYWaYypdZMkUfO7MZmnCPfTVyRkpyx8ypzLhKWbH9S7XyZkHxJbali5T1KB_5vNzV-ckRdyLgIuem7MzM3mi0ZjR_Z2UEOvwf2gEiRojR3_1Dg0gDnln4G38WeN3cv9YD8CdcSyRQ721n0Cg"
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Charcoal Paneer</h3>
                    <span className="font-label-md text-label-md text-primary-container font-bold">$18</span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm">Smoked cottage cheese, robust pepper marinade, micro-greens.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-surface-container-lowest py-stack-lg px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-gutter max-w-container-max mx-auto w-full border-t border-outline-variant flat no shadows mt-auto">
        <div className="font-headline-md text-headline-md font-bold text-primary">Shivsagar</div>
        <div className="text-center md:text-left">
          <p className="font-body-md text-body-md text-on-surface">© 2024 Shivsagar. Zero-PII: No Phone or Email Required.</p>
        </div>
        <nav className="flex gap-4">
          <a className="font-label-md text-label-md text-muted-text hover:text-primary hover:underline transition-all focus:outline-none focus:ring-2 focus:ring-primary rounded" href="#">Privacy Policy</a>
          <a className="font-label-md text-label-md text-muted-text hover:text-primary hover:underline transition-all focus:outline-none focus:ring-2 focus:ring-primary rounded" href="#">Terms of Service</a>
          <a className="font-label-md text-label-md text-muted-text hover:text-primary hover:underline transition-all focus:outline-none focus:ring-2 focus:ring-primary rounded" href="#">Contact Us</a>
        </nav>
      </footer>

      {/* VOICE RESERVATION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-margin-mobile">
          
          {/* Backdrop */}
          <div className="absolute inset-0 glass-overlay animate-fadeIn" onClick={closeModal}></div>
          
          {/* Modal Container */}
          <div 
            className={`relative w-full max-w-[480px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.15)] flex flex-col overflow-hidden h-[819px] max-h-[800px] border border-surface-variant transform transition-all duration-300 ${modalScale ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          >
            {/* 1. CONFIRMED SCREEN STATE */}
            {visualState === 'confirmed' ? (
              <div className="flex flex-col h-full bg-surface-container-lowest">
                {/* Success Banner */}
                <div className="bg-[#2E7D32]/10 py-stack-lg flex flex-col items-center justify-center border-b border-[#2E7D32]/20">
                  <div className="w-20 h-20 rounded-full bg-[#2E7D32] flex items-center justify-center mb-stack-md shadow-sm animate-bounce">
                    <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                  <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface text-center px-margin-mobile">
                    Table Reserved!
                  </h1>
                  <p className="font-body-md text-body-md text-muted-text mt-stack-sm text-center px-margin-mobile">
                    Your spot is secured instantly.
                  </p>
                </div>
                
                {/* Details Body */}
                <div className="p-stack-lg flex-grow flex flex-col items-center gap-stack-lg overflow-y-auto">
                  {/* Reservation Code Badge */}
                  <div className="w-full relative group">
                    <div className="absolute inset-0 bg-[#2E7D32] rounded-lg transform translate-y-1 group-hover:translate-y-0 transition-transform duration-200"></div>
                    <div 
                      className="relative bg-surface-container-lowest border-2 border-[#2E7D32] rounded-lg p-stack-md flex flex-col items-center justify-center cursor-pointer hover:-translate-y-1 transition-transform duration-200"
                      onClick={() => {
                        navigator.clipboard.writeText(reservationData.code);
                        alert('Reservation Code copied to clipboard!');
                      }}
                    >
                      <span className="font-label-md text-label-md text-[#2E7D32] uppercase tracking-widest mb-2 text-xs font-bold">Show this code upon arrival</span>
                      <div className="flex items-center gap-3">
                        <span className="font-reservation-code text-reservation-code text-on-surface tracking-widest">{reservationData.code}</span>
                        <span className="material-symbols-outlined text-xl text-muted-text hover:text-[#2E7D32] transition-colors" title="Copy Code">content_copy</span>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="w-full grid grid-cols-2 gap-stack-md bg-surface-alt p-stack-md rounded-lg text-left">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-muted-text mb-1 text-xs uppercase">Date</span>
                      <span className="font-body-md text-body-md font-semibold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg text-primary">calendar_today</span>
                        {reservationData.date}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-muted-text mb-1 text-xs uppercase">Time</span>
                      <span className="font-body-md text-body-md font-semibold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg text-primary">schedule</span>
                        {reservationData.time}
                      </span>
                    </div>
                    <div className="flex flex-col col-span-2 pt-2 border-t border-outline-variant mt-1">
                      <span className="font-label-md text-label-md text-muted-text mb-1 text-xs uppercase">Occasion</span>
                      <span className="font-body-md text-body-md font-semibold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg text-primary">celebration</span>
                        {reservationData.occasion}
                      </span>
                    </div>
                  </div>

                  {/* Hold policy disclaimer */}
                  <div className="text-center bg-surface-container-low p-stack-md rounded-lg w-full">
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      We'll hold your table for <strong className="text-on-surface font-semibold">15 minutes</strong> past your booking time. Have a great day!
                    </p>
                  </div>

                  {/* ZPII Lock badge */}
                  <div className="inline-flex items-center gap-2 bg-surface-alt px-4 py-2 rounded-full border border-surface-variant">
                    <span className="material-symbols-outlined text-sm text-muted-text">lock</span>
                    <span className="font-label-md text-label-md text-muted-text text-xs">Zero-PII: No Phone or Email Required</span>
                  </div>
                </div>

                {/* Modal Return Action */}
                <div className="p-stack-md bg-surface-container-low border-t border-surface-variant flex justify-center">
                  <button 
                    className="bg-primary-container text-white font-label-md text-label-md px-8 py-3 rounded-lg shadow-interactive hover:translate-y-[2px] transition-all duration-200 flex items-center gap-2 hover:bg-[#E06A1A]"
                    onClick={closeModal}
                  >
                    <span className="material-symbols-outlined">home</span>
                    Return to Home
                  </button>
                </div>
              </div>
            ) : (
              // 2. DIALOG CONVERSATION STATE
              <div className="flex flex-col h-full bg-white">
                
                {/* Header */}
                <header className="flex justify-between items-center p-stack-lg border-b border-surface-variant/50">
                  <div className="flex items-center gap-stack-sm">
                    <div className={`w-2 h-2 rounded-full bg-primary-container ${visualState === 'listening' ? 'animate-ping bg-secondary' : 'animate-pulse'}`}></div>
                    <span className="font-label-md text-label-md text-muted-text uppercase tracking-wider text-xs font-bold">
                      {visualState === 'listening' ? 'Listening...' : 
                       visualState === 'transcribing' ? 'Transcribing...' : 
                       visualState === 'speaking' ? 'Agent Speaking...' : 'Voice Agent Connected'}
                    </span>
                  </div>
                  <button 
                    className="text-on-surface-variant hover:text-on-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-full p-1 hover:bg-surface-alt"
                    onClick={closeModal}
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </header>

                {/* Chat Canvas (Conversation Log) */}
                <div className="flex-1 overflow-y-auto p-stack-lg flex flex-col gap-stack-lg">
                  {messages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex flex-col gap-stack-sm ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <span className="font-label-md text-label-md text-muted-text uppercase tracking-wider text-[10px] font-bold">
                        {msg.sender === 'user' ? 'You' : 'Shivsagar Host'}
                      </span>
                      <div 
                        className={`rounded-lg p-stack-md font-body-lg text-body-lg text-on-surface w-fit max-w-[85%] ${
                          msg.sender === 'user' 
                            ? 'bg-primary-container/10 border border-primary-container/20 rounded-tr-none' 
                            : 'bg-surface-alt border border-surface-variant/75 rounded-tl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {/* Transcribing Draft Indicator */}
                  {visualState === 'transcribing' && (
                    <div className="flex flex-col gap-stack-sm items-end animate-pulse">
                      <span className="font-label-md text-label-md text-muted-text uppercase tracking-wider text-[10px] font-bold">You (Speaking...)</span>
                      <div className="font-body-lg text-body-lg text-on-surface/50 w-fit max-w-[85%] text-right italic bg-primary-container/5 p-stack-md rounded-lg rounded-tr-none border border-dashed border-outline-variant">
                        Transcribing voice audio...
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef}></div>
                </div>

                {/* Voice Interaction & Controls Area (Bottom Fixed) */}
                <div className="p-stack-lg flex flex-col items-center gap-stack-lg bg-surface-container-lowest border-t border-surface-variant/50 relative">
                  
                  {/* Streaming Interruption Hint (Phase 2) */}
                  {phaseMode === 'phase2' && (
                    <div className="absolute -top-10 bg-surface-variant/90 backdrop-blur text-on-surface-variant font-label-md text-label-md px-4 py-1.5 rounded-full shadow-sm text-center text-xs border border-outline-variant">
                      Just speak to interrupt (Barge-In)
                    </div>
                  )}

                  {/* Visualizer & Mic Buttons */}
                  <div className="w-full flex flex-col items-center gap-4">
                    
                    {/* Visualizer Display */}
                    {phaseMode === 'phase2' ? (
                      /* Phase 2: Streaming glowing visualizer */
                      <div 
                        className="relative w-32 h-32 flex items-center justify-center cursor-pointer group"
                        onClick={() => {
                          if (streamer.isRecording) {
                            streamer.stopRecording();
                            setVisualState('speaking');
                          } else {
                            streamer.startRecording();
                            setVisualState('listening');
                          }
                        }}
                      >
                        {/* Pulse rings */}
                        <div className="absolute inset-0 rounded-full border-2 border-primary-container pulse-ring"></div>
                        <div className="absolute inset-2 rounded-full border-2 border-secondary-container pulse-ring" style={{ animationDelay: '-1s' }}></div>
                        {/* Core orb */}
                        <div className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-primary-container to-secondary-container shadow-[0_4px_20px_rgba(244,121,32,0.4)] flex items-center justify-center overflow-hidden transition-all duration-200 group-hover:scale-105 active:scale-95">
                          {/* Animated Waveform */}
                          <div className={`flex items-end justify-center gap-1.5 h-10 ${streamer.isAgentSpeaking ? 'barge-in-active' : ''}`}>
                            <div 
                              className="waveform-bar w-1.5 bg-white/90 rounded-full" 
                              style={{ 
                                height: streamer.isRecording ? '100%' : '10%',
                                animationPlayState: streamer.isRecording ? 'running' : 'paused',
                                transform: streamer.isRecording ? `scaleY(${streamer.volume / 100})` : 'scaleY(0.2)'
                              }}
                            ></div>
                            <div className="waveform-bar w-1.5 bg-white/90 rounded-full h-3/4" style={{ animationPlayState: streamer.isRecording ? 'running' : 'paused' }}></div>
                            <div className="waveform-bar w-1.5 bg-white/90 rounded-full h-full" style={{ animationPlayState: streamer.isRecording ? 'running' : 'paused' }}></div>
                            <div className="waveform-bar w-1.5 bg-white/90 rounded-full h-1/2" style={{ animationPlayState: streamer.isRecording ? 'running' : 'paused' }}></div>
                            <div className="waveform-bar w-1.5 bg-white/90 rounded-full h-full" style={{ animationPlayState: streamer.isRecording ? 'running' : 'paused' }}></div>
                            <div className="waveform-bar w-1.5 bg-white/90 rounded-full h-3/4" style={{ animationPlayState: streamer.isRecording ? 'running' : 'paused' }}></div>
                            <div className="waveform-bar w-1.5 bg-white/90 rounded-full h-full" style={{ animationPlayState: streamer.isRecording ? 'running' : 'paused' }}></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Phase 1: Turn-based Push-to-Talk */
                      <div className="w-full flex flex-col items-center gap-4">
                        <button 
                          onMouseDown={startRecording}
                          onMouseUp={stopRecording}
                          onTouchStart={startRecording}
                          onTouchEnd={stopRecording}
                          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 select-none shadow-ambient ${
                            isRecording 
                              ? 'bg-secondary animate-pulse scale-110 shadow-none text-white' 
                              : 'bg-primary-container hover:bg-[#E06A1A] text-white hover:scale-105 active:scale-95'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {isRecording ? 'graphic_eq' : 'mic'}
                          </span>
                        </button>
                        <span className="text-xs text-muted-text font-semibold uppercase tracking-wider">
                          {isRecording ? `Recording... Vol: ${volume}%` : 'Hold to speak, release to send'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Text transcription input box (For Phase 1 fallback or verification) */}
                  {true && (
                    <div className="w-full flex gap-2">
                      <input 
                        type="text" 
                        value={transcriptionInput}
                        onChange={(e) => setTranscriptionInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                        placeholder="Type standard inputs or speak above..."
                        className="flex-grow border-2 border-surface-variant bg-surface-alt rounded-lg px-4 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary-container transition-all"
                      />
                      <button 
                        onClick={handleSendText}
                        className="bg-primary-container text-white px-5 py-2.5 rounded-lg font-label-md text-label-md font-bold shadow-interactive hover:bg-[#E06A1A] transition-all duration-150 flex items-center gap-1.5"
                      >
                        Send
                        <span className="material-symbols-outlined text-[16px]">send</span>
                      </button>
                    </div>
                  )}

                  {/* Privacy Badge */}
                  <div className="bg-surface-alt rounded-full px-4 py-2 flex items-center gap-2 border border-surface-variant/80">
                    <span className="material-symbols-outlined text-[16px] text-muted-text" style={{ fontVariationSettings: "'FILL' 0" }}>lock</span>
                    <span className="font-label-md text-label-md text-muted-text text-xs">Zero-PII: No Phone or Email Required</span>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
