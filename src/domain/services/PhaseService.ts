/**
 * Phase Service
 * Section 4.2: S2 Service Implementation
 *
 * Business logic for phase management
 */

import { Phase } from '../entities/Phase.js';
import { PhaseRepository } from '../repositories/PhaseRepository.js';

export class PhaseService {
  constructor(private phaseRepo: PhaseRepository) {}

  /**
   * Create new phase
   *
   * Enforces single active phase constraint (ENF-01).
   */
  createPhase(params: { name: string; description: string }): Phase {
    // Check single active phase constraint
    if (this.phaseRepo.hasActivePhase()) {
      throw new Error('Cannot create phase: Active phase already exists (ENF-01)');
    }

    const phase = Phase.create(params);
    return this.phaseRepo.create(phase);
  }

  /**
   * Get phase by ID
   */
  getPhase(id: string): Phase | null {
    return this.phaseRepo.findById(id);
  }

  /**
   * Get active phase
   */
  getActivePhase(): Phase | null {
    return this.phaseRepo.findActive();
  }

  /**
   * Get all phases
   */
  getAllPhases(): Phase[] {
    return this.phaseRepo.findAll();
  }

  /**
   * Update phase details
   */
  updatePhase(id: string, params: { name?: string; description?: string }): Phase {
    const phase = this.phaseRepo.findById(id);
    if (!phase) {
      throw new Error(`Phase ${id} not found`);
    }

    const updated = phase.update(params);
    return this.phaseRepo.update(updated);
  }

  /**
   * Complete active phase
   *
   * Per Section 0.5.6: ACTIVE → COMPLETED (terminal)
   */
  completePhase(id: string): Phase {
    const phase = this.phaseRepo.findById(id);
    if (!phase) {
      throw new Error(`Phase ${id} not found`);
    }

    const completed = phase.complete();
    return this.phaseRepo.update(completed);
  }

  /**
   * Abandon phase
   *
   * Per Section 0.5.6: ACTIVE → ABANDONED (terminal)
   */
  abandonPhase(id: string): Phase {
    const phase = this.phaseRepo.findById(id);
    if (!phase) {
      throw new Error(`Phase ${id} not found`);
    }

    const abandoned = phase.abandon();
    return this.phaseRepo.update(abandoned);
  }
}
