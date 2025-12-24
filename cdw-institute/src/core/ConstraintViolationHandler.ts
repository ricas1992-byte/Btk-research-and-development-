// Handle constraint violations - no silent failures

import { ConstraintViolation } from './constraints.js';

export class ConstraintViolationHandler {
  // Handle violations - no silent failures

  handleViolation(violation: ConstraintViolation): void {
    // Actions:
    // - Log violation with timestamp
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] Constraint Violation: ${violation}`);

    // - Display user-facing error message
    const message = this.getViolationMessage(violation);
    alert(message); // In a real app, this would be a proper UI notification

    // - Prevent the violating action from completing
    // (This is handled by the caller checking the violation)

    // - Never auto-correct or suggest workarounds
    // (No remediation logic here - only reporting)
  }

  // Violation messages - clear and educational
  getViolationMessage(violation: ConstraintViolation): string {
    // Examples:
    // TABLE_CAPACITY_EXCEEDED: "The Table can hold only 5 items. Remove an item before adding another."
    // BINDING_STATUS_OUTSIDE_TABLE: "Binding status can only be assigned at the Table."
    // AUTO_TRANSITION_ATTEMPTED: "Items cannot move automatically. Use manual transition."
    // MISSING_RESEARCHER_NOTE: "You must provide a note explaining this transition."

    switch (violation) {
      case 'TABLE_CAPACITY_EXCEEDED':
        return 'The Table can hold only 5 items. Remove an item before adding another.';

      case 'BINDING_STATUS_OUTSIDE_TABLE':
        return 'Binding status can only be assigned at the Table. Binding items may only exist in the Table or Shelves.';

      case 'AUTO_TRANSITION_ATTEMPTED':
        return 'Items cannot move automatically. You must manually transition items between zones with an explanation.';

      case 'MISSING_RESEARCHER_NOTE':
        return 'You must provide a note explaining this transition. All zone transitions require explicit researcher justification.';

      case 'AI_FEATURE_INVOKED':
        return 'AI features are not allowed in this system. The CDW Institute is a manual workspace for disciplined intellectual work.';

      default:
        return `A constraint violation occurred: ${violation}`;
    }
  }
}
