# Beyond the Keys Institute - Research Application

Single-user research writing application for Beyond the Keys Institute.

## Overview

A React-based web application for research work, consisting of:

- **Login Screen** — Authentication entry point
- **Research Work Screen** — Primary workspace for reading sources, taking notes, and drafting
- **Administration Screen** — Exception handling interface for system issues

## Technology Stack

### Frontend
- React 18
- TypeScript
- Vite (build tool)
- React Router (routing)
- CSS (vanilla, no framework)

### Backend
- Netlify Functions (serverless)
- TypeScript
- Turso (libSQL) database

### Optional
- Claude AI integration (feature-flagged via `CLAUDE_API_KEY`)

## Project Structure

```
research-app/
├── netlify/
│   └── functions/           # Serverless API functions
├── src/
│   ├── components/          # React components
│   ├── screens/             # Top-level screen components
│   ├── state/               # State management
│   ├── api/                 # API client
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions
│   └── styles/              # CSS styles
├── db/
│   ├── schema.sql           # Database schema
│   └── seed.sql             # Seed data
├── shared/
│   ├── types.ts             # Shared TypeScript types
│   └── config.ts            # Configuration constants
├── public/                  # Static assets
└── docs/                    # Documentation
```

## Environment Variables

Required:
- `INITIAL_USER_PASSWORD` — Password for admin@beyondthekeys.ai
- `SESSION_SECRET` — JWT signing key (min 32 chars)
- `TURSO_DATABASE_URL` — Turso database connection URL
- `TURSO_AUTH_TOKEN` — Turso authentication token

Optional:
- `CLAUDE_API_KEY` — Enables Claude AI integration when present

## Setup

### 1. Install Dependencies

```bash
cd research-app
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

### 3. Setup Database

Create a Turso database and apply the schema:

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create database
turso db create btk-research

# Get connection details
turso db show btk-research

# Apply schema
turso db shell btk-research < db/schema.sql

# Apply seed data (after updating password hash)
turso db shell btk-research < db/seed.sql
```

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at http://localhost:5173

## Deployment

This application is designed to deploy on Netlify:

1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy

Build settings (from `netlify.toml`):
- **Base directory:** `research-app`
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Functions directory:** `netlify/functions`

## Design Principles

This application adheres to strict design constraints:

- **Single user only** — Exactly one user (admin@beyondthekeys.ai)
- **Single document only** — One document per user
- **No source ingestion** — Sources are seed-only (Add Source button is non-functional)
- **No animations** — All UI transitions are instant
- **Inline errors only** — No modal dialogs for errors
- **Gold accent only** — Gold color used exclusively for focus/active states
- **Auto-save** — Document saves every 30 seconds automatically
- **Graceful degradation** — Works without Claude AI when API key not configured

## Development Status

This is Version 1.0, built according to the BTK Institute Build Plan v1.1.

## License

Proprietary - Beyond the Keys Institute
