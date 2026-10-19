---
title: Spot Undoo
emoji: 📍
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
---

# 📍 Spot-Undoo

<div align="center">

<img src="./public/spot-undoo-logo.png" alt="spot-undoo logo" width="380" />

<br/>

**Local-First AI Kerala Micro-Travel Planner & Layover Optimizer**

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Groq](https://img.shields.io/badge/Groq-Qwen_3.8_27B-F55036?style=for-the-badge&logo=fastapi&logoColor=white)](https://groq.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-Cloud-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Ollama](https://img.shields.io/badge/Ollama-Local_Inference-black?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.com/)
[![Qwen 2.5](https://img.shields.io/badge/Model-Qwen_2.5_3B-blueviolet?style=for-the-badge)](https://huggingface.co/Qwen)
[![PWA](https://img.shields.io/badge/PWA-Installable-purple?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![DEV Community](https://img.shields.io/badge/DEV_Community-Read_Article-0A0A0A?style=for-the-badge&logo=dev.to&logoColor=white)](https://dev.to/fm9447/spot-undoo-privacy-first-ai-kerala-micro-travel-planner-layover-explorer-1528)
[![Demo Video](https://img.shields.io/badge/Demo_Video-Watch_on_ngram-FF4F00?style=for-the-badge&logo=youtube&logoColor=white)](https://www.ngram.com/app/v2/chat/wrun_41M55NHJZP0GJNJ5J90J6HXVYK)

<br/><br/>

[![Watch Demo Video](https://img.shields.io/badge/▶_Watch_Demo_Video-Click_Here-brightgreen?style=for-the-badge)](https://www.ngram.com/app/v2/chat/wrun_41M55NHJZP0GJNJ5J90J6HXVYK)
[![Read on DEV](https://img.shields.io/badge/📖_Read_Full_Article_on_DEV-Click_Here-black?style=for-the-badge)](https://dev.to/fm9447/spot-undoo-privacy-first-ai-kerala-micro-travel-planner-layover-explorer-1528)

</div>

---

## 🌟 Overview

**Spot-Undoo** is an open-source, privacy-first travel companion, itinerary generator, and micro-exploration engine tailored for **all 14 districts across the entire state of Kerala**. Traditional navigation and travel apps (Google Maps, TripAdvisor) funnel millions of tourists toward the same commercial bottlenecks while ignoring the quiet backwater channels, century-old bakeries, and heritage alleyways that embody the true soul of God's Own Country.

Spot-Undoo solves this by pairing **locally hosted open-weight Edge AI** (fine-tuned **Qwen 2.5:3B** running on Ollama) and **Cloud AI** (**Groq Qwen 3.8 27B** & **Google Gemini Flash Latest / 3.8**) with **MongoDB Atlas** for crowd-sourced review persistence and community gem verification. 

Whether you have a 45-minute train layover at **Shoranur Junction**, an evening before a flight from **Kochi**, or a weekend exploring **Wayanad**, Spot-Undoo plans deterministic, budget-guaranteed itineraries on the fly—completely offline or across a private local Wi-Fi network with zero per-token cloud API fees.

---

## 📸 Latest App Screenshots

<div align="center">
  <img src="screeens/latest_explore.png" width="30%" alt="Neo-Brutalist 60fps OpenStreetMap" />
  <img src="screeens/latest_planner.png" width="30%" alt="AI Itinerary Planner" />
  <img src="screeens/latest_upload.png" width="30%" alt="Community Hidden Spot Upload" />
</div>
<br/>
<div align="center">
  <img src="screeens/latest_login.png" width="45%" alt="Native Neo-Brutalist Authentication" />
</div>

---

## ✨ Core Features

### 1. 🧠 Multi-Tier AI Synthesis Engine (Groq + Gemini + Ollama)
- **Tier 1 (Cloud Groq Qwen 3.8 27B)**: Ultra-fast sub-second cloud itinerary generation and story polishing.
- **Tier 2 (Google Gemini Flash & Vision)**: Multimodal spot image verification, hashtag generation, and automated cloud fallback for structured JSON travel itineraries.
- **Tier 3 (Edge AI On-Device Inference)**: Runs completely offline on local machines or LAN servers using Ollama (`spot-undo-qwen` / `qwen2.5:3b`).
- **Tier 4 (Deterministic Heuristic Engine)**: Mathematical Haversine & transit routing fallback when all models are offline.
- **Three Diverse Output Plans**:
  - **Plan 1 (Mood & Vibe Match)**: Tailored to user's desired atmosphere (Street Food, Chill, Chai & View).
  - **Plan 2 (Ultra-Budget Saver)**: Prioritizes low-cost or free public spots and walking routes.
  - **Plan 3 (Hidden Gem Route)**: Focuses on heritage, off-beat trails, and local artisan spots.

### 2. 🗺️ All-Kerala Coverage (14 Districts, 72+ Hubs, 400+ Curated Spots)
- Complete coverage across every Kerala district from Kasaragod to Thiruvananthapuram:
  - 🚆 **Central Transit Corridors**: Shoranur Jn, Pattambi, Thrissur, Palakkad, Ottapalam, Aluva, Ernakulam.
  - 🌊 **Coastal & Backwater Hubs**: Fort Kochi, Cherai, Varkala, Kovalam, Alappuzha, Kumarakom, Kollam, Bekal.
  - 🍲 **Malabar Cultural Cities**: Calicut (Kozhikode), Thalassery, Kannur, Manjeri, Malappuram, Tirur.
  - ⛰️ **Highland & Plantation Zones**: Munnar, Wayanad (Kalpetta, Sulthan Bathery), Vagamon, Thekkady, Ponmudi.
  - 🏛️ **Heritage & Pilgrimage Hubs**: Trivandrum Central, Guruvayur, Kodungallur, Aranmula, Sabarimala Gateway.

### 3. 🛡️ Enterprise Security Suite
- **XSS Sanitization**: Automated input sanitization and entity encoding across all user reviews and uploaded spot names.
- **Sliding-Window IP Rate Limiting**: Enforced rate limits on OTP requests (3/min), review submissions (5/min), spot uploads (5/min), and authentication (5/5min).
- **Timing-Safe OTP Verification**: Cryptographic constant-time comparison (`crypto.timingSafeEqual` with SHA-256) eliminating timing side-channel attacks on 6-digit verification codes.
- **Content Security Policy (CSP)**: Strict origins (`accounts.google.com`, `*.firebaseapp.com`, `openstreetmap.org`, `wikimedia.org`) with `nosniff` and `SAMEORIGIN` clickjacking protection.
- **APK Release Obfuscation**: Android R8 / ProGuard code minification and resource shrinking enabled in `android/app/build.gradle` and `proguard-rules.pro`.

### 4. 📍 Smart Location Engine & 100m Proximity Guard
- **Instant Coordinate Extraction**: Paste any Google Maps URL (including short links like `maps.app.goo.gl`, `@lat,lng`, `!3dlat!4dlng`, or `query=lat,lng`) to automatically extract coordinates and place titles.
- **Auto-Fill Live GPS**: One-tap acquisition of live device coordinates, automatically generating a valid Google Maps search URL and detecting the nearest regional hub and landmark area.
- **100-Meter Proximity Verification**: Interactive proximity safeguard that detects if a spot already exists within 100 meters, displaying a rich place preview popup with ratings, photos, and reviews to confirm before adding.

### 5. 🎨 Dual Exploration Canvas & Neo-Brutalist Map Engine
- **Neo-Brutalist Adventure Canvas**: Stylized, high-contrast river-road trail mapping each stop with duration chips and transit pills.
- **High-Performance 60fps OpenStreetMap Canvas**: Full GIS map with dynamic multi-level zoom photo markers, viewport culling, and zero map lag.
- **Avada Map Themes**: On-the-fly map switching between Standard OSM, Dark Mode, High-Contrast Neo-Brutalist, and Voyager.
- **Verified Authentic Photography**: Contextual, high-resolution photography with automatic `onerror` CDN fallbacks so no spot ever shows broken icons or mismatched waterfalls.

### 6. 🍃 MongoDB Atlas Cloud & Native Google Auth
- **Native Android Google Sign-In**: Powered by `@codetrix-studio/capacitor-google-auth` for seamless one-tap native account selection on Android without opening external browser windows.
- **Community Hidden Spots**: Travelers can contribute new gems directly from their phone with photo uploads stored on Firebase Storage.
- **Real-Time Ratings & Reviews**: Synced directly to a MongoDB Atlas cloud cluster.
- **Saved Plan History**: Retrieve previously generated itineraries with a single tap.

### 7. 🛺 Multimodal Ride Hailing Comparator (Uber, Rapido & Ola)
- **Real-Time Kerala Transit Fares**: Computes calibrated fares based on official Kerala motor vehicle transport meter rates and live distance.
- **Multi-Platform Comparison**: Compare **Rapido Bike Taxi**, **Uber Moto**, **Uber Auto**, **Rapido Auto**, **Ola Auto**, and **Uber Go (AC Cab)** side-by-side.
- **Smart Ranking Filters**: Rank transit options by *Lowest Fare* or *Fastest ETA*, or filter directly by *Bikes*, *Autos*, or *Cabs*.
- **1-Tap Direct App Launch**: Clicking **"Go"** pre-fills the pickup and dropoff coordinates and directly launches the native **Uber** or **Rapido** app on the user's phone via deep link intent schemas.

---

## ⚡ Performance & Hardware Telemetry

Benchmarked on an **NVIDIA GeForce RTX 3050 Laptop GPU (6GB VRAM)**:

| Metric | Measured Value | Notes |
|---|---|---|
| **Model** | `spot-undo-qwen` (Qwen 2.5 3B Q4_K_M GGUF) | Unsloth fine-tuned |
| **Inference Generation Speed** | **71.4 tokens / sec** | GPU accelerated via cuBLAS |
| **Warm Generation Latency** | **2.39 seconds** | For full 3-plan JSON response |
| **Prompt Evaluation Latency** | **0.18 seconds** | Pre-filtered 6-candidate prompt |
| **VRAM Footprint** | **~2.4 GB** | Fits comfortably in 4GB & 6GB budget GPUs |
| **Context Window (`num_ctx`)** | **2048 tokens** | Optimized for fast KV-cache prefill |

---

## 🏗️ Architecture & Data Flow

```mermaid
flowchart TD
    User["📱 Android / Desktop User (PWA)"] -->|HTTP / Local Wi-Fi| Vite["⚡ Vite + React 18 Frontend (:5173)"]
    Vite -->|Static Kerala Spots (70)| LocalSeed["📦 keralaCitiesData.js"]
    Vite -->|User Spots & Reviews| Express["🚀 Express REST API (:4000)"]
    Express -->|CRUD Sync| Mongo["🍃 MongoDB Atlas (Cloud Cluster)"]
    Vite -->|Filtered Prompt & Constraints| Ollama["🦙 Ollama Local Server (:11434)"]
    Ollama -->|GPU Inference (71 t/s)| Qwen["🧠 spot-undo-qwen (3B Edge)"]
    Qwen -->|Structured JSON Plans| Vite
```

---

## 🚀 Step-by-Step Setup Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **Ollama**: Installed locally ([Download Ollama](https://ollama.com/))
- **Git**: For cloning the repository

---

### 2. Clone Repository & Install Dependencies

```bash
git clone https://github.com/FM9447/Spot-Undoo.git
cd Spot-Undoo

# Install frontend and backend packages
npm install
```

---

### 3. Setup Qwen 2.5 on Ollama

Pull the base Qwen 2.5:3B model:
```bash
ollama run qwen2.5:3b
```

*(Optional)* Create the fine-tuned Kerala Edge AI model from the included `training/Modelfile`:
```bash
ollama create spot-undo-qwen -f training/Modelfile
```

Verify the model is ready:
```bash
curl http://localhost:11434/api/tags
```

---

### 4. Configure Environment Variables

Create a `.env` file in the project root:
```env
MONGODB_URI=your_mongodb_atlas_connection_string
PORT=4000
```

> **Note**: If you don't have a MongoDB Atlas connection string yet, you can create a free M0 cluster in 2 minutes at [mongodb.com/atlas](https://www.mongodb.com/atlas). The app continues to work with local fallback data even if the database is offline!

---

### 5. Start the Application

Open two terminal tabs:

**Terminal 1 — Backend Server:**
```bash
node server.js
```
*(Runs on `http://0.0.0.0:4000`)*

**Terminal 2 — Frontend Dev Server:**
```bash
npm run dev -- --host 0.0.0.0
```
*(Runs on `http://0.0.0.0:5173`)*

---

### 6. Mobile Access on Android / iOS (PWA)

1. Ensure your phone and laptop are on the **same Wi-Fi network**.
2. Find your laptop's local IP address (`ip addr show` on Linux or `ipconfig` on Windows).
3. On your phone's browser (Chrome/Safari), navigate to:
   ```
   http://<your-laptop-ip>:5173
   ```
4. Tap the browser menu $\rightarrow$ **"Add to Home Screen"** or **"Install App"**.
5. Launch `Spot-Undoo` as a full-screen, standalone mobile application!

---

## ☁️ Cloud & Edge Hosting

### 1. 🚀 One-Click Deploy to Render (Frontend & Backend API)
Spot-Undoo includes a ready-to-deploy [`render.yaml`](./render.yaml) blueprint:
1. Connect your GitHub repository to [Render](https://render.com).
2. Create a new **Blueprint Instance** pointing to `render.yaml`.
3. Set your `MONGODB_URI` environment variable in the Render Dashboard.
4. Render builds the React SPA and launches the Node/Express backend on a single unified URL with automatic SSL.

### 2. 🦙 DigitalOcean Droplet LLM Node (Remote Inference)
Deploy Ollama with remote GPU/CPU acceleration on a DigitalOcean droplet:
```bash
# SSH into your DigitalOcean Ubuntu Droplet
chmod +x scripts/deploy-digitalocean-ollama.sh
./scripts/deploy-digitalocean-ollama.sh
```
This script configures UFW firewall rules, installs Ollama, exposes port 11434 with CORS enabled (`OLLAMA_ORIGINS="*"`), and pulls `qwen2.5:3b`. You can then plug the droplet's public IP directly into Spot-Undoo's in-app settings!

### 3. 🐳 Docker Fullstack Container
```bash
docker build -t spot-undoo:latest .
docker run -p 4000:4000 -e MONGODB_URI="your_mongodb_atlas_uri" spot-undoo:latest
```

---

## 🔬 Dataset & Fine-Tuning Pipeline

The repository includes a complete training pipeline under the `training/` directory:

- [`training/fetch_osm_spots.py`](file:///media/fm9447/D/MULearn/Hackotberfest/training/fetch_osm_spots.py): OpenStreetMap Overpass API scraper for Kerala POIs.
- [`training/fetch_nominatim_real_places.py`](file:///media/fm9447/D/MULearn/Hackotberfest/training/fetch_nominatim_real_places.py): Reverse geocoding & coordinate enrichment.
- [`training/dataset_generator.py`](file:///media/fm9447/D/MULearn/Hackotberfest/training/dataset_generator.py): Synthesizes multi-turn itinerary planning pairs formatted for instruction tuning.
- [`training/train_unsloth.py`](file:///media/fm9447/D/MULearn/Hackotberfest/training/train_unsloth.py) & [`training/train_colab.ipynb`](file:///media/fm9447/D/MULearn/Hackotberfest/training/train_colab.ipynb): Google Colab notebook for LoRA fine-tuning Qwen 2.5 using Unsloth.
- [`training/Modelfile`](file:///media/fm9447/D/MULearn/Hackotberfest/training/Modelfile): Ollama model configuration with system prompt and temperature parameters.

---

## 🗺️ Future Roadmap & Plans

- [ ] **Offline Vector Search (Qdrant / Chroma)**:
  - Run embedded on-device vector search so users can query natural queries like *"places with good filter coffee and old wooden chairs"* without any network access.
- [ ] **Native Malayalam Audio Tour Guide**:
  - Integration with lightweight on-device TTS (Piper) and ASR (Whisper) for hands-free, spoken audio guides in both English and Malayalam.
- [ ] **Live Train Delay Synchronization**:
  - Integrate live train arrival webhooks to dynamically stretch or compress itinerary layover buffers in real time when trains are delayed.
- [ ] **Driver & Local Guide Monetization Kiosk**:
  - Enable local auto-rickshaw drivers and homestay hosts to curate custom tourist trails and monetize them via micro-payments (UPI QR codes).
- [ ] **Peer-to-Peer Mesh Sync (BLE / Wi-Fi Direct)**:
  - Enable backpackers without mobile signal in deep forest trails (Wayanad, Silent Valley) to sync spots and reviews peer-to-peer.

---

## 🤝 Contributing

Contributions are welcome! Whether it is adding new Kerala hidden spots, improving prompt engineering, or enhancing the mobile UI:

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingSpot`).
3. Commit your Changes (`git commit -m 'Add new Wayanad tea stall'`).
4. Push to the Branch (`git push origin feature/AmazingSpot`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
Built with ❤️ for <b>Kerala Travelers & Micro-Explorers</b>
</div>
