# ACCEPTANCE TESTS

This document defines the acceptance criteria for CDW. All tests must pass for a release.

## Master Assertions (MA)

### MA-01: Single Active Phase Constraint

**Given**: A user has created and promoted an idea to an active phase
**When**: The user attempts to promote another idea
**Then**: The system rejects the operation with error E3001
**And**: The database constraint prevents multiple active phases as failsafe

**Test Coverage**:

- Unit: `tests/unit/invariants.test.ts` - MA-01
- Integration: `tests/integration/misuse.test.ts` - prevents creating second active phase
- Acceptance: `tests/acceptance/workflows.test.ts` - MA-01

### MA-02: Locked Decision Immutability

**Given**: A decision has been locked
**When**: The user attempts to edit the decision
**Then**: The system rejects the operation with error E4000
**And**: The content hash remains unchanged

**Test Coverage**:

- Unit: `tests/unit/invariants.test.ts` - MA-02
- Integration: `tests/integration/misuse.test.ts` - prevents editing locked decision
- Acceptance: `tests/acceptance/workflows.test.ts` - MA-02

### MA-03: Task Creation from Locked Decisions Only

**Given**: A decision is in DRAFT status
**When**: The user attempts to create a task
**Then**: The system rejects the operation with error E3005
**And**: Tasks can only be created after locking the decision

**Test Coverage**:

- Unit: `tests/unit/invariants.test.ts` - ensures decision is locked
- Integration: `tests/integration/misuse.test.ts` - prevents creating task from draft
- Acceptance: `tests/acceptance/workflows.test.ts` - MA-03

### MA-04: Phase Close Creates Snapshots

**Given**: A phase has documents
**When**: The user closes the phase
**Then**: The system creates immutable snapshots of all documents
**And**: Each snapshot has a verified content hash

**Test Coverage**:

- Unit: `tests/unit/hash-utils.test.ts` - snapshot hash verification
- Acceptance: `tests/acceptance/workflows.test.ts` - MA-04

### MA-05: Closed Phase Immutability

**Given**: A phase has been closed
**When**: The user attempts to create documents, decisions, or modify the phase
**Then**: The system rejects all operations with error E4001
**And**: Snapshots remain immutable

**Test Coverage**:

- Unit: `tests/unit/invariants.test.ts` - MA-04 (ensures phase not closed)
- Integration: `tests/integration/misuse.test.ts` - prevents modifying closed phase
- Acceptance: `tests/acceptance/workflows.test.ts` - MA-05

## Functional Tests (FT)

### FT-01: Complete Workflow (Idea → Phase → Close)

**Scenario**: User completes a full workflow from idea to closed phase

**Steps**:

1. Create idea in parking lot
2. Promote idea to active phase
3. Create document in phase
4. Create and lock decision
5. Create task from locked decision
6. Complete task
7. Close phase with snapshots

**Expected**: All state transitions succeed, snapshots created, phase closed

**Test Coverage**: `tests/acceptance/workflows.test.ts` - FT-01

### FT-02: Two-Step Phase Close

**Scenario**: User closes a phase with token confirmation

**Steps**:

1. Request close token
2. Use token to close phase with "CLOSE" confirmation
3. Attempt to reuse token

**Expected**: First close succeeds, token reuse fails with E5005

**Test Coverage**: `tests/acceptance/workflows.test.ts` - FT-02

### FT-03: Hash Verification

**Scenario**: System computes and verifies content hashes

**Steps**:

1. Lock a decision
2. Create document snapshot

**Expected**:

- Decision hash format: `v1:[sha256]`
- Snapshot hash format: `v1:[sha256]`
- Hashes verify correctly
- Line endings normalized

**Test Coverage**:

- Unit: `tests/unit/hash-utils.test.ts`
- Acceptance: `tests/acceptance/workflows.test.ts` - FT-03

## API Contract Tests

### Project Endpoints

- `GET /api/project` returns singleton project
- `PATCH /api/project` updates project name

### Ideas Endpoints

- `POST /api/ideas` creates parked idea
- `GET /api/ideas?status=PARKED` filters by status
- `POST /api/ideas/:id/promote` promotes to phase (only if no active phase)
- `POST /api/ideas/:id/abandon` marks as abandoned

### Phases Endpoints

- `GET /api/phases/active` returns active phase or 404
- `GET /api/phases/closed` returns list of closed phases
- `POST /api/phases/:id/close/token` generates close token
- `POST /api/phases/:id/close` closes phase with token + "CLOSE" confirmation
- `GET /api/phases/:id/snapshots` returns phase snapshots

### Documents Endpoints

- `POST /api/documents` creates document (active phase only)
- `PATCH /api/documents/:id` updates document (active phase only)
- `DELETE /api/documents/:id` deletes document (active phase only)

### Decisions Endpoints

- `POST /api/decisions` creates draft decision
- `PATCH /api/decisions/:id` updates draft decision only
- `POST /api/decisions/:id/lock` locks with "LOCK" confirmation
- `DELETE /api/decisions/:id` deletes draft decision only

### Tasks Endpoints

- `POST /api/tasks` creates task (locked decision only)
- `POST /api/tasks/:id/complete` marks as completed
- `POST /api/tasks/:id/void` marks as voided

### Operations Endpoints

- `POST /api/ops/backup` creates backup with checksum
- `GET /api/ops/backups` lists available backups
- `POST /api/ops/restore` restores with "RESTORE" confirmation
- `POST /api/ops/export` exports to JSON
- `GET /api/ops/audit-log` returns audit log entries

**Test Coverage**: `tests/integration/api.test.ts`

## State Machine Tests

All state transitions must be validated:

### Idea States

- ✓ PARKED → PROMOTED
- ✓ PARKED → ABANDONED
- ✗ PROMOTED → ABANDONED
- ✗ ABANDONED → PROMOTED

### Phase States

- ✓ ACTIVE → CLOSED
- ✗ CLOSED → ACTIVE

### Decision States

- ✓ DRAFT → LOCKED
- ✗ LOCKED → DRAFT

### Task States

- ✓ PENDING → COMPLETED
- ✓ PENDING → VOIDED
- ✗ COMPLETED → VOIDED
- ✗ VOIDED → COMPLETED

**Test Coverage**: `tests/unit/state-machines.test.ts`

## Definition of Done

For a release to be accepted:

- [ ] All MA-xx tests pass
- [ ] All FT-xx tests pass
- [ ] All state machine tests pass
- [ ] All API contract tests pass
- [ ] All hash verification tests pass
- [ ] pnpm typecheck passes
- [ ] pnpm lint passes
- [ ] pnpm test passes (no failures)
- [ ] Manual UI testing completed
- [ ] Full workflow executable in browser
