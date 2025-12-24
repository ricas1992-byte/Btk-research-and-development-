# System Constraints

These constraints are immutable. The system is designed around them.

## The Six Foundational Constraints

### 1. The Table is the sole site of binding judgment

No other zone may render verdicts, conclusions, or synthesized positions that carry epistemic weight.

- Only the Table can change an item's epistemic status to 'binding'
- Only the Table can produce TableRecords
- The `canProduceBindingJudgment` property is `true` only for the Table
- Attempting to create binding status outside the Table results in constraint violation

### 2. Side Desk, Reading Chair, and Shelves are strictly non-binding

They may hold material, enable exploration, and support preparation—but they produce no conclusions.

- Side Desk: Status is always 'provisional' for active items
- Reading Chair: Status is always 'provisional', annotations are always provisional
- Shelves: Storage only—can hold both provisional and binding items but cannot change status

### 3. No automatic transitions between zones are permitted

Material does not flow automatically from one zone to another. Every movement requires explicit Researcher action.

- No `autoMove()` methods exist
- No `suggestMove()` methods exist
- No `batchMove()` methods exist
- No `scheduledMove()` methods exist
- The TransitionManager enforces manual transitions only

### 4. All transitions require explicit Researcher action

The system never moves, promotes, or archives content autonomously.

- Every transition must include a researcher note
- The note must be non-empty (minimum length enforced)
- The note must explain the reason for the transition
- The TransitionDialog cannot be bypassed
- Empty or whitespace-only notes are rejected with `MISSING_RESEARCHER_NOTE` violation

### 5. No AI reasoning, recommendation, or synthesis features are allowed

The system is a workspace, not an assistant. It holds, organizes, and displays. It does not think.

- No AI-powered search
- No auto-complete or suggestion popups
- No AI writing assistance
- No auto-generate reasoning or verdicts
- No smart indexing or relevance ranking
- No findSimilar() or recommend() methods
- Plain text editing only

### 6. Interdisciplinary comparison is provisional until judged at the Table

Material from multiple disciplines may be juxtaposed anywhere, but such juxtaposition carries no epistemic weight until the Researcher renders judgment at the Table.

- Comparison in Reading Chair: provisional
- Comparison in Side Desk: provisional
- Comparison at Table: can become binding through judgment
- Only explicit verdicts rendered at the Table have epistemic weight

## Constraint Enforcement

The `ConstraintEnforcer` validates all state-changing operations before they execute:

- `validateTableAddition()` - Checks Table capacity before adding items
- `validateTransition()` - Validates researcher note and binding status constraints
- `validateStatusChange()` - Ensures binding status can only be assigned at Table
- `validateSystemState()` - System-wide validation of all constraints

When a constraint is violated:
1. The operation is prevented (never completes)
2. A clear error message is displayed
3. The violation is logged in the audit log
4. No auto-correction or workaround is suggested

## Immutability

These constraints are defined in `src/core/constraints.ts` with `as const` to ensure they cannot be modified at runtime:

```typescript
export const CONSTRAINTS = {
  TABLE_MAX_CAPACITY: 5,
  SIDE_DESK_MAX_CAPACITY: 20,
  BINDING_ZONES: ['table'] as const,
  AUTO_TRANSITION_ALLOWED: false,
  AI_FEATURES_ALLOWED: false,
} as const;
```

The TypeScript type system enforces these constraints at compile time, and the runtime enforcement ensures they cannot be violated during execution.
