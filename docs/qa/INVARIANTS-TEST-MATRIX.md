# INVARIANTS TEST MATRIX

This document maps all system invariants to their test coverage.

## Core Invariants

| ID   | Invariant                           | Enforced By                               | Failsafe                                            | Test Coverage                                                                                                   |
| ---- | ----------------------------------- | ----------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| I-01 | At most one ACTIVE phase exists     | InvariantChecker.ensureNoActivePhase()    | UNIQUE INDEX on phase(status) WHERE status='ACTIVE' | tests/unit/invariants.test.ts<br>tests/integration/misuse.test.ts<br>tests/acceptance/workflows.test.ts (MA-01) |
| I-02 | LOCKED decisions are immutable      | InvariantChecker.ensureDecisionIsDraft()  | Application logic only                              | tests/unit/invariants.test.ts<br>tests/integration/misuse.test.ts<br>tests/acceptance/workflows.test.ts (MA-02) |
| I-03 | Tasks only from LOCKED decisions    | InvariantChecker.ensureDecisionIsLocked() | Application logic only                              | tests/unit/invariants.test.ts<br>tests/integration/misuse.test.ts<br>tests/acceptance/workflows.test.ts (MA-03) |
| I-04 | CLOSED phases are immutable         | InvariantChecker.ensurePhaseNotClosed()   | Application logic only                              | tests/unit/invariants.test.ts<br>tests/integration/misuse.test.ts<br>tests/acceptance/workflows.test.ts (MA-05) |
| I-05 | Phase must be ACTIVE for documents  | InvariantChecker.ensurePhaseIsActive()    | Application logic only                              | tests/unit/invariants.test.ts<br>tests/integration/misuse.test.ts                                               |
| I-06 | Tasks must be PENDING to transition | InvariantChecker.ensureTaskIsPending()    | Application logic only                              | tests/unit/invariants.test.ts                                                                                   |
| I-07 | Decision content hash on LOCK       | Gateway.lockDecision()                    | Application logic only                              | tests/unit/hash-utils.test.ts<br>tests/acceptance/workflows.test.ts (FT-03)                                     |
| I-08 | Snapshot content hash on create     | Gateway.createSnapshot()                  | Application logic only                              | tests/unit/hash-utils.test.ts<br>tests/acceptance/workflows.test.ts (MA-04, FT-03)                              |
| I-09 | Confirmation tokens single-use      | Gateway.markTokenAsUsed()                 | UNIQUE INDEX on used_token(token)                   | tests/acceptance/workflows.test.ts (FT-02)                                                                      |

## State Machine Invariants

| Entity   | Valid Transitions                       | Test Coverage                     |
| -------- | --------------------------------------- | --------------------------------- |
| Idea     | PARKED → PROMOTED<br>PARKED → ABANDONED | tests/unit/state-machines.test.ts |
| Phase    | ACTIVE → CLOSED                         | tests/unit/state-machines.test.ts |
| Decision | DRAFT → LOCKED                          | tests/unit/state-machines.test.ts |
| Task     | PENDING → COMPLETED<br>PENDING → VOIDED | tests/unit/state-machines.test.ts |

## Database Constraints (Failsafe Layer)

| Table      | Constraint                                   | Type        | Purpose                      |
| ---------- | -------------------------------------------- | ----------- | ---------------------------- |
| project    | id = 'singleton'                             | CHECK       | Enforce single project       |
| project    | length(name) BETWEEN 1 AND 200               | CHECK       | Name validation              |
| idea       | length(title) BETWEEN 1 AND 500              | CHECK       | Title validation             |
| idea       | status IN ('PARKED','PROMOTED','ABANDONED')  | CHECK       | Valid status values          |
| phase      | length(title) BETWEEN 1 AND 500              | CHECK       | Title validation             |
| phase      | status IN ('ACTIVE','CLOSED')                | CHECK       | Valid status values          |
| phase      | UNIQUE INDEX on status WHERE status='ACTIVE' | UNIQUE      | Single active phase failsafe |
| phase      | source_idea_id REFERENCES idea(id)           | FOREIGN KEY | Referential integrity        |
| document   | length(title) BETWEEN 1 AND 500              | CHECK       | Title validation             |
| document   | phase_id REFERENCES phase(id)                | FOREIGN KEY | Referential integrity        |
| decision   | length(title) BETWEEN 1 AND 500              | CHECK       | Title validation             |
| decision   | status IN ('DRAFT','LOCKED')                 | CHECK       | Valid status values          |
| decision   | phase_id REFERENCES phase(id)                | FOREIGN KEY | Referential integrity        |
| task       | length(title) BETWEEN 1 AND 500              | CHECK       | Title validation             |
| task       | status IN ('PENDING','COMPLETED','VOIDED')   | CHECK       | Valid status values          |
| task       | decision_id REFERENCES decision(id)          | FOREIGN KEY | Referential integrity        |
| task       | phase_id REFERENCES phase(id)                | FOREIGN KEY | Referential integrity        |
| used_token | PRIMARY KEY on token                         | UNIQUE      | Single-use token enforcement |

