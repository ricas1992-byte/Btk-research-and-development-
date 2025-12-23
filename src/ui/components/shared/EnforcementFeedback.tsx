/**
 * EnforcementFeedback Component
 * Section 4.4: S4 UI Integration
 *
 * Displays enforcement rule violations with clear feedback to users.
 * Shows rule codes (ENF-01 through ENF-06) and human-readable messages.
 */

interface EnforcementFeedbackProps {
  error: {
    code: 'ENFORCEMENT_VIOLATION' | 'INVALID_STATE_TRANSITION';
    message: string;
    rule?: string;
  } | null;
  onDismiss?: () => void;
}

export function EnforcementFeedback({ error, onDismiss }: EnforcementFeedbackProps) {
  if (!error) return null;

  const isEnforcement = error.code === 'ENFORCEMENT_VIOLATION';

  return (
    <div className={`enforcement-feedback ${isEnforcement ? 'enforcement' : 'transition'}`}>
      <div className="enforcement-feedback-header">
        {isEnforcement && error.rule && (
          <span className="enforcement-rule-code">{error.rule}</span>
        )}
        <span className="enforcement-title">
          {isEnforcement ? 'Enforcement Rule Violation' : 'Invalid State Transition'}
        </span>
        {onDismiss && (
          <button className="enforcement-dismiss" onClick={onDismiss} aria-label="Dismiss">
            ×
          </button>
        )}
      </div>
      <div className="enforcement-message">{error.message}</div>
      {isEnforcement && error.rule && (
        <div className="enforcement-explanation">
          {getRuleExplanation(error.rule)}
        </div>
      )}
    </div>
  );
}

/**
 * Get human-readable explanation for enforcement rules
 */
function getRuleExplanation(rule: string): string {
  const explanations: Record<string, string> = {
    'ENF-01': 'Only one Phase can be ACTIVE at a time. Complete or abandon the current Phase before creating a new one.',
    'ENF-02': 'Decisions cannot be modified after they are LOCKED. Create a new Decision if changes are needed.',
    'ENF-03': 'Tasks can only be created from LOCKED Decisions. Lock the Decision first.',
    'ENF-04': 'New entities can only be created when the Phase is ACTIVE.',
    'ENF-05': 'Entities can only be modified when the Phase is ACTIVE.',
    'ENF-06': 'Phases in COMPLETED or ABANDONED status cannot be modified.',
  };

  return explanations[rule] || 'See Section 0.5.7 for enforcement rule details.';
}
