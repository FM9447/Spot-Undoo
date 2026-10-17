---
name: gemma4-local
description: Local Ollama Gemma 4 API integration for JSON travel planning and resized image verification.
---
- Endpoint: POST http://localhost:11434/api/chat (allow overriding the host URL in UI settings for mobile testing).
- Default model: "gemma4:e4b" (with dropdown switch for "gemma4:e2b").
- Always pass "stream": false, "think": false, "format": "json", and "options": {"temperature": 0.7, "num_ctx": 8192}.
- Vision uploads: Always resize images on an HTML5 <canvas> to max 512px JPEG (0.7 quality) and strip the data:image/jpeg;base64, prefix before placing in messages[].images.
