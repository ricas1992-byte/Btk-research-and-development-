// Immutable system constraints for CDW Institute

// Immutable system constraints
export const CONSTRAINTS = {
  TABLE_MAX_CAPACITY: 5,
  SIDE_DESK_MAX_CAPACITY: 20,
  BINDING_ZONES: ['table'] as const, // Only table can produce binding judgments
  AUTO_TRANSITION_ALLOWED: false, // Never changes
  AI_FEATURES_ALLOWED: false, // Never changes
} as const;

// Constraint violation types
export type ConstraintViolation =
  | 'TABLE_CAPACITY_EXCEEDED'
  | 'BINDING_STATUS_OUTSIDE_TABLE'
  | 'AUTO_TRANSITION_ATTEMPTED'
  | 'MISSING_RESEARCHER_NOTE'
  | 'AI_FEATURE_INVOKED';
