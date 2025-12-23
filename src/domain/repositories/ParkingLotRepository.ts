/**
 * ParkingLot Repository
 * Section 4.2: S2 Repository Implementation
 *
 * Note: ParkingLot has no content_hash per Section 0.5.3
 */

import type Database from 'better-sqlite3';
import { ParkingLot } from '../entities/ParkingLot.js';
import type { ParkingLot as ParkingLotType } from '../../core/types.js';

export class ParkingLotRepository {
  constructor(private db: Database.Database) {}

  create(parkingLot: ParkingLot): ParkingLot {
    const stmt = this.db.prepare(`
      INSERT INTO parking_lot (id, content, created_at, source_phase_id)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(parkingLot.id, parkingLot.content, parkingLot.created_at, parkingLot.source_phase_id);

    return parkingLot;
  }

  findById(id: string): ParkingLot | null {
    const stmt = this.db.prepare('SELECT * FROM parking_lot WHERE id = ?');
    const row = stmt.get(id) as ParkingLotType | undefined;

    if (!row) {
      return null;
    }

    return ParkingLot.fromDatabase(row);
  }

  findAll(): ParkingLot[] {
    const stmt = this.db.prepare('SELECT * FROM parking_lot ORDER BY created_at DESC');
    const rows = stmt.all() as ParkingLotType[];

    return rows.map((row) => ParkingLot.fromDatabase(row));
  }

  update(parkingLot: ParkingLot): ParkingLot {
    const stmt = this.db.prepare(`
      UPDATE parking_lot
      SET content = ?
      WHERE id = ?
    `);

    stmt.run(parkingLot.content, parkingLot.id);

    return parkingLot;
  }

  delete(id: string): void {
    const stmt = this.db.prepare('DELETE FROM parking_lot WHERE id = ?');
    stmt.run(id);
  }
}
