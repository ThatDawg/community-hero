# Vision AI

> AI-powered platform for citizens to report, track, and resolve community issues through collaboration, data, and intelligent automation.

## Problem Statement

Civic issues like potholes, garbage accumulation, broken streetlights, and water leakage often go unreported or take weeks to resolve. Citizens lack a simple way to report problems, and government departments lack real-time visibility into issue distribution and resolution progress.

**Vision AI** solves this by combining AI-powered image analysis, community verification, and real-time dashboards to streamline the entire civic issue lifecycle.

## Features

### For Citizens
- **One-Tap Reporting** — Upload a photo, AI auto-categorizes and routes to the right department
- **Real-Time Tracking** — Monitor your report status from submission to resolution
- **AI Chatbot** — Voice-enabled assistant with 12-language translation
- **Gamification** — Earn points, badges, and climb the leaderboard
- **Community Verification** — 3-verifier threshold ensures quality reports

### For Volunteers
- **Claim Issues** — Browse and claim nearby issues to resolve
- **Task Management** — Track assigned issues through completion
- **Impact Dashboard** — See your contribution to the community

### For Government Officials
- **Live Dashboard** — Real-time view of all issues with status management
- **AI Analytics** — Gemini-powered insights and trend analysis
- **Department Routing** — Automatic assignment to Public Works, Sanitation, Electrical, etc.
- **Export Reports** — Download structured reports with AI-generated summaries
- **Heatmap View** — Visualize issue density across the city

## AI Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AI PIPELINE                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Image ──→ YOLO v8 ──→ 9 Civic Categories               │
│           │              (pothole, garbage, etc.)        │
│           │                                              │
│           ▼                                              │
│  Gemini 2.5 Flash ──→ Title, Department, Priority        │
│           │              Root Cause, Actions             │
│           │                                              │
│           ▼                                              │
│  Duplicate Detection ──→ Compares with existing          │
│           │              reports using Gemini             │
│           │                                              │
│           ▼                                              │
│  Whisper (Optional) ──→ Voice transcription              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### AI Services
| Service | Model | Purpose |
|---------|-------|---------|
| Image Detection | YOLO v8 | Detect potholes, garbage, streetlights, etc. |
| Analysis | Gemini 2.5 Flash | Generate title, department, priority, root cause |
| Duplicate Check | Gemini 2.5 Flash | Prevent duplicate reports |
| Chatbot | Gemini 2.5 Flash | Citizen assistance with context |
| Voice | Whisper (base) | Transcribe voice reports |
| Progress Summary | Gemini 2.5 Flash | Generate official reports |

## Google Technologies Used

| Technology | Usage |
|------------|-------|
| **Gemini 2.5 Flash** | Issue analysis, chatbot, duplicate detection, progress summaries, translations |
| **Firebase Authentication** | Google + email/password, role-based access |
| **Firebase Firestore** | Real-time database with subcollections |
| **Firebase Storage** | Issue photo uploads |
| **Firebase Cloud Messaging** | Push notifications |
| **Firebase Hosting** | Static frontend deployment |
| **Google Cloud Run** | Backend API deployment |
| **Google Cloud Build** | CI/CD pipeline |
| **Google Cloud Logging** | Backend observability |

## Screenshots

> Screenshots available in `docs/screenshots/`

| Page | Description |
|------|-------------|
| Landing | Hero section with platform overview |
| Auth | Google/email login with role selection |
| Dashboard | Stats, recent activity, quick actions |
| Report | Photo upload with AI analysis |
| Map | Leaflet heatmap with filters |
| Chatbot | AI assistant with voice input |
| Analytics | Charts and Gemini insights |
| Government | Official dashboard with status management |
| Volunteer | Task queue and issue management |

## Installation

### Prerequisites
- Node.js 18+
- Python 3.10+
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud SDK (for Cloud Run)

### Frontend Setup
```bash
cd vision-ai/frontend
npm install

# Copy and configure environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase and Gemini keys

npm run dev
```

### Backend Setup
```bash
cd vision-ai/backend
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your API keys

python -m app.main
```

### Firebase Setup
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Google + Email)
3. Create Firestore database
4. Enable Storage
5. Enable Cloud Messaging
6. Copy config to `.env.local`

## Deployment

### Frontend (Firebase Hosting)
```bash
cd vision-ai/frontend
npm run build
cd ..
firebase deploy --only hosting,firestore:rules
```

### Backend (Google Cloud Run)
```bash
cd vision-ai
gcloud run deploy vision-ai-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

### Docker
```bash
cd vision-ai
docker build -t vision-ai-backend .
docker run -p 8000:8000 vision-ai-backend
```

## Folder Structure

```
community-hero/
├── README.md                    # This file
├── LICENSE                      # MIT License
├── .gitignore                   # Git ignore rules
├── Dockerfile                   # Backend Docker config
├── cloudbuild.yaml              # Google Cloud Build CI/CD
├── firebase.json                # Firebase Hosting config
├── firestore.rules              # Firestore security rules
├── storage.rules                # Storage security rules
│
├── frontend/                    # Next.js 15 Frontend
│   ├── src/
│   │   ├── app/                 # Pages (17 routes)
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── auth/            # Authentication
│   │   │   └── dashboard/       # Main dashboard
│   │   │       ├── page.tsx     # Home
│   │   │       ├── report/      # Report submission
│   │   │       ├── map/         # Live map
│   │   │       ├── chat/        # AI chatbot
│   │   │       ├── analytics/   # Analytics
│   │   │       ├── government/  # Official view
│   │   │       ├── volunteer/   # Volunteer tasks
│   │   │       └── ...
│   │   ├── components/          # Reusable UI components
│   │   └── lib/                 # Firebase, API, utilities
│   ├── .env.example             # Environment template
│   └── package.json
│
├── backend/                     # FastAPI Backend
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── ai/                  # AI services
│   │   │   ├── gemini.py        # Gemini integration
│   │   │   ├── yolo.py          # YOLO detection
│   │   │   └── prompts.py       # Prompt templates
│   │   ├── routers/             # API routes
│   │   │   └── routes.py        # All endpoints
│   │   ├── schemas/             # Pydantic models
│   │   │   └── models.py        # Request/response models
│   │   ├── database/            # Firebase integration
│   │   │   └── firebase.py      # Firestore client
│   │   └── utils/               # Config and helpers
│   │       └── config.py        # Environment variables
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Environment template
│   └── Dockerfile               # Docker config
│
├── yolo-models/                 # YOLO training
│   └── train.py                 # Custom model training
│
├── docs/                        # Documentation
│   ├── architecture.md          # System architecture
│   └── screenshots/             # UI screenshots
│
└── deployment/                  # Deployment guides
    └── README.md                # Deployment instructions
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | YOLO + Gemini analysis |
| POST | `/api/chat` | AI chatbot |
| POST | `/api/voice` | Voice transcription |
| POST | `/api/summary` | Progress summary |
| GET | `/api/analytics` | Analytics data |
| GET | `/api/heatmap` | Heatmap data |
| GET | `/health` | Health check |

## YOLO Categories

The YOLO model detects 9 civic issue categories:

| ID | Category | Severity |
|----|----------|----------|
| 0 | Pothole | High |
| 1 | Garbage | Medium |
| 2 | Overflowing Bin | Medium |
| 3 | Broken Streetlight | Medium |
| 4 | Water Leakage | High |
| 5 | Fallen Tree | Critical |
| 6 | Road Crack | Medium |
| 7 | Illegal Dumping | High |
| 8 | Open Manhole | Critical |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Team

Built with ❤️ for the Google AI Hackathon
