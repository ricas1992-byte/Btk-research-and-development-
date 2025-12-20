export class CDWError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'CDWError';
  }
}

export class ValidationError extends CDWError {
  constructor(message: string, details?: unknown) {
    super('E1001', message, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends CDWError {
  constructor(message: string) {
    super('E1002', message);
    this.name = 'NotFoundError';
  }
}

export class InvalidStateTransitionError extends CDWError {
  constructor(message: string, details?: unknown) {
    super('E3000', message, details);
    this.name = 'InvalidStateTransitionError';
  }
}

export class ActivePhaseExistsError extends CDWError {
  constructor(message: string = 'An active phase already exists') {
    super('E3001', message);
    this.name = 'ActivePhaseExistsError';
  }
}

export class NoActivePhaseError extends CDWError {
  constructor(message: string = 'No active phase exists') {
    super('E3002', message);
    this.name = 'NoActivePhaseError';
  }
}

export class PhaseNotActiveError extends CDWError {
  constructor(message: string = 'Phase is not active') {
    super('E3003', message);
    this.name = 'PhaseNotActiveError';
  }
}

export class DecisionNotDraftError extends CDWError {
  constructor(message: string = 'Decision is not in DRAFT status') {
    super('E3004', message);
    this.name = 'DecisionNotDraftError';
  }
}

export class DecisionNotLockedError extends CDWError {
  constructor(message: string = 'Decision is not in LOCKED status') {
    super('E3005', message);
    this.name = 'DecisionNotLockedError';
  }
}

export class TaskNotPendingError extends CDWError {
  constructor(message: string = 'Task is not in PENDING status') {
    super('E3006', message);
    this.name = 'TaskNotPendingError';
  }
}

export class LockedDecisionImmutableError extends CDWError {
  constructor(message: string = 'Locked decisions are immutable') {
    super('E4000', message);
    this.name = 'LockedDecisionImmutableError';
  }
}

export class ClosedPhaseImmutableError extends CDWError {
  constructor(message: string = 'Closed phases are immutable') {
    super('E4001', message);
    this.name = 'ClosedPhaseImmutableError';
  }
}

export class SnapshotImmutableError extends CDWError {
  constructor(message: string = 'Snapshots are immutable') {
    super('E4002', message);
    this.name = 'SnapshotImmutableError';
  }
}

export class HashMismatchError extends CDWError {
  constructor(message: string = 'Content hash mismatch') {
    super('E4003', message);
    this.name = 'HashMismatchError';
  }
}

export class InvalidConfirmationError extends CDWError {
  constructor(message: string = 'Invalid confirmation') {
    super('E5004', message);
    this.name = 'InvalidConfirmationError';
  }
}

export class TokenAlreadyUsedError extends CDWError {
  constructor(message: string = 'Token has already been used') {
    super('E5005', message);
    this.name = 'TokenAlreadyUsedError';
  }
}
