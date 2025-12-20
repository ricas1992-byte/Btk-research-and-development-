# Cognitive Discipline Workspace (CDW)

A single-user, single-project workflow tool for disciplined cognitive work.

## Overview

CDW enforces a structured workflow from idea to execution:

1. **Parking Lot**: Capture ideas
2. **Active Phase**: Work on one promoted idea at a time
3. **Decisions**: Make and lock immutable decisions
4. **Tasks**: Execute based on locked decisions
5. **Archive**: Review completed phases with immutable snapshots

## Core Principles

- **Single Active Phase**: Only one phase can be active at a time
- **Immutability**: Locked decisions and closed phases cannot be modified
- **Plain Text**: All content is plain text (no markdown, no rich text)
- **Local First**: SQLite database, runs entirely on your machine
- **Tier-1 State Core**: State machines are primary authority, DB constraints are failsafe

## Tech Stack

- **Runtime**: Node.js 20.11.0 LTS
- **Language**: TypeScript 5.3.3
- **Database**: SQLite 3 via better-sqlite3@9.4.3
- **Frontend**: React 18.2.0 with Vite 5.1.4
- **HTTP Server**: Express 4.18.2
- **Testing**: Vitest 1.3.1
- **Package Manager**: pnpm 8.15.4

## Installation

```bash
pnpm install
```

## Usage

### Development

Start both API server and UI:

```bash
pnpm dev
```

This runs:

- API server on http://localhost:3000
- UI on http://localhost:5173

### Production Build

```bash
pnpm build
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

## Project Structure

```
├── src/
│   ├── main.ts                 # Server entry point
│   ├── config.ts               # Configuration
│   ├── types/                  # TypeScript types and errors
│   ├── core/                   # State machines and validators
│   ├── persistence/            # Database layer
│   ├── api/                    # Express routes
│   ├── operations/             # Backup, restore, export
│   └── ui/                     # React frontend
├── tests/
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── acceptance/             # Acceptance tests
├── docs/                       # Documentation
└── data/                       # Database and backups
```

## Key Workflows

### Create and Promote an Idea

1. Navigate to **Parking Lot**
2. Click **New Idea**
3. Enter title and description
4. Click **Promote to Phase** (only if no active phase exists)

### Make a Decision

1. In **Active Phase**, go to **Decisions** tab
2. Click **New Decision**
3. Fill in title, statement, and rationale
4. Click **Lock** and type "LOCK" to make it immutable

### Create Tasks

1. Lock a decision first
2. Go to **Tasks** tab
3. Click **New Task**
4. Select the locked decision
5. Enter task details

### Close a Phase

1. Click **Close Phase** button
2. Confirm by typing "CLOSE"
3. All documents are snapshotted
4. Phase becomes immutable

## State Machines

### Idea

`PARKED → PROMOTED | ABANDONED` (terminal states)

### Phase

`ACTIVE → CLOSED` (terminal state)

### Decision

`DRAFT → LOCKED` (terminal, immutable)

### Task

`PENDING → COMPLETED | VOIDED` (terminal states)

## Error Codes

- **E1xxx**: Validation errors
- **E3xxx**: State transition errors
- **E4xxx**: Immutability violations
- **E5xxx**: Confirmation/token errors

## Operations

### Backup

Creates a timestamped copy of the database with checksum verification.

### Restore

Restores database from a backup file (requires "RESTORE" confirmation).

### Export

Exports all data to JSON format for archival or analysis.

## Configuration

Environment variables (optional):

- `PORT`: API server port (default: 3000)
- `DB_PATH`: Database file path
- `BACKUP_DIR`: Backup directory
- `EXPORT_DIR`: Export directory

## Non-Goals

See [docs/NON-GOALS.md](docs/NON-GOALS.md) for features explicitly excluded from CDW.

## Testing

See [docs/qa/ACCEPTANCE-TESTS.md](docs/qa/ACCEPTANCE-TESTS.md) for acceptance criteria and [docs/qa/INVARIANTS-TEST-MATRIX.md](docs/qa/INVARIANTS-TEST-MATRIX.md) for invariant tests.

## License

MIT
