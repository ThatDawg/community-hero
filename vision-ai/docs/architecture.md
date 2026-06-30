# Vision AI - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        VISION AI ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   CITIZEN    │     │  VOLUNTEER   │     │  OFFICIAL    │    │
│  │   Dashboard  │     │  Dashboard   │     │  Dashboard   │    │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘    │
│         │                     │                     │             │
│         └─────────────────────┼─────────────────────┘             │
│                               │                                   │
│                    ┌──────────▼──────────┐                       │
│                    │    NEXT.JS FRONTEND  │                       │
│                    │    (Firebase Auth)   │                       │
│                    └──────────┬──────────┘                       │
│                               │                                   │
│              ┌────────────────┼────────────────┐                 │
│              │                │                │                  │
│    ┌─────────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐         │
│    │  Firebase      │ │  FastAPI    │ │  Firebase   │         │
│    │  Firestore     │ │  Backend    │ │  Storage    │         │
│    └────────────────┘ └──────┬──────┘ └─────────────┘         │
│                               │                                   │
│                    ┌──────────▼──────────┐                       │
│                    │     AI SERVICES     │                       │
│                    ├─────────────────────┤                       │
│                    │  • YOLO Detection   │                       │
│                    │  • Gemini Analysis  │                       │
│                    │  • Duplicate Check  │                       │
│                    │  • Whisper Voice    │                       │
│                    └─────────────────────┘                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **Report Submission**: Citizen uploads photo + description
2. **YOLO Detection**: Image analyzed for civic issues (pothole, garbage, etc.)
3. **Gemini Analysis**: AI generates title, department, priority, root cause
4. **Duplicate Check**: Compares against existing reports
5. **Firestore Storage**: Report saved with all metadata
6. **Notification**: FCM push to nearby volunteers/officials
7. **Community Verification**: 3 verifiers needed before government action
8. **Resolution**: Volunteer/official resolves, status updated

## AI Pipeline

```
Image ──→ YOLO ──→ Detections ──┐
                                 ├──→ Gemini ──→ Structured Analysis
Text ────────────────────────────┘
                                 ├──→ Duplicate Detection
Existing Reports ────────────────┘
```
