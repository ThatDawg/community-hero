# Vision AI

> AI-powered platform for citizens to report, track, and resolve community issues through collaboration, data, and intelligent automation.

**Built for the Vibe2Ship Hackathon** — Coding Ninjas × Google for Developers

## Live Demo

🔗 [https://community-hero-500915.web.app](https://community-hero-500915.web.app)

## Key Features

- **AI-Powered Issue Categorization** — Gemini AI automatically categorizes issues, predicts severity, and routes to the correct department
- **YOLO Image Detection** — Detect potholes, garbage, broken streetlights, water leakage from photos
- **Interactive Map** — Leaflet + OpenStreetMap (free, unlimited) visualizing all reported issues
- **Community Verification** — Upvote and confirm issues to prioritize resolution
- **AI Chatbot** — Gemini-powered conversational assistant for quick issue analysis
- **Voice Reporting** — Report issues using voice commands with Whisper transcription
- **Impact Dashboard** — Analytics with charts showing issues by category, status, and severity
- **Gamification** — Badges and leaderboard for active citizens
- **Google Sign-In** — Secure authentication via Firebase

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS, Shadcn UI |
| Backend | FastAPI (Python) |
| AI | Gemini 2.5 Flash, YOLO |
| Database | Firebase Firestore |
| Auth | Firebase Authentication (Google + Email) |
| Storage | Firebase Storage |
| Maps | Leaflet + OpenStreetMap |
| Notifications | Firebase Cloud Messaging |
| Deployment | Firebase Hosting, Google Cloud Run |

## Google Technologies Utilized

| Service | Purpose |
|---------|---------|
| Gemini API | Issue categorization, severity prediction, department routing, AI chatbot |
| Firebase Authentication | Google + Email sign-in |
| Firebase Firestore | Real-time database for issues |
| Firebase Storage | Image upload storage |
| Firebase Cloud Messaging | Push notifications |
| Google Cloud Run | Backend deployment |

## Project Structure

```
vision-ai/
├── frontend/              # Next.js 15 + TypeScript
│   ├── src/app/           # Pages (auth, dashboard, report, map, chat, analytics)
│   ├── src/components/    # UI components
│   └── src/lib/           # Firebase, Firestore, API utils
├── backend/               # FastAPI backend
│   ├── main.py            # API entry point
│   ├── services/          # YOLO + Gemini services
│   └── utils/             # Config and Firebase admin
└── yolo-models/           # YOLO model files
```

## Setup

### Frontend
```bash
cd vision-ai/frontend
npm install
# Create .env.local with Firebase config
npm run dev
```

### Backend
```bash
cd vision-ai/backend
pip install -r requirements.txt
# Create .env with API keys
python main.py
```

## License

MIT
