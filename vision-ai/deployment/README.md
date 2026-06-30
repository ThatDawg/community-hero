# Deployment Guide

## Frontend (Firebase Hosting)

```bash
cd vision-ai/frontend
npm run build
cd ..
firebase deploy --only hosting
```

## Backend (Google Cloud Run)

```bash
cd vision-ai
gcloud run deploy vision-ai-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_API_KEY=your_key
```

## Environment Variables

### Frontend (.env.local)
- `NEXT_PUBLIC_FIREBASE_*` - Firebase config
- `NEXT_PUBLIC_GEMINI_API_KEY` - Gemini API key
- `NEXT_PUBLIC_FASTAPI_URL` - Backend URL

### Backend (.env)
- `GOOGLE_API_KEY` - Gemini API key
- `FIREBASE_CREDENTIALS_PATH` - Service account path
- `FIREBASE_STORAGE_BUCKET` - Storage bucket

## Cloud Build (CI/CD)

```bash
# Triggered on push to main
gcloud builds submit --config cloudbuild.yaml
```
