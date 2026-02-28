<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Sora&weight=700&size=32&duration=3000&pause=1000&color=3B82F6&center=true&vCenter=true&width=700&lines=🏥+SehatSaathi;AI-First+Healthcare+for+India;सेहत+साथी+-+आपका+AI+स्वास्थ्य+साथी" alt="SehatSaathi Typing SVG" />

<br/>

<p>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Groq_LPU-FastChat-F55036?style=for-the-badge&logo=groq&logoColor=white" />
  <img src="https://img.shields.io/badge/Flask-ML_Service-000000?style=for-the-badge&logo=flask&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/ElevenLabs-TTS-1A1A2E?style=for-the-badge" />
</p>

<p>
  <img src="https://img.shields.io/badge/Languages-English_%7C_हिंदी-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/Status-Live_Demo_Ready-success?style=flat-square" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" />
  <img src="https://img.shields.io/badge/Made_in-🇮🇳_India-ff9933?style=flat-square" />
</p>

<br/>

> **SehatSaathi** is a production-grade, AI-first healthtech platform that delivers intelligent clinical triage, preventive screening, prescription intelligence, and rural outreach — in the patient's own language.

<br/>

[🚀 Live Demo](#-live-demo) &nbsp;•&nbsp; [🎥 Demo Video](#-demo-video) &nbsp;•&nbsp; [🧠 AI Architecture](#-ai--ml-architecture) &nbsp;•&nbsp; [⚡ Quick Start](#-quick-start) &nbsp;•&nbsp; [📡 API Reference](#-api-reference)

</div>

---

## 📖 What is SehatSaathi?

**SehatSaathi** (सेहत साथी — "Health Companion") is a comprehensive, monorepo-based healthtech platform engineered for both **urban smartphone users** and **rural populations** served by NGO/ASHA workers. It fuses Generative AI, Machine Learning, and real-time voice synthesis to create a voice-first, multilingual healthcare assistant that works across connectivity constraints.

```
🇮🇳 Built for India's 1.4 billion — where healthcare equity is a right, not a privilege.
```

---

## 🎯 The Problem We're Solving

| Problem | SehatSaathi's Answer |
|---|---|
| 🏚️ Rural patients lack access to primary triage | AI voice bot in Hindi, no typing required |
| 📄 Handwritten prescriptions are unreadable | Instant OCR + GenAI medicine explanation |
| 🩺 Complex health forms confuse patients | Conversational AI asks questions naturally |
| 📵 Offline villages have no smartphone access | SMS-based outreach via Fast2SMS cron |
| 🌐 English-only health apps exclude 90% of India | Full English ↔ Hindi UI + AI responses in 8 languages |
| 👨‍👩‍👧‍👦 Fragmented family health data | Centralized Family Vault across devices |

---

## ✨ Features

### 🎙️ Dual-AI Voice Clinical Assistant
> **Groq (LPU)** for ultra-low-latency real-time voice → **Gemini** for deep file analysis

- **Voice-First Design**: Zero-text, premium centered Voice Orb with 7-bar Framer Motion waveform visualizer
- **isFinal Guard**: Only sends finalized speech transcripts — eliminates 429 rate limit errors
- **1-Second Silence Debounce**: Waits for natural speech completion before API call
- **ElevenLabs TTS**: Hyper-realistic audio output with adjustable mood (Calm / Anxious / Urgent)
- **Transcript Accumulation**: Captures multi-sentence speech correctly via `transcriptRef`
- **Auto-Resume**: Microphone automatically restarts after AI finishes speaking

### 🧠 AI Medical Intelligence
- **Gemini Diabetes Report**: Personalized AI report addressed to the patient **by their real name**
- **Multilingual AI Insights**: Reports generated in the user's active language (8 supported)
- **Risk Stratification**: ML-powered diabetes probability score + Gemini clinical narrative
- **Voice-Enabled Report**: Tap to hear the full AI report via ElevenLabs, then ask follow-up questions

### 🔬 Diabetes Risk Intelligence
- Structured clinical form (BMI, HbA1c, glucose, hypertension, smoking history)
- Flask ML microservice (`scikit-learn`) for risk probability scoring
- AI narrative delivered in **the patient's name and active language**
- Historical assessment tracking with confidence scores

### 🧠 Holistic Health Metrics Suite
> *Combating rural mental health stigma — one screener at a time*
- **PHQ-9 Depression Screener**: Clinically validated 9-item questionnaire, auto-scored and risk-stratified (Minimal → Severe)
- **GAD-7 Anxiety Screener**: Validated General Anxiety Disorder tool with severity bands and practitioner-ready output
- **BMI Calculator**: Real-time Body Mass Index with animated gauge and WHO category classification
- **BMR / Calorie Target**: Mifflin-St Jeor equation-based daily calorie needs, split by activity level
- **Hydration Tracker**: Weight-based daily water target with animated fill gauge
- All results are **persisted securely** to the user's clinical dashboard for longitudinal tracking

### 📋 Smart Prescription Scanner
- Upload JPG/PNG/PDF prescriptions
- Gemini Vision extracts medicines, dosage, frequency, interactions
- Generic alternatives with estimated savings
- Dietary advice and drug interaction warnings

### 🚨 Emergency SOS Protocol
- Describe any emergency in text or voice
- AI generates step-by-step first aid with do/don't lists and critical severity badge
- **One-tap SOS** triggers a **Node.js backend integration with Fast2SMS** — instantly sending an emergency text message containing the patient's **precise GPS coordinates** to registered local health workers or family members, securing the **Golden Hour**
- Location-denied fallback: alert still dispatches without coordinates, ensuring the contact is always notified
- Pre-built guides for 20+ emergency scenarios

### 🏥 Rural Outreach Command
- Offline-capable patient roster for ASHA/NGO workers
- Voice triage recording per patient
- Automated Fast2SMS cron reminders to patients
- Sync status indicator (Online/Offline)
- Full Hindi localization for field workers

### 👤 Personalized Identity & Profile
- **Google Profile Photo** displayed in Navbar, Sidebar, and Profile Page (no more initials)
- Firebase Auth-linked clinical profile (blood group, chronic conditions, allergies)
- Emergency contact vault
- Secure AES-256 encrypted vault syncing

### 🌐 Full Bilingual UI (English ↔ हिंदी)
- Instant language switching via navbar toggle
- All pages translated: Home, Chat, Diabetes, Profile, Emergency, Prescription, Hospitals, Vitals, and more
- AI responses mirror the selected language (8 Indian languages supported)
- `t('key')` i18n system with graceful English fallback

---

## 🧠 AI / ML Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SehatSaathi AI Brain                         │
├──────────────────────┬──────────────────────────────────────────┤
│   VOICE CHAT         │   FILE / DEEP ANALYSIS                   │
│   ─────────────      │   ─────────────────────                  │
│   Groq LPU™          │   Google Gemini 2.5 Flash                │
│   llama-3.3-70b      │   gemini-2.5-flash                       │
│   temp: 0.7          │   Vision + Text + Context                │
│   max_tokens: 300    │                                           │
│   < 200ms response   │   Used for:                              │
│                      │   - Prescription OCR analysis            │
│   Used for:          │   - Diabetes AI narrative report         │
│   - Voice Q&A        │   - Health record analysis               │
│   - Real-time chat   │   - Emergency guidance                   │
│   - Diabetes Q&A     │   - Medicine explanation                 │
└──────────────────────┴──────────────────────────────────────────┘
                              │
                   ┌──────────▼──────────┐
                   │   ElevenLabs TTS    │
                   │   Mood-adaptive     │
                   │   High-fidelity     │
                   └─────────────────────┘
```

### Full System Architecture

```
React Client (Vite 7, Tailwind, Framer Motion)
       │
       ├── Firebase Auth (Google OAuth + Email)
       │
       ▼
Node.js API (Express 5 — Port 5000)
  ├── /api/chat/voice    → Groq llama-3.3-70b  [🔵 Real-time]
  ├── /api/chat/message  → Gemini 2.5 Flash    [🟢 Analysis]
  ├── /api/predict/*     → Flask ML Service    [🔬 Inference]
  ├── /api/tts/*         → ElevenLabs          [🎙️ Audio]
  ├── /api/hospitals/*   → ORS + Maps          [🗺️ Location]
  └── MongoDB Atlas                            [💾 Data]
         │
         ▼
Python Flask ML Service (Port 5001)
  ├── /predict — scikit-learn Diabetes Model
  └── /metrics — Model accuracy & dataset info
```

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite 7, Tailwind CSS 4 | Core UI & Build |
| **Animations** | Framer Motion | Voice Orb, Waveform, Page Transitions |
| **State/Context** | React Context (Auth, Language) | Global State |
| **Backend** | Node.js 18, Express 5 | REST API Orchestration |
| **Primary AI** | Google Gemini 2.5 Flash | File analysis, clinical narrative |
| **Voice AI** | Groq LPU (llama-3.3-70b) | Ultra-fast voice chat responses |
| **TTS** | ElevenLabs | Hyper-realistic mood-adaptive speech output |
| **ML Service** | Python 3.10, Flask, scikit-learn | Diabetes risk prediction |
| **Mental Health** | PHQ-9 & GAD-7 Scoring Algorithms | Depression & Anxiety clinical screeners |
| **Database** | MongoDB Atlas + Mongoose | Health data persistence |
| **Auth** | Firebase Authentication | Google OAuth + Email/Password |
| **Media** | Multer | Prescription file uploads |
| **Messaging** | Fast2SMS 🇮🇳 | Indian SMS Gateway — Emergency GPS alerts & Rural ASHA reminders |
| **Maps** | OpenRouteService API | Hospital location discovery |

---

## 🌍 Language & Accessibility Support

| Language | UI | AI Responses | Voice Input |
|---|---|---|---|
| 🇬🇧 English | ✅ Full | ✅ | ✅ en-IN |
| 🇮🇳 हिंदी | ✅ Full | ✅ | ✅ hi-IN |
| 🇮🇳 বাংলা | — | ✅ | — |
| 🇮🇳 தமிழ் | — | ✅ | — |
| 🇮🇳 తెలుగు | — | ✅ | — |
| 🇮🇳 मराठी | — | ✅ | — |
| 🇮🇳 ગુજરાતી | — | ✅ | — |
| 🇮🇳 ಕನ್ನಡ | — | ✅ | — |

---

## 🚀 Live Demo

> **[▶ Open SehatSaathi Live App](#)** *(Update once deployed to Render/Vercel)*

### Login Credentials for Demo
| Field | Value |
|---|---|
| Method | Google OAuth (Recommended) |
| Email | Use your own Google account |

---

## 🎥 Demo Video

> **[📺 Watch Full Demo on YouTube / Loom](#)** *(Add link here)*

**Demo script covers:**
1. 🔐 Google Sign-In with real profile photo appearing instantly
2. 🗣️ Voice-to-voice AI Doctor chat (Groq-powered, <200ms)
3. 🩺 Diabetes Risk Intelligence form → personalized AI report in Hindi
4. 📋 Prescription photo upload → medicine breakdown & interactions
5. 🚨 Emergency SOS — live first-aid guidance
6. 🏘️ Rural Outreach dashboard — register patient, log vitals, trigger SMS
7. 🌐 Live language switch: full UI flips English ↔ हिंदी instantly

---

## ⚙️ Quick Start

### Prerequisites
```
Node.js 18+    npm 9+    Python 3.10+    MongoDB URI    Firebase Project
Gemini API Key    Groq API Key    ElevenLabs API Key
```

### 1. Clone & Install

```bash
git clone https://github.com/your-username/sehat-saathi.git
cd sehat-saathi

# Install all dependencies
cd client && npm install
cd ../server && npm install
cd ../ml-service && pip install -r requirements.txt
```

### 2. Environment Setup

<details>
<summary><b>📄 <code>client/.env</code></b></summary>

```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
</details>

<details>
<summary><b>📄 <code>server/.env</code></b></summary>

```env
PORT=5000
MONGO_URI=mongodb+srv://...
ML_SERVICE_URL=http://localhost:5001
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
GROQ_API_KEY=your_groq_key
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=your_voice_id
ORS_API_KEY=your_ors_key
FAST2SMS_API_KEY=your_fast2sms_key
FIREBASE_PROJECT_ID=your-project-id
```
</details>

### 3. Run All Services

```bash
# Terminal 1 — Frontend
cd client && npm run dev       # http://localhost:5173

# Terminal 2 — Backend API
cd server && npm run dev       # http://localhost:5000

# Terminal 3 — ML Service
cd ml-service && python app.py # http://localhost:5001
```

---

## 📡 API Reference

**Base URL:** `http://localhost:5000/api`

### 🎙️ AI Chat
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/chat/voice` | **Groq** real-time voice chat (llama-3.3-70b) |
| `POST` | `/chat/message` | **Gemini** deep analysis + file chat |
| `GET` | `/chat/history` | Retrieve session history |

### 🔬 Predictions
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/predict/diabetes` | ML risk score + personalized Gemini narrative |
| `POST` | `/predict/risk` | General health risk assessment |
| `POST` | `/predict/disease` | Symptom-based disease prediction |
| `GET` | `/predict/metrics` | Model accuracy and dataset info |

### 📋 Prescription
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/prescription/upload` | Upload & OCR scan |
| `POST` | `/prescription/analyze` | Gemini analysis of scanned text |

### 🏥 Hospitals
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/hospitals/nearby` | Find hospitals by GPS coordinates |
| `GET` | `/hospitals/search` | Search by name/city |

### 👤 Auth & Profile
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/sync` | Firebase token → MongoDB user sync |
| `GET` | `/auth/profile` | Get clinical profile |
| `PUT` | `/auth/profile` | Update clinical profile |

### 🏘️ Rural Outreach
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/sms/patients` | List camp patients |
| `POST` | `/sms/simulate-inbound` | Trigger SMS outreach simulation |

---

## ⚖️ Ethics, Bias & Responsible AI

> SehatSaathi is a **clinical triage aide — not a diagnostic tool**. Licensed physician consultation is always recommended.

| Concern | Our Approach |
|---|---|
| **Medical Liability** | Hard-coded clinical disclaimers in all AI responses |
| **Hallucination Risk** | Conservative Gemini temperature (0.7), narrow system prompts |
| **Dataset Bias** | Current dataset: general diabetes cohort — not yet localized to Indian demography |
| **Data Privacy** | Firebase Auth + MongoDB encrypted at rest; no PII shared with AI APIs |
| **ABDM Compliance** | Architected for Ayushman Bharat Digital Mission integration (future roadmap) |

---

## 💼 Business Model

```
┌─────────────────────────────────────┐
│           Revenue Streams           │
├─────────────────────────────────────┤
│ 🏢 B2B SaaS (NGOs, Govt, CSR)       │
│    Rural dashboard licences         │
├─────────────────────────────────────┤
│ 👤 B2C Freemium                     │
│    Premium: Family Vault, History   │
│    hardware sync, tele-consult      │
├─────────────────────────────────────┤
│ 🔗 Marketplace Commission           │
│    Doctor bookings, pharmacy orders │
└─────────────────────────────────────┘
```

**Scalability:** Stateless Express API + Flask microservices → deploy on AWS ECS / GCP Cloud Run / Render with zero-downtime horizontal scaling.

---

## 📁 Project Structure

```
sehat-saathi/
├── client/                    # React 19 + Vite Frontend
│   ├── src/
│   │   ├── pages/             # ChatPage, DiabetesPage, ProfilePage...
│   │   ├── components/        # Reusable UI (Sidebar, Navbar, Card...)
│   │   ├── hooks/             # useVoiceLoop.js (voice engine)
│   │   ├── context/           # AuthContext, LanguageContext
│   │   ├── services/          # api.js (Groq + Gemini routing)
│   │   └── locales/           # en.json, hi.json (i18n)
├── server/                    # Node.js + Express 5 Backend
│   ├── controllers/           # chatController, predictionController...
│   ├── services/              # geminiService, mlService, ttsService
│   ├── routes/                # chatRoutes, predictionRoutes...
│   └── models/                # Mongoose schemas
└── ml-service/                # Python Flask ML Microservice
    ├── app.py                 # REST API endpoints
    └── model/                 # scikit-learn trained model
```

---

<div align="center">

### Built with ❤️ for Inclusive Healthcare in India 🇮🇳

<p>
  <img src="https://img.shields.io/badge/Powered_by-Groq_LPU™-F55036?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Powered_by-Google_Gemini-4285F4?style=for-the-badge&logo=google" />
  <img src="https://img.shields.io/badge/Powered_by-ElevenLabs-1A1A2E?style=for-the-badge" />
</p>

*"Technology in service of humanity — सेवा में तकनीक।"*

</div>
