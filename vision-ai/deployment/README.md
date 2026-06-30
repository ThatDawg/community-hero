# Deployment Guide

Hackathon setup:
- Frontend: Firebase Hosting
- Backend: free Python web service such as Render
- AI key: backend only, never exposed as `NEXT_PUBLIC_*`

## Backend (Free Render Service)

1. Push this repo to GitHub.
2. In Render, create a new **Blueprint** from the repo.
3. Render will read `render.yaml` and create `vision-ai-backend`.
4. Add environment variables in Render:
   - `GOOGLE_API_KEY` - Gemini API key
   - `FIREBASE_CREDENTIALS_JSON` - optional Firebase service account JSON
   - `FIREBASE_STORAGE_BUCKET` - optional Firebase Storage bucket

The free backend uses:

```bash
pip install -r backend/requirements-free.txt
cd backend
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

After deploy, test:

```bash
curl https://your-service.onrender.com/health
```

## Frontend (Firebase Hosting)

Firebase Hosting serves the static Next.js export from `frontend/out`. The root `firebase.json` includes a Hosting `predeploy` hook, so this deploy command rebuilds the frontend automatically before upload.

Create `frontend/.env.local` first:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=community-hero-500915.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=community-hero-500915
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=community-hero-500915.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_BACKEND_URL=https://your-service.onrender.com
```

Then deploy:

```bash
cd vision-ai
npm --prefix frontend ci
firebase deploy --only hosting --project community-hero-500915
```

On Windows PowerShell:

```powershell
cd vision-ai
npm.cmd --prefix frontend ci
firebase deploy --only hosting --project community-hero-500915
```

## Environment Variables

### Frontend

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_BACKEND_URL`

### Backend

- `GOOGLE_API_KEY`
- `FIREBASE_CREDENTIALS_JSON` or `FIREBASE_CREDENTIALS_PATH`
- `FIREBASE_STORAGE_BUCKET`

## Notes

- Do not put Gemini keys in frontend variables.
- `backend/requirements-free.txt` skips heavyweight optional AI packages so the backend can boot on free hosting.
- If you later want full local YOLO detection, use `backend/requirements.txt` locally.
