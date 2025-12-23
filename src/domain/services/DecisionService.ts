/**
 * Decision Service
 * Section 4.2: S2 Service Implementation
 */

import { Decision } from '../entities/Decision.js';
import { DecisionRepository } from '../repositories/DecisionRepository.js';

export class DecisionService {
  constructor(private decisionRepo: DecisionRepository) {}

  createDecision(params: { phase_id: string; content: string }): Decision {
    const decision = Decision.create(params);
    return this.decisionRepo.create(decision);
  }

  getDecision(id: string): Decision | null {
    return this.decisionRepo.findById(id);
  }

  getDecisionsByPhase(phaseId: string): Decision[] {
    return this.decisionRepo.findByPhaseId(phaseId);
  }

  getLockedDecisionsByPhase(phaseId: string): Decision[] {
    return this.decisionRepo.findLockedByPhaseId(phaseId);
  }

  /**
   * Update decision content
   *
   * Only allowed when status is DRAFT (ENF-02).
   */
  updateDecision(id: string, content: string): Decision {
    const decision = this.decisionRepo.findById(id);
    if (!decision) {
      throw new Error(`Decision ${id} not found`);
    }

    const updated = decision.updateContent(content);
    return this.decisionRepo.update(updated);
  }

  /**
   * Lock decision (make immutable)
   *
   * Per Section 0.5.6: DRAFT → LOCKED (terminal, immutable)
   * ENF-02: Decision immutability enforced.
   */
  lockDecision(id: string): Decision {
    const decision = this.decisionRepo.findById(id);
    if (!decision) {
      throw new Error(`Decision ${id} not found`);
    }

    const locked = decision.lock();
    return this.decisionRepo.update(locked);
  }

  deleteDecision(id: string): void {
    const decision = this.decisionRepo.findById(id);
    if (!decision) {
      throw new Error(`Decision ${id} not found`);
    }

    if (decision.isLocked()) {
      throw new Error('Cannot delete locked decision (ENF-02)');
    }

    this.decisionRepo.delete(id);
  }
}
