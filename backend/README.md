# Joyverse Backend

Node.js + Express + MongoDB backend powering authentication, therapist/child flows, games data, and analysis.

## Prerequisites
- Node 18+
- MongoDB running locally (defaults to `mongodb://localhost:27017/joyverse`)

## Setup
```bash
cd backend
npm install
```

Create a `.env` (optional) to override defaults:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/joyverse
```

Start the server:
```bash
npm start
```
Server runs at `http://localhost:5000`.

## Tech
- Express, Mongoose
- Local analysis for Typing game (no external AI)
- File size-friendly body parsing (audio uploads)

## Key Collections (Mongoose)
- `Therapist` with nested `children[]` and `children[].sessions[]`
- `Invitation`, `Feedback`, `FAQ`, `WordList`, `Story`

## Major Endpoints

Health
- GET `/api/test`

Auth
- POST `/api/signup` – Therapist signup (requires invitation code)
- POST `/api/login` – Therapist/Child login (child creates a new session)
- POST `/api/child-login` – Alternate child login + session creation
- POST `/api/change-password`

Therapist & Children
- POST `/api/add-child`
- POST `/api/delete-child`
- POST `/api/get-therapist`

Preferences
- POST `/api/set-preferred-game` – Set child preferred game
- POST `/api/set-preferred-story` – Select reading story for child
- GET `/api/get-child-preference` – Get preferredGame + preferredStory

Themes & Sessions
- GET `/api/get-child-themes`
- POST `/api/update-child-themes`
- POST `/api/track-theme-change`
- POST `/api/track-emotion`
- POST `/api/update-played-puzzles`
- GET `/api/get-session-data`
- GET `/api/get-child-sessions`

Stories & WordLists
- GET `/api/stories`
- GET `/api/stories/:id`
- GET `/api/wordlists`

Feedback & FAQ
- POST `/api/submit-feedback`
- GET `/api/get-feedback` (admin)
- POST `/api/add-faq`
- GET `/api/get-faqs`

Invitations (Admin demo)
- POST `/api/create-invitation`
- GET `/api/invitations`

Super Admin (demo)
- POST `/api/superadmin/login`
- POST `/api/superadmin/register-therapist`
- GET `/api/superadmin/therapists`
- DELETE `/api/superadmin/delete-therapist/:id`

## Typing Game (Local Dictionary + Analysis)
Endpoints:
- POST `/api/typing/generate-initial-word` – returns a 3–5 letter word focused on b/d/p/e/i/l
- POST `/api/typing/generate-next-word` – adaptive selection based on past mistakes
- POST `/api/save-typing-results` – saves `{ word, input, correct }[]` and computes analysis
- POST `/api/typing/analyze-session` – on-demand analysis for a session
- GET `/api/typing/child-analysis` – aggregated stats and per-session analyses

Analysis fields stored in `session.typingAnalysis`:
- problematicLetters: letters most often mismatched (from original vs typed)
- strengths: letters typed correctly at least as often as mismatched
- confusionPatterns, overallAccuracy, severity, totalWords, correctWords, analyzedAt

Implementation notes:
- Analysis is computed during save so dashboards show data immediately.
- `GET /api/typing/child-analysis` also computes missing session analyses on the fly.

## Reading Game
- POST `/api/save-reading-audio` – stores base64 audio inside the session with story metadata
- GET `/api/get-reading-recordings` – returns sessions containing reading recordings (with inline audio data)

## Emotions (Facemesh backend integration)
- POST `/api/facemesh-landmarks` – forwards to local model service and tracks dominant emotion per puzzle
- GET `/api/emotion` – dominant emotion for the current puzzle window

## Scripts
- `npm start` – start server
