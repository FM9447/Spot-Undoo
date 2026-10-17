---
name: gemma4-local
description: Configures local Ollama Gemma 4 (gemma4:e4b) API calls for JSON travel plan generation and base64 resized image verification. Use when writing or fixing AI service calls.
---
# Gemma 4 Local Ollama Protocol
1. Endpoint: Always POST to `http://localhost:11434/api/chat`.
2. Model tag: `"gemma4:e4b"` (with a UI dropdown allowing fallback to `"gemma4:e2b"`).
3. Speed settings: Always set `"stream": false`, `"think": false`, and `"format": "json"`.
4. Sampling options: `{"temperature": 0.7, "top_p": 0.95, "top_k": 64}`.
5. Vision Safety: Before sending any user image in `messages[].images`, always downscale it on an HTML5 `<canvas>` to a maximum width/height of `512px` JPEG (`0.7` quality) and strip the `data:image/jpeg;base64,` prefix so Gemma 4 processes it in ~70-140 visual tokens under 1.5 seconds.
