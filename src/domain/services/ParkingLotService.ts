/**
 * ParkingLot Service
 * Section 4.2: S2 Service Implementation
 */

import { ParkingLot } from '../entities/ParkingLot.js';
import { ParkingLotRepository } from '../repositories/ParkingLotRepository.js';

export class ParkingLotService {
  constructor(private parkingLotRepo: ParkingLotRepository) {}

  createEntry(params: { content: string; source_phase_id?: string | null }): ParkingLot {
    const entry = ParkingLot.create(params);
    return this.parkingLotRepo.create(entry);
  }

  getEntry(id: string): ParkingLot | null {
    return this.parkingLotRepo.findById(id);
  }

  getAllEntries(): ParkingLot[] {
    return this.parkingLotRepo.findAll();
  }

  updateEntry(id: string, content: string): ParkingLot {
    const entry = this.parkingLotRepo.findById(id);
    if (!entry) {
      throw new Error(`ParkingLot entry ${id} not found`);
    }

    const updated = entry.updateContent(content);
    return this.parkingLotRepo.update(updated);
  }

  deleteEntry(id: string): void {
    this.parkingLotRepo.delete(id);
  }
}
