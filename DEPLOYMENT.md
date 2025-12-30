# BTK Institute v5.2 — Full System Deployment Guide

## Overview

BTK Institute v5.2 is a full-stack research and writing application with:
- **Frontend**: React 18 + TypeScript + Vite (research-app/)
- **Backend**: Express + TypeScript (server/)
- **Database**: SQLite with better-sqlite3 (data/btk.db)
- **Authentication**: Server-side sessions with HTTP-only cookies
- **NO AI Integration** (AI buttons are UI placeholders only)

## System Requirements

- Node.js 20.11.0+ (required)
- pnpm 8.15.4+ (package manager)
- Python 3.x + build tools (for native SQLite bindings)

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build SQLite Native Bindings

```bash
npx node-gyp rebuild --directory=node_modules/.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3
```

### 3. Start Development Server

```bash
# Start both backend and frontend (concurrently)
npm run dev

# Or start separately:
npm run server  # Backend on port 3000
npm run client  # Frontend on port 5173
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/api/health

### 5. Default Login Credentials

```
Email: admin@beyondthekeys.ai
Password: admin123
```

## Project Structure

```
.
├── research-app/           # Frontend (Vite + React)
│   ├── src/
│   │   ├── screens/       # Login, Research, Admin screens
│   │   ├── components/    # Reusable UI components
│   │   ├── api/           # API client
│   │   ├── hooks/         # React hooks
│   │   ├── styles/        # CSS tokens and styles
│   │   └── utils/         # Utilities
│   └── shared/            # Shared types with backend
│
├── server/                # Backend (Express + SQLite)
│   ├── db/                # Database schema, seed data
│   ├── routes/            # API routes
│   └── middleware/        # Auth middleware
│
├── data/                  # SQLite database (auto-created)
│   └── btk.db
│
└── dist/                  # Production build output
```

## Database

The database is **auto-initialized** on server startup with:
- Schema creation (users, sessions, documents, sources, notes, etc.)
- Seed data (1 user, 1 document, 3 sources, 5 notes, 2 exceptions, 5 status records)

**Database Location**: `./data/btk.db`

### Reset Database

```bash
rm -f data/btk.db
npm run server  # Will auto-recreate with seed data
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (sets HTTP-only cookie)
- `POST /api/auth/logout` - Logout (clears session)
- `GET /api/auth/me` - Get current user

### Document
- `GET /api/document` - Get user's document
- `PUT /api/document` - Update title/content

### Sources
- `GET /api/sources` - List all sources
- `GET /api/sources/:id` - Get source details

### Annotations
- `GET /api/sources/:sourceId/annotations` - Get annotations for source
- `POST /api/sources/:sourceId/annotations` - Create annotation
- `DELETE /api/annotations/:id` - Delete annotation

### Notes
- `GET /api/notes` - List all notes
- `POST /api/notes` - Create note (max 300 chars)
- `PUT /api/notes/:id` - Update note (if not locked)
- `DELETE /api/notes/:id` - Delete note (if not locked)

### Writing Phase
- `GET /api/writing-phase` - Get current phase
- `POST /api/writing-phase/ready-to-write` - Transition NOTES → DRAFTING (locks all notes)

### Admin
- `GET /api/admin/exceptions` - List exceptions
- `POST /api/admin/exceptions/:id/dismiss` - Dismiss exception
- `GET /api/admin/status` - Get system status

## Production Build

```bash
# Build both backend and frontend
npm run build

# Output:
# - Backend: server/ (TypeScript compiled)
# - Frontend: dist/ (Vite production build)
```

### Deploy Production Build

```bash
# Set environment variables
export NODE_ENV=production
export PORT=3000
export FRONTEND_URL=https://yourdomain.com

# Start server (serves both API and static frontend)
node server/index.js
```

## Key Features & Constraints

### Hard Constraints (Enforced)
1. **Single Document**: Exactly 1 document per user (no picker/switching)
2. **Research Screen is PRIMARY**: Always navigate to `/` after login
3. **Notes Rules**:
   - ≤ 300 characters (hard limit)
   - Point-based only (no paragraphs)
   - Quotes: max 2 sentences
   - Thoughts: max 1 sentence
   - Validation prevents save if invalid
4. **Writing Phase Transition**:
   - NOTES → DRAFTING (one-way, irreversible)
   - Locks all notes (read-only, non-deletable)
5. **Session Timer**: In-memory only (resets on refresh, increments every minute)
6. **Admin Screen**: Text-only (no cards, badges, charts)

### Navigation Flow
- Login success → ALWAYS navigate to `/` (Research screen)
- `/admin` accessed ONLY from Research header icon
- `/admin` always returns to `/`
- No other routes exist

### Gold Usage
- Gold color (#D4AF37) used ONLY for focus/active states
- NOT for decorative purposes

## Environment Variables

```bash
# Optional (defaults shown)
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## Troubleshooting

### "Could not locate the bindings file"

**Problem**: SQLite native bindings not built

**Solution**:
```bash
npx node-gyp rebuild --directory=node_modules/.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3
```

### Port Already in Use

**Problem**: Port 3000 or 5173 is already in use

**Solution**:
```bash
# Change port in package.json or kill existing process
kill -9 $(lsof -ti:3000)
```

### Database Locked Error

**Problem**: Multiple server instances accessing the same database

**Solution**:
```bash
# Stop all server instances
pkill -f "tsx watch server"
# Remove lock file
rm -f data/btk.db-shm data/btk.db-wal
```

## Testing

```bash
# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

## Architecture Notes

### Authentication
- Server-side sessions stored in SQLite
- HTTP-only cookies (secure in production)
- Session token validated on each protected route
- 24-hour expiry

### Session Timer
- **In-memory only** (not persisted)
- Resets on page refresh
- Increments every minute
- 90-minute warning reminder

### Source Content
- **Immutable** after creation
- Annotation offsets remain stable
- Ingestion handled outside application (pre-seeded)

### AI Status (v5.2)
- **EXCLUDED**: No Claude, Perplexity, or AI SDK integration
- AI buttons show: "AI processing would happen here"
- **No network calls** to AI services

## Support

For issues or questions, refer to project documentation or contact the development team.

---

**BTK Institute v5.2** — Research & Writing System (No AI Integration)
