---
name: qwen-local
description: Local Ollama Qwen API integration for JSON travel planning, conversational chat modifications, and resized image verification.
---
- Endpoint: POST http://localhost:11434/api/chat (allow overriding the host URL in UI settings for mobile testing).
- Default model: "spot-undo-qwen" (with fallback to "qwen2.5:3b").
- Always pass "stream": false, "think": false, "format": "json", and "options": {"temperature": 0.7, "num_ctx": 8192}.
- Vision uploads: Always resize images on an HTML5 <canvas> to max 512px JPEG (0.7 quality) and strip the data:image/jpeg;base64, prefix before placing in messages[].images.
