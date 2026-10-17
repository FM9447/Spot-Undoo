# 🎤 Spot-Undoo Hackathon Presentation Deck & Speaker Notes

This document provides the slide-by-slide content and speaker notes aligned with our updated project specifications.

---

## 📽️ Slide 1: Title Slide (Cover)
- **Title**: SPOT-UNDOO
- **Subtitle**: Local-First AI Kerala Travel & Hidden-Spots Discovery Engine
- **Badges**: 
  - ⚡ Hackathon Build • Hacktoberfest 2026 / µLearn Hack Day
  - 🧠 Powered by Local Qwen 2.5:3B (Edge Inference)
  - 🍃 MongoDB Atlas Cloud Cluster
  - 📱 Native Android & Installable PWA
- **Speaker Notes**:
  > *"Good evening judges and fellow builders! We are excited to present **Spot-Undoo**—a privacy-first, on-device AI travel companion and micro-exploration engine built specifically for travelers and transit layovers across Kerala."*

---

## 📽️ Slide 2: The Challenge
- **Header**: Focus: Transit & Layover Travelers
- **Title**: Travel Friction vs. Hyper-Local Discovery
- **The Layover Dilemma (Problem)**:
  - ✕ **Tourist Trap Congestion**: Mainstream platforms (Google Maps, TripAdvisor) funnel visitors into crowded commercial traps, completely missing authentic bakeries, backwater piers, and artisan villages.
  - ✕ **Connection Anxiety**: Travelers with 1 to 4 hour layovers at major transit hubs (e.g. Shoranur Jn or Kochi) cannot estimate realistic local auto-rickshaw transit times and fear missing connections.
  - ✕ **Cloud Dependency & Privacy**: Cloud travel tools fail in backwater and plantation dead-zones while harvesting personal GPS data.
- **The Spot-Undoo Engine (Solution)**:
  - ✓ **Hyper-Local Kerala Discovery**: 70 authentic curated spots across 7 major Kerala hubs with high-resolution imagery and local transit estimates.
  - ✓ **Safety Buffer Guarantee**: A non-negotiable 30-minute return cushion locked into layover mode.
  - ✓ **100% Offline Edge Intelligence**: High-speed local inference using fine-tuned Qwen 2.5:3B on Ollama at **71.4 tokens/sec** with zero API costs.
- **Speaker Notes**:
  > *"When you're waiting at Shoranur Junction with 3 hours before your train, Google Maps tells you to stay at the station or visit a spot 20km away. Spot-Undoo solves this by providing time-locked, budget-conscious local exploration that guarantees you return to your platform on time."*

---

## 📽️ Slide 3: Tab 01 — Explore: Dual Location & Discovery
- **Header**: Discovery Map & Dual Canvas
- **Key Features**:
  - 🗺️ **Dual Canvas Exploration**: Seamless toggle between our stylized Neo-Brutalist Adventure Map and an interactive Leaflet OpenStreetMap view.
  - 📍 **7 Curated Kerala Hubs**: Shoranur Jn, Kochi, Calicut, Palakkad, Trivandrum, Kollam, and Wayanad.
  - 🔍 **Live Distance & Deep Links**: Direct coordinate callouts, category filtering (Hidden, Food, Chill, Tourist), and one-tap Google Maps turn-by-turn navigation.
- **Speaker Notes**:
  > *"On Tab 1, travelers can explore 70 curated spots across Kerala. They can view them on our playful river-road adventure canvas or switch to live satellite-calibrated OpenStreetMap with auto-centering."*

---

## 📽️ Slide 4: Tab 02 — AI Planner: Constraints & Vibe Input
- **Header**: Constraints & Natural Language Intent
- **Key Inputs**:
  - 🚆 **Trip Context Modes**: Layover (Train/Flight Buffer), Quick Free Time, or Full Day Trip.
  - ⏱️ **Time & Budget Controls**: Sliders from 1 to 8 hours and ₹50 to ₹2000 per person.
  - 💬 **Natural Language Intent Prompt**: Express complex wishes (e.g. *'quiet riverside spot with hot pazhampori and AC gaming lounge'*).
  - 🛡️ **Deterministic Pre-Filter**: Native math filters out spots exceeding distance or budget in 2.1ms before the LLM runs.
