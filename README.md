# Joyverse Frontend

Vite + React + TypeScript frontend for therapist and child experiences.

## Prerequisites
- Node 18+
- Backend running at `http://localhost:5000`

## Setup
```bash
cd frontend
npm install
```

Start the dev server:
```bash
npm run dev
```
The app runs at the URL shown by Vite (typically `http://localhost:5173`).

## Env
No `.env` required for local; API base is hardcoded to `http://localhost:5000` in fetch calls.

## Key Routes
- `/` – Home
- `/therapist-login` – Therapist login
- `/child-login` – Child login (creates session)
- `/landing` – Child landing showing selected game
- `/game/:theme/:level` – Picture puzzle game
- `/typing-game` – Typing game (local dictionary + analysis)
- `/reading-exercise` – Reading and audio recording
- `/therapist-dashboard` – Manage children, assign games, view analytics
- `/theme-assignment` – Assign themes for puzzles
- `/all-sessions-emotions` – Aggregate emotions view

## Typing Game
- 10-word session, words focus on letters b/d/p/e/i/l
- Gets next word via backend endpoints
- Saves results on completion; therapist dashboard displays analysis

## Reading
- Fetch stories from backend
- Records audio and uploads to backend for storage

## Scripts
- `npm run dev` – run locally
- `npm run build` – production build
- `npm run preview` – preview built app
