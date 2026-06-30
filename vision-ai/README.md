# Vision AI

> AI-powered platform for citizens to report, track, and resolve community issues through collaboration, data, and intelligent automation.

## Live Demo

- **Frontend:** https://community-hero-500915.web.app/
- **GitHub:** https://github.com/ThatDawg/community-hero

## Project Structure

```
vision-ai/
├── frontend/              # Next.js 15 + TypeScript (Static Export)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                    # Landing page
│   │   │   ├── auth/page.tsx               # Auth (Google + Email, role selection)
│   │   │   └── dashboard/
│   │   │       ├── page.tsx                # Dashboard home
│   │   │       ├── report/page.tsx         # Report submission with AI analysis
│   │   │       ├── report-detail/page.tsx  # Report detail, comments, verify
│   │   │       ├── map/page.tsx            # Leaflet heatmap + nearby filter
│   │   │       ├── chat/page.tsx           # AI chatbot with voice + translation
│   │   │       ├── analytics/page.tsx      # Analytics with Gemini insights
│   │   │       ├── my-reports/page.tsx     # User's reports
│   │   │       ├── notifications/page.tsx  # Real-time notifications
│   │   │       ├── leaderboard/page.tsx    # Gamification
│   │   │       ├── government/page.tsx     # Official dashboard
│   │   │       ├── volunteer/page.tsx      # Volunteer task management
│   │   │       └── profile/page.tsx        # User profile
│   │   ├── components/
│   │   │   └── leaflet-map.tsx             # Leaflet map component
│   │   └── lib/
│   │       ├── firebase.ts                 # Firebase init
│   │       ├── firebase-context.tsx        # Auth context provider
│   │       ├── firestore.ts                # Firestore CRUD
│   │       ├── api.ts                      # FastAPI client
│   │       └── notifications.ts            # FCM + notifications
│   └── .env.local                          # Firebase + Gemini keys (gitignored)
├── backend/               # FastAPI backend for Cloud Run
│   ├── main.py                           # API endpoints
│   ├── models/schemas.py                 # Pydantic models
│   └── services/
│       ├── yolo_service.py               # YOLO detection (9 categories)
│       └── gemini_service.py             # Gemini analysis + chat
├── yolo-models/
│   └── train.py                          # Custom YOLO training script
├── firebase.json                         # Firebase Hosting config
├── firestore.rules                       # Firestore security rules
├── Dockerfile                            # Backend Docker image
└── cloudbuild.yaml                       # Cloud Build CI/CD
```

## Features

### Citizen Features
- **Report Issues** — Upload photo, AI auto-categorizes with YOLO, Gemini analyzes root cause + department
- **Live Map** — Leaflet heatmap, severity/category filters, nearby issues (1-25km radius)
- **AI Chatbot** — Voice dictation (Web Speech API), 12-language translation, follow-up questions
- **Notifications** — Real-time FCM alerts for report updates, nearby issues, verifications
- **Gamification** — Points, badges, leaderboard, level progression
- **Community Verification** — 3-verifier threshold before government action

### Volunteer Features
- Claim and manage assigned issues
- Available issues queue
- Resolve assigned issues
- Role-based dashboard view

### Government/Official Features
- **Status Management** — Start/resolve issues, assign departments
- **Analytics** — Gemini-generated insights, charts, department breakdowns
- **Export Reports** — Download JSON with Gemini-formatted summaries
- **Progress Summaries** — AI-generated reports for officials
- **Real-time Data** — Live Firestore updates

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS, Shadcn UI, Framer Motion |
| Backend | FastAPI (Python), YOLO (Ultralytics), Gemini 2.5 Flash |
| Database | Firebase Firestore |
| Auth | Firebase Authentication (Google + Email) |
| Storage | Firebase Storage (images) |
| Maps | Leaflet + OpenStreetMap (free, no API billing) |
| Notifications | Firebase Cloud Messaging |
| Voice | Web Speech API (browser) + Whisper (backend) |
| Hosting | Firebase Hosting (static export) |
| Backend Deploy | Google Cloud Run |

## Google Technologies Used
- **Gemini 2.5 Flash** — Issue categorization, chatbot, root cause analysis, progress summaries, translations, duplicate detection, leaderboard computation, analytics insights
- **Firebase Authentication** — Google + email/password, role-based (citizen/volunteer/official/admin)
- **Firebase Firestore** — Real-time database with subcollections (comments, verifications, notifications)
- **Firebase Storage** — Issue photo uploads
- **Firebase Cloud Messaging** — Real-time push notifications
- **Firebase Hosting** — Static export deployment
- **Google Cloud Run** — Backend API deployment
- **Google Cloud Build** — CI/CD pipeline
- **Google Cloud Logging** — Backend observability
- **Google Cloud Firestore** — Security rules for all collections

## Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.10+
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud SDK (for Cloud Run deployment)

### Frontend Setup
```bash
cd vision-ai/frontend
npm install

# Create .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyClXp-1dmVKaYPd8J2sdiIFexHKxhZ_Nvg
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=community-hero-500915.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=community-hero-500915
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=community-hero-500915.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1077028013372
NEXT_PUBLIC_FIREBASE_APP_ID=1:1077028013372:web:b88c8464dfb74cb669ca39
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GEMINI_API_KEY=YOUR_GEMINI_KEY
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000
EOF

npm run dev
```

### Backend Setup
```bash
cd vision-ai/backend
pip install -r requirements.txt

# Set Gemini API key
export GEMINI_API_KEY=your_key_here

python main.py
# Backend runs on http://localhost:8000
```

### Firebase Deployment
```bash
cd vision-ai

# Login
firebase login

# Deploy hosting + Firestore rules
firebase deploy --only hosting,firestore:rules
```

### Backend Deployment (Cloud Run)
```bash
cd vision-ai
gcloud run deploy vision-ai-backend --source . --region us-central1 --allow-unauthenticated
```

## Environment Variables

### Frontend (.env.local)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase config (auto-generated from Firebase Console) |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Google Gemini API key |
| `NEXT_PUBLIC_FASTAPI_URL` | Backend URL (default: http://localhost:8000) |

### Backend
| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | YOLO detection + Gemini analysis |
| POST | `/api/chat` | AI chatbot conversation |
| POST | `/api/voice` | Whisper voice transcription |
| POST | `/api/summary` | AI progress summary for officials |
| POST | `/api/analytics` | Analytics data with Gemini insights |
| POST | `/api/heatmap` | Heatmap data for map |

## YOLO Model Training
```bash
cd vision-ai
python yolo-models/train.py --data dataset.yaml --epochs 100 --model yolov8n.pt
```

Categories: pothole, garbage, streetlight, water_leakage, road_damage, traffic_signal, construction, flooding, fire

## Firestore Security Rules

All collections require authentication. Rules cover:
- `users/{userId}` — Profile data, roles, points
- `reports/{reportId}` — Issue reports with subcollections
- `reports/{reportId}/comments/{commentId}` — Comments
- `reports/{reportId}/verifications/{verificationId}` — Community verification
- `notifications/{notificationId}` — Push notifications
- `leaderboard/{entryId}` — Gamification entries
- `volunteers/{volunteerId}` — Volunteer task management

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/feature-name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/feature-name`)
5. Open a Pull Request

## License

MIT
