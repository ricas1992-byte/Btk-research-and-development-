# CDW Institute Architecture

## Overview

The Cognitive Discipline Workspace Institute implements a four-zone model for rigorous intellectual work. Each zone serves a distinct epistemic function within a carefully designed architecture that enforces manual control and prevents automation.

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CDW Institute                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      Workspace                            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────┐  ┌──────┐│  │
│  │  │  Table   │  │ SideDesk │  │ ReadingChair  │  │Shelves││  │
│  │  │ (max 5)  │  │ (max 20) │  │  (unlimited)  │  │(∞)    ││  │
│  │  │ BINDING  │  │provisional│  │  provisional  │  │both   ││  │
│  │  └──────────┘  └──────────┘  └───────────────┘  └──────┘│  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                    ┌─────────┴──────────┐                       │
│                    │                     │                       │
│           ┌────────▼──────┐    ┌────────▼────────┐             │
│           │ Judgment      │    │  Transition     │             │
│           │ Service       │    │  Manager        │             │
│           └────────┬──────┘    └────────┬────────┘             │
│                    │                     │                       │
│           ┌────────▼─────────────────────▼────────┐            │
│           │       Constraint Enforcer              │            │
│           │  - validateTableAddition()             │            │
│           │  - validateTransition()                │            │
│           │  - validateStatusChange()              │            │
│           │  - validateSystemState()               │            │
│           └──────────────┬─────────────────────────┘            │
│                          │                                       │
│                          ▼                                       │
│           ┌─────────────────────────────┐                       │
│           │      Audit Log               │                       │
│           │  - Immutable record          │                       │
│           │  - All actions logged        │                       │
│           └─────────────────────────────┘                       │
│                                                                  │
│           ┌─────────────────────────────┐                       │
│           │   File Repository            │                       │
│           │  - WorkspaceItems            │                       │
│           │  - TableRecords              │                       │
│           └─────────────────────────────┘                       │
└──────────────────────────────────────────────────────────────────┘
```

## The Four-Zone Model

### The Table

**Function**: Site of active judgment and binding conclusion

**Epistemic Status**: The Table is the **sole site of binding judgment** in the entire system. No other zone may render verdicts, conclusions, or synthesized positions that carry epistemic weight.

**Characteristics**:
- Limited capacity: Maximum 3-5 items
- High friction for entry and exit
- Produces the only binding artifacts in the system (TableRecords)
- All items on the Table have epistemic status: 'under-judgment'

**What happens here**:
- The Researcher confronts material directly
- Renders verdicts
- Writes binding conclusions
- Produces TableRecords

**What does NOT happen here**:
- Browsing
- Exploration
- Tentative comparison
- Storage

### The Side Desk

**Function**: Active preparation and marshaling space

**Epistemic Status**: Strictly non-binding. May hold material, enable organization, and support preparation—but produces no conclusions.

**Characteristics**:
- Moderate capacity (recommended: ~20 items)
- Staging area for material being prepared for Table judgment
- All items have epistemic status: 'provisional'

**What happens here**:
- Organizing arguments
- Arranging evidence
- Drafting preliminary structures
- Queuing material for Table

**What does NOT happen here**:
- Binding judgment
- Permanent storage
- Casual browsing

### The Reading Chair

**Function**: Exploratory engagement and contemplation

**Epistemic Status**: Strictly non-binding. Explicitly provisional space for exploration.

**Characteristics**:
- No capacity limits
- Low friction
- All items and annotations have epistemic status: 'provisional'

**What happens here**:
- Reading
- Annotating
- Making tentative connections
- Exploratory notes
- Interdisciplinary wandering

**What does NOT happen here**:
- Conclusions
- Verdicts
- Binding synthesis

### The Shelves

**Function**: Organized storage and retrieval

**Epistemic Status**: Non-binding for storage function. Can hold both provisional items and finalized TableRecords.

**Characteristics**:
- No capacity limits
- Categorical organization
- Archival function
- Reference access

**What happens here**:
- Long-term storage of sources
- Archiving completed TableRecords
- Categorical organization
- Retrieval of reference materials

**What does NOT happen here**:
- Active work
- Judgment
- Exploration

## Transition Requirements

**All transitions require explicit Researcher action.** This is an immutable constraint.

Every transition between zones must:
1. Be initiated manually by the Researcher
2. Include a researcher note explaining the reason for the transition
3. Be validated against zone constraints before execution
4. Be recorded in the item's transition history

The system does NOT and CANNOT:
- Move items automatically
- Suggest transitions
- Batch move items
- Schedule future transitions
- Auto-promote or auto-demote items

## Epistemic Status Flow

```
provisional → under-judgment → binding
```

- **provisional**: Default status for all items in Reading Chair, Side Desk, and newly created items
- **under-judgment**: Status for items on the Table during active consideration
- **binding**: Final status assigned ONLY by the Table through the verdict process

**Critical rule**: Only the Table can change an item's status to 'binding'. This happens through the explicit judgment workflow where the Researcher renders a verdict.

## Constraint Enforcement

The system enforces six foundational constraints at all times:

1. **Table exclusivity for binding judgment**: Validated before any status change
2. **Non-binding zones**: Reading Chair, Side Desk, and Shelves cannot produce binding judgments
3. **No automatic transitions**: All transition requests must originate from explicit Researcher action
4. **Manual transition requirement**: Every transition must include a researcher note
5. **No AI features**: The system contains no AI reasoning, recommendation, or synthesis capabilities
6. **Provisional interdisciplinary comparison**: Until judged at the Table, all comparisons remain provisional

These constraints are checked by the ConstraintEnforcer before any state-changing operation.

## Data Flow

1. Researcher creates item → enters Reading Chair (provisional)
2. Researcher moves item to Side Desk → organizes for judgment (provisional)
3. Researcher moves item to Table → status becomes 'under-judgment'
4. Researcher renders verdict at Table → creates binding TableRecord
5. Items involved in judgment → status becomes 'binding'
6. Researcher moves binding items/records to Shelves → archived

At no point does the system move items automatically. Every arrow above represents an explicit Researcher action.
