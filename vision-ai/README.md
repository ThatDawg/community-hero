# Vision AI

> AI-powered platform for citizens to report, track, and resolve community issues through collaboration, data, and intelligent automation.

## Project Structure

```
vision-ai/
├── frontend/              # Next.js 15 + TypeScript
│   ├── src/
│   │   ├── app/           # Pages and routes
│   │   │   ├── auth/      # Login/Register
│   │   │   ├── dashboard/ # Main dashboard
│   │   │   │   ├── page.tsx        # Dashboard home
│   │   │   │   ├── report/         # Report submission
│   │   │   │   ├── map/            # Live issue map
│   │   │   │   ├── chat/           # AI chatbot
│   │   │   │   ├── analytics/      # Analytics dashboard
│   │   │   │   ├── my-reports/     # User's reports
│   │   │   │   ├── notifications/  # Notifications
│   │   │   │   └── leaderboard/    # Gamification
│   │   ├── components/    # Reusable components
│   │   └── lib/           # Utilities and services
├── backend/               # FastAPI backend
│   ├── main.py           # API entry point
│   ├── models/           # Pydantic schemas
│   ├── services/         # YOLO + Gemini services
│   └── utils/            # Config and Firebase
└── yolo-models/          # YOLO model files
```

## Setup Instructions

### Frontend
```bash
cd frontend
npm install
# Create .env.local with your Firebase config
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
# Create .env with your API keys
python main.py
```

## Tech Stack
- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS, Shadcn UI, Framer Motion
- **Backend:** FastAPI (Python)
- **AI:** Gemini 2.5 Flash, YOLO
- **Database:** Firebase Firestore
- **Auth:** Firebase Authentication (Google + Email)
- **Storage:** Firebase Storage
- **Maps:** Leaflet + OpenStreetMap
- **Notifications:** Firebase Cloud Messaging

## Google Technologies Used
- Gemini API (issue categorization, chatbot, analysis)
- Firebase Authentication
- Firebase Firestore
- Firebase Storage
- Firebase Cloud Messaging
- Google Cloud Run