## Validation Rules

| Field          | Rule                 | Error Code | Test Coverage                              |
| -------------- | -------------------- | ---------- | ------------------------------------------ |
| Project.name   | 1-200 chars          | E1001      | tests/integration/api.test.ts              |
| Idea.title     | 1-500 chars          | E1001      | tests/integration/api.test.ts              |
| Phase.title    | 1-500 chars          | E1001      | tests/integration/api.test.ts              |
| Document.title | 1-500 chars          | E1001      | tests/integration/api.test.ts              |
| Decision.title | 1-500 chars          | E1001      | tests/integration/api.test.ts              |
| Task.title     | 1-500 chars          | E1001      | tests/integration/api.test.ts              |
| Confirmation   | Exact match required | E5004      | tests/integration/api.test.ts              |
| Token          | Not previously used  | E5005      | tests/acceptance/workflows.test.ts (FT-02) |

## Hash Verification

| Hash Type | Format      | Components                              | Test Coverage                 |
| --------- | ----------- | --------------------------------------- | ----------------------------- |
| Decision  | v1:[sha256] | title + \0 + statement + \0 + rationale | tests/unit/hash-utils.test.ts |
| Snapshot  | v1:[sha256] | title + \0 + content                    | tests/unit/hash-utils.test.ts |

Normalization: UTF-8 encoding, LF line endings (\r\n → \n)

## Error Code Coverage

| Code  | Error                     | Test Coverage                              |
| ----- | ------------------------- | ------------------------------------------ |
| E1001 | Validation error          | tests/integration/api.test.ts              |
| E1002 | Not found                 | tests/integration/api.test.ts              |
| E3000 | Invalid state transition  | tests/unit/state-machines.test.ts          |
| E3001 | Active phase exists       | tests/integration/misuse.test.ts           |
| E3002 | No active phase           | tests/unit/invariants.test.ts              |
| E3003 | Phase not active          | tests/integration/misuse.test.ts           |
| E3004 | Decision not draft        | tests/integration/misuse.test.ts           |
| E3005 | Decision not locked       | tests/integration/misuse.test.ts           |
| E3006 | Task not pending          | tests/unit/invariants.test.ts              |
| E4000 | Locked decision immutable | tests/integration/misuse.test.ts           |
| E4001 | Closed phase immutable    | tests/integration/misuse.test.ts           |
| E4002 | Snapshot immutable        | (Snapshots never modified in code)         |
| E4003 | Hash mismatch             | tests/unit/hash-utils.test.ts              |
| E5004 | Invalid confirmation      | tests/integration/api.test.ts              |
| E5005 | Token already used        | tests/acceptance/workflows.test.ts (FT-02) |

## Test Execution Matrix

| Test Suite                         | Focus                | Execution Time | Coverage                   |
| ---------------------------------- | -------------------- | -------------- | -------------------------- |
| tests/unit/state-machines.test.ts  | State transitions    | < 1s           | All state machines         |
| tests/unit/hash-utils.test.ts      | Hash computation     | < 1s           | Decision & snapshot hashes |
| tests/unit/invariants.test.ts      | Invariant checks     | < 1s           | I-01 through I-06          |
| tests/integration/api.test.ts      | API contracts        | < 5s           | All endpoints              |
| tests/integration/misuse.test.ts   | Misuse prevention    | < 5s           | All error scenarios        |
| tests/acceptance/workflows.test.ts | End-to-end workflows | < 5s           | MA-01 through FT-03        |

## Coverage Goals

- **State Machine Coverage**: 100% of valid and invalid transitions
- **Invariant Coverage**: 100% of all invariants (I-01 through I-09)
- **API Coverage**: 100% of all endpoints with success and error cases
- **Error Code Coverage**: 100% of all error codes (E1xxx through E5xxx)
- **Hash Coverage**: All hash formats, normalization, and verification

## Running Tests

```bash
# Run all tests
pnpm test

# Run specific suite
pnpm test tests/unit/state-machines.test.ts

# Run with coverage
pnpm test:coverage
```
