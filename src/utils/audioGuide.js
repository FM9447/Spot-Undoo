import { getBackendUrl } from './apiConfig';

let currentAudio = null;

export async function playAudioGuide(text, onStart, onEnd) {
  // If already playing, stop it
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (onEnd) onEnd();
    return;
  }

  const backendUrl = getBackendUrl();
  const userKey = localStorage.getItem('spot_undoo_elevenlabs_key') || '';

  if (onStart) onStart();

  try {
    const res = await fetch(`${backendUrl}/api/audio/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(userKey ? { 'x-elevenlabs-key': userKey } : {}),
      },
      body: JSON.stringify({ text }),
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudio = audio;
      audio.onended = () => {
        currentAudio = null;
        URL.revokeObjectURL(url);
        if (onEnd) onEnd();
      };
      audio.onerror = () => {
        currentAudio = null;
        fallbackSpeech(text, onEnd);
      };
      await audio.play();
      return;
    }
  } catch (err) {
    console.warn('ElevenLabs API unavailable, using browser speech fallback:', err);
  }

  // Fallback to Web Speech API
  fallbackSpeech(text, onEnd);
}

function fallbackSpeech(text, onEnd) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };
    window.speechSynthesis.speak(utterance);
  } else {
    if (onEnd) onEnd();
  }
}

export function stopAudioGuide() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
