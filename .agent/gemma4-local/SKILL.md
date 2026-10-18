---
name: qwen-local
description: Configures local Ollama Qwen (spot-undo-qwen / qwen2.5:3b) API calls for JSON travel plan generation, conversational chat modifications, and base64 resized image verification.
---
# Qwen Local Ollama Protocol

1. Base URL: `http://localhost:11434` (overrideable in Settings for mobile).
2. Model tag: `"spot-undo-qwen"` (fallback to `"qwen2.5:3b"`).
3. Payload requirements: `"stream": false, "think": false, "format": "json"`, `options: {"temperature": 0.7, "num_ctx": 8192}`.
4. Schema conformance: Always return strict JSON schemas.
5. Vision Safety: Before sending any user image in `messages[].images`, downscale it on an HTML5 `<canvas>` to max 512px JPEG (`0.7` quality) and strip `data:image/jpeg;base64,`.
