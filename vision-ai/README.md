# CivicPulse AI - Vision AI Platform

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
│   └── .env.local         # Environment variables
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
cp .env.local.example .env.local  # Add your Firebase config
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Add your API keys
python main.py
```

### Environment Variables

**Frontend (.env.local)**
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000

**Backend (.env)**
- GOOGLE_API_KEY (from Google AI Studio)
- FIREBASE_CREDENTIALS_PATH
- FIREBASE_STORAGE_BUCKET
- YOLO_MODEL_PATH

## AI Stack
- **YOLO**: Image detection for potholes, garbage, etc.
- **Gemini 2.5 Flash**: Issue analysis, categorization, chatbot
- **Firebase**: Auth, Firestore, Storage, Cloud Messaging

## Google Technologies Used
- Gemini API
- Firebase Authentication
- Firebase Firestore
- Firebase Storage
- Firebase Cloud Messaging
- Google Cloud Run (deployment)
