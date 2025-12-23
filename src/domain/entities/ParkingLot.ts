/**
 * ParkingLot Domain Entity
 * Section 0.5.3: ParkingLot Entity Specification
 * Section 4.2: S2 Core Domain Implementation
 *
 * Simple idea capture without disrupting active phase.
 */

import { v4 as uuidv4 } from 'uuid';
import type { ParkingLot as ParkingLotType } from '../../core/types.js';

/**
 * ParkingLot domain entity
 *
 * Per Section 0.5.3:
 * - No status
 * - No workflow
 * - Simple capture only
 * - Optional reference to originating phase
 */
export class ParkingLot implements ParkingLotType {
  readonly id: string;
  readonly content: string;
  readonly created_at: string;
  readonly source_phase_id: string | null;

  private constructor(data: ParkingLotType) {
    this.id = data.id;
    this.content = data.content;
    this.created_at = data.created_at;
    this.source_phase_id = data.source_phase_id;
  }

  /**
   * Create new ParkingLot entry
   *
   * Simple capture mechanism - no hash required per spec.
   */
  static create(params: { content: string; source_phase_id?: string | null }): ParkingLot {
    const id = uuidv4();
    const now = new Date().toISOString();

    return new ParkingLot({
      id,
      content: params.content,
      created_at: now,
      source_phase_id: params.source_phase_id ?? null,
    });
  }

  /**
   * Reconstitute ParkingLot from database
   */
  static fromDatabase(data: ParkingLotType): ParkingLot {
    return new ParkingLot(data);
  }

  /**
   * Update content
   *
   * Simple update - no hash recomputation needed per spec.
   */
  updateContent(content: string): ParkingLot {
    return new ParkingLot({
      ...this,
      content,
    });
  }

  /**
   * Check if has source phase reference
   */
  hasSourcePhase(): boolean {
    return this.source_phase_id !== null;
  }

  /**
   * Check if content is empty
   */
  isEmpty(): boolean {
    return this.content.trim().length === 0;
  }
}
