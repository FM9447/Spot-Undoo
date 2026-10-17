// Wraps ollamaChat with event emitter for the debug panel
const listeners = new Set();

export function onLLMEvent(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function emit(event) {
  listeners.forEach((cb) => cb(event));
}

export async function ollamaChat({ baseUrl, model, messages }) {
  const startMs = Date.now();

  emit({
    type: 'request',
    ts: new Date().toISOString(),
    model,
    baseUrl,
    messages,
  });

  const body = {
    model,
    messages,
    stream: false,
    think: false,
    format: 'json',
    options: { temperature: 0.7, num_ctx: 8192 },
  };

  let data;
  try {
    const isBrowser = typeof window !== 'undefined';
    const endpoint = (isBrowser && (!baseUrl || baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')))
      ? '/api/chat'
      : `${baseUrl || 'http://localhost:11434'}/api/chat`;

    let res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.status === 404 && body.model !== 'spot-undo-qwen') {
      console.warn(`Model ${body.model} not found, falling back to spot-undo-qwen`);
      body.model = 'spot-undo-qwen';
      res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    if (res.status === 404 && body.model !== 'qwen2.5:3b') {
      body.model = 'qwen2.5:3b';
      res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      emit({ type: 'error', ts: new Date().toISOString(), status: res.status, body: errText, elapsedMs: Date.now() - startMs });
      throw new Error(`Ollama error ${res.status}`);
    }
    data = await res.json();
  } catch (err) {
    emit({ type: 'error', ts: new Date().toISOString(), message: err.message, elapsedMs: Date.now() - startMs });
    throw err;
  }

  const elapsedMs = Date.now() - startMs;
  const rawContent = data.message?.content || data.response || '{}';
  let parsed = {};
  let parseError = null;
  try {
    parsed = JSON.parse(rawContent);
  } catch (e) {
    parseError = e.message;
  }

  emit({
    type: 'response',
    ts: new Date().toISOString(),
    elapsedMs,
    model: data.model,
    totalTokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
    promptTokens: data.prompt_eval_count ?? null,
    completionTokens: data.eval_count ?? null,
    evalDurationMs: data.eval_duration ? Math.round(data.eval_duration / 1e6) : null,
    tokensPerSec: data.eval_count && data.eval_duration
      ? Math.round(data.eval_count / (data.eval_duration / 1e9))
      : null,
    thinking: data.message?.thinking ?? null,
    rawContent,
    parsed,
    parseError,
  });

  if (parseError) throw new Error(`JSON parse error: ${parseError}`);
  return parsed;
}

export async function resizeImageToBase64(file, maxPx = 512, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUrl.replace('data:image/jpeg;base64,', ''));
    };
    img.onerror = reject;
    img.src = url;
  });
}
