# 📍 spot-undoo

> **Smart AI-Powered Kerala Travel & Layover Explorer**  
> Local-First • Real-Time Offline Edge Intelligence • 70+ Kerala Hidden Spots • MongoDB Atlas

![spot-undoo Banner](./public/logo.png)

---

## 🌟 Overview

**spot-undoo** is a local-first, privacy-focused travel companion and layover optimizer engineered for travelers in Kerala. Whether you have a 45-minute train layover at **Shoranur Jn**, an evening in **Fort Kochi**, or a weekend in **Wayanad**, spot-undoo plans realistic, budget-conscious routes using on-device Edge LLMs.

---

## ✨ Key Features

- **🧠 Edge LLM Itinerary Generation**: Uses fine-tuned local models (`spot-undo-qwen`, Qwen 2.5:3B, Qwen 3:4B via Ollama) to craft time-budgeted travel plans with transit estimates and layover safety buffers.
- **🗺️ 7 Kerala Hubs & 70+ Real Spots**: Shoranur Jn Hub, Kochi (Ernakulam Central), Calicut / Kozhikode, Palakkad Town, Trivandrum Central, Kollam Jn, and Wayanad (Kalpetta).
- **🎨 Dual Exploration Canvas**:
  - **Adventure Canvas**: Stylized river-road neo-brutalist cartoon view.
  - **Live OSM Map**: Interactive Leaflet / OpenStreetMap with auto-centering and route navigation.
- **⚡ Quick AI Hashtags**: Fast on-device multimodal hashtag and caption generator for uploaded community spots.
- **⭐ Community Reviews with MongoDB Atlas**: Live rating and review persistence syncing to MongoDB Atlas cloud.
- **📱 Android PWA Ready**: Installable as a native standalone app on Android and iOS with zero URL bars, custom app icons, and offline caching.

---

## 🚀 Getting Started

### Prerequisites

1. **Node.js** (v18+)
2. **Ollama** installed with model:
   ```bash
   ollama pull qwen2.5:3b
   ```
3. **MongoDB Atlas** connection string (in `.env`).

### Installation

```bash
# Clone the repository
git clone https://github.com/FM9447/Spot-Undoo.git
cd Spot-Undoo

# Install frontend & backend dependencies
npm install
```

### Environment Configuration

Create a `.env` file in the root:
```env
MONGODB_URI=your_mongodb_atlas_connection_string
PORT=4000
```

### Run Locally

```bash
# Terminal 1: Start Backend (Port 4000)
node server.js

# Terminal 2: Start Frontend (Port 5173, accessible on LAN)
npm run dev -- --host 0.0.0.0
```

Open `http://localhost:5173` on desktop or `http://<laptop-ip>:5173` on your Android phone!

---

## 📱 Mobile PWA Installation (Android / iOS)

1. Connect your phone to the same Wi-Fi network as your laptop.
2. Open `http://<your-laptop-ip>:5173` in Google Chrome or Safari.
3. Tap **Add to Home Screen** / **Install App**.
4. Launch `spot-undoo` directly from your home screen as a native app!

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Leaflet / OpenStreetMap |
| **Backend** | Node.js, Express, MongoDB Atlas Driver |
| **AI / LLM** | Ollama (Local Edge Inference: `spot-undo-qwen`, Qwen 2.5:3B, Qwen 3:4B) |
| **Design** | Neo-Brutalist High-Contrast Micro-UI |

---

## 📄 License

MIT License © 2026 Hadhy (FM9447)
