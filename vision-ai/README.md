# Vision AI

> AI-powered platform for citizens to report, track, and resolve community issues through collaboration, data, and intelligent automation.

## Problem Statement

Civic issues like potholes, garbage accumulation, broken streetlights, and water leakage often go unreported or take weeks to resolve. Citizens lack a simple way to report problems, and government departments lack real-time visibility into issue distribution and resolution progress.

**Vision AI** solves this by combining AI-powered image analysis, community verification, and real-time dashboards to streamline the entire civic issue lifecycle.

## Features

### Citizen Features
- **One-Tap Reporting** — Upload photo, AI auto-categorizes with YOLO, Gemini analyzes root cause + department
- **Real-Time Tracking** — Monitor report status from submission to resolution
- **AI Chatbot** — Voice-enabled assistant with 12-language translation
- **Gamification** — Earn points, badges, and climb the leaderboard
- **Community Verification** — 3-verifier threshold ensures quality reports
- **Nearby Issues** — Discover issues within 1-25km radius

### Volunteer Features
- **Claim Issues** — Browse and claim nearby issues to resolve
- **Task Management** — Track assigned issues through completion
- **Impact Dashboard** — See your contribution to the community

### Government/Official Features
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
│           ▼                                              │
│  Gemini 2.5 Flash ──→ Title, Department, Priority        │
│           │              Root Cause, Actions             │
│           ▼                                              │
│  Duplicate Detection ──→ Prevents duplicate reports      │
│           │                                              │
│  Severity Prediction ──→ Critical/High/Medium/Low       │
│           │                                              │
│  Department Classification ──→ Auto-routes to dept       │
│           │                                              │
│  Report Generation ──→ AI summaries for officials        │
│           │                                              │
│  Resolution Prediction ──→ Timeline estimation           │
│                                                          │
│  Browser Speech ──→ Voice input without backend cost      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### AI Services

| Module | Purpose |
|--------|---------|
| `yolo.py` | Image detection for 9 civic categories |
| `gemini.py` | Core Gemini integration for analysis |
| `duplicate_detection.py` | Prevent duplicate reports |
| `severity.py` | Predict issue severity |
| `department_classifier.py` | Auto-route to departments |
| `report_generator.py` | AI summaries for officials |
| `prediction.py` | Resolution time estimation |
| `prompts.py` | Centralized prompt templates |

## Google Technologies Used

| Technology | Usage |
|------------|-------|
| **Gemini 2.5 Flash** | Issue analysis, chatbot, duplicate detection, progress summaries, translations |
| **Firebase Authentication** | Google + email/password, role-based access |
| **Firebase Firestore** | Real-time database with subcollections |
| **Firebase Storage** | Issue photo uploads |
| **Firebase Cloud Messaging** | Push notifications |
| **Firebase Hosting** | Static frontend deployment |
| **Render free web service** | Backend API deployment |

## Screenshots

| Page | Description |
|------|-------------|
| ![Landing](docs/screenshots/landing.png) | Hero section with platform overview |
| ![Auth](docs/screenshots/auth.png) | Google/email login with role selection |
| ![Dashboard](docs/screenshots/dashboard.png) | Stats, recent activity, quick actions |
| ![Report](docs/screenshots/report.png) | Photo upload with AI analysis |
| ![Map](docs/screenshots/map.png) | Leaflet heatmap with filters |
| ![Chatbot](docs/screenshots/chatbot.png) | AI assistant with browser speech input |
| ![Analytics](docs/screenshots/analytics.png) | Charts and Gemini insights |
| ![Government](docs/screenshots/government.png) | Official dashboard with status management |
| ![Volunteer](docs/screenshots/volunteer.png) | Task queue and issue management |

> Screenshots stored in `docs/screenshots/`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS, Shadcn UI, Framer Motion |
| Backend | FastAPI (Python), YOLO v8, Gemini 2.5 Flash |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Storage | Firebase Storage |
| Maps | Leaflet + OpenStreetMap |
| Notifications | Firebase Cloud Messaging |
| Voice | Web Speech API |
| Hosting | Firebase Hosting |
| Backend Deploy | Render free web service |

## Installation

### Prerequisites
- Node.js 18+
- Python 3.10+
- Firebase CLI (`npm install -g firebase-tools`)

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your Firebase config and backend URL
npm run dev
```

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
python -m app.main
```

### Docker Setup
```bash
docker-compose up
```

## Deployment

### Frontend (Firebase Hosting)
```bash
firebase login
firebase deploy --only hosting,firestore:rules
```

### Backend (Free Render Service)
```bash
pip install -r backend/requirements-free.txt
cd backend
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## AI Workflow

```
1. Citizen uploads photo + description
         │
         ▼
2. YOLO detects objects (pothole, garbage, etc.)
         │
         ▼
3. Gemini analyzes: title, department, priority, root cause
         │
         ▼
4. Duplicate detection checks existing reports
         │
         ▼
5. Severity prediction determines urgency
         │
         ▼
6. Department classifier routes to responsible team
         │
         ▼
7. Report saved to Firestore
         │
         ▼
8. FCM notifications sent to nearby volunteers/officials
         │
         ▼
9. Community verification (3 verifiers needed)
         │
         ▼
10. Government dashboard shows real-time status
```

## Folder Structure

```
community-hero/
├── README.md                    # This file
├── LICENSE                      # MIT License
├── .gitignore                   # Git ignore rules
├── .env.example                 # Root environment template
├── Dockerfile                   # Backend Docker config
├── docker-compose.yml           # Local development
├── render.yaml                  # Free Render backend config
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
│   │   ├── components/          # Reusable UI components
│   │   └── lib/                 # Firebase, API, utilities
│   ├── .env.example             # Frontend env template
│   └── package.json
│
├── backend/                     # FastAPI Backend
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── ai/                  # AI services
│   │   │   ├── gemini.py        # Gemini integration
│   │   │   ├── yolo.py          # YOLO detection
│   │   │   ├── prompts.py       # Prompt templates
│   │   │   ├── duplicate_detection.py
│   │   │   ├── severity.py
│   │   │   ├── department_classifier.py
│   │   │   ├── report_generator.py
│   │   │   └── prediction.py
│   │   ├── routers/             # API routes
│   │   ├── schemas/             # Pydantic models
│   │   ├── services/            # Business logic
│   │   │   ├── report_service.py
│   │   │   ├── notification_service.py
│   │   │   └── verification_service.py
│   │   ├── middleware/          # Auth, rate limiting, logging
│   │   ├── database/            # Firebase integration
│   │   └── utils/               # Config and helpers
│   ├── tests/                   # Unit tests
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
│
├── docs/                        # Documentation
│   ├── architecture.md
│   └── screenshots/             # UI screenshots
│
├── deployment/                  # Deployment configs
│   ├── firebase.json
│   ├── firestore.rules
│   └── README.md
│
└── yolo-models/                 # YOLO training
    └── train.py
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | YOLO + Gemini analysis |
| POST | `/api/chat` | AI chatbot |
| POST | `/api/summary` | Progress summary |
| GET | `/api/analytics` | Analytics data |
| GET | `/api/heatmap` | Heatmap data |
| GET | `/health` | Health check |

## YOLO Categories

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

- [Team Member 1] - Frontend Development
- [Team Member 2] - Backend Development
- [Team Member 3] - AI/ML Engineering
- [Team Member 4] - UI/UX Design
