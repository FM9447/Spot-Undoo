export const getBackendUrl = () => {
  if (typeof window !== 'undefined') {
    if (import.meta.env?.VITE_BACKEND_URL) {
      return import.meta.env.VITE_BACKEND_URL;
    }
    const host = window.location.hostname;
    // In production on HTTPS (e.g. Hugging Face Spaces or custom domain), use same origin
    if (window.location.protocol === 'https:') {
      return window.location.origin;
    }
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:4000`;
    }
  }
  return 'http://localhost:4000';
};

export const getOllamaUrl = () => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('spot_undoo_ollama_url');
    if (custom) return custom;
    if (import.meta.env?.VITE_OLLAMA_URL) {
      return import.meta.env.VITE_OLLAMA_URL;
    }
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:11434`;
    }
  }
  return 'http://localhost:11434';
};

