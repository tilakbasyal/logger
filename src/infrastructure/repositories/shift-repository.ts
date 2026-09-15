import { db } from "../database/db";
import type { Shift } from "../../domain/shift/shift";

export interface ShiftRepository {
  add(shift: Shift): Promise<void>;
  update(shift: Shift): Promise<void>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<Shift | undefined>;
  getAll(): Promise<Shift[]>;
}

export class DexieShiftRepository implements ShiftRepository {
  async add(shift: Shift): Promise<void> {
    await db.shifts.add(shift);
  }

  async update(shift: Shift): Promise<void> {
    await db.shifts.put(shift);
  }

  async delete(id: string): Promise<void> {
    await db.shifts.delete(id);
  }

  async getById(id: string): Promise<Shift | undefined> {
    return db.shifts.get(id);
  }

  async getAll(): Promise<Shift[]> {
    return db.shifts.toArray();
  }
}