- **Speaker Notes**:
  > *"The magic starts on Tab 2. Instead of generic checkboxes, travelers type their raw intent in plain English or Malayalam-English slang. Our engine mathematically validates the physical feasibility before handing it to the AI."*

---

## 📽️ Slide 5: Itinerary Map — Adventure Trail & 3 Plans
- **Header**: Generated Route & Safe Return Protocol
- **3 Distinct Output Plans**:
  - **Plan 1 (Best Mood & Review Match)**: High-vibe route matching prompt keywords.
  - **Plan 2 (Ultra-Budget Saver)**: Minimized transit fares and free public scenic spots.
  - **Plan 3 (Hidden Gem Route)**: Artisan clusters, river sandbars, and secret heritage alleys.
- **Protocol**: Locked safety return pill (e.g., `⏰ 17:10 PM • SAFE RETURN TO SHORANUR JN`).
- **Speaker Notes**:
  > *"Within 2.39 seconds, the model synthesizes 3 diverse itineraries. Each stop has realistic auto-rickshaw fares, walking durations, and stay times with a guaranteed safe return buffer."*

---

## 📽️ Slide 6: Tab 03 — Add Spot: Community UGC & MongoDB Atlas
- **Header**: Community Contributions & Cloud Persistence
- **Highlights**:
  - 📸 **On-Device Multimodal Tagging**: Photos resized on HTML5 canvas with automated AI vibe tags (`#Riverside`, `#QuietVibe`).
  - 🍃 **MongoDB Atlas Cloud Sync**: UGC spots, traveler reviews, and saved plan histories stored across Mongoose cloud schemas (`places`, `reviews`, `plans`).
- **Speaker Notes**:
  > *"Spot-Undoo is community-powered. Travelers snap a photo of a secret tea stall, and our on-device model generates descriptive hashtags and saves it straight to MongoDB Atlas."*

---

## 📽️ Slide 7: Technical Architecture: Zero-Hallucination Pipeline
- **Header**: Two-Stage Architecture
- **Stage 1 (Physical Hard Filter)**:
  - Haversine + 1.3x Kerala road transit matrix.
  - Non-negotiable 30m layover return cushion.
  - Executed in native application logic in 2.1ms.
- **Stage 2 (Local Edge AI)**:
  - Fine-tuned **Qwen 2.5:3B** running via Ollama.
  - GPU accelerated via cuBLAS on NVIDIA RTX 3050.
  - 71.4 tokens/sec, 2.39s warm latency, 2048 context window.
- **Database & Mobile**:
  - MongoDB Atlas Cloud REST API on port 4000.
  - Native Android APK & installable PWA via LAN auto-binding.
- **Speaker Notes**:
  > *"Why two stages? Traditional LLMs hallucinate impossible travel times. By enforcing physical spatial constraints in native code first, Qwen only reasons over verified, physically achievable candidate stops."*

---

## 📽️ Slide 8: Project Roadmap & Future Scope
- **Phase 1 (Completed for Hackathon)**:
  - [x] 7 Kerala Hubs & 70 curated spots.
  - [x] Local Qwen 2.5 3B edge inference (2.39s warm response).
  - [x] MongoDB Atlas cloud persistence for UGC and reviews.
  - [x] Native Android package & installable PWA.
- **Phase 2 (Future Roadmap)**:
  - [ ] **Offline Vector Search (Qdrant/Chroma)**: Pure offline semantic query matching.
  - [ ] **Native Malayalam Audio Guide**: Spoken guides powered by Piper TTS & Whisper ASR.
  - [ ] **Live IRCTC Train Delay Sync**: Webhooks adjusting layover buffers dynamically.
  - [ ] **Auto-Driver Monetization Kiosks**: Curated guide trails with UPI micro-payments.
- **Speaker Notes**:
  > *"Looking ahead, Spot-Undoo is designed to empower local auto drivers and homestays to monetize their hyper-local knowledge, turning every train layover in Kerala into a memorable micro-adventure."*
