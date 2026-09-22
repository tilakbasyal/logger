import type { ShiftPreset } from "../../domain/shift/shift-preset";
import { db } from "../database/db";

export interface ShiftPresetRepository {
  add(preset: ShiftPreset): Promise<void>;
  update(preset: ShiftPreset): Promise<void>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<ShiftPreset | undefined>;
  getAll(): Promise<ShiftPreset[]>;
  getByPerson(personId: string): Promise<ShiftPreset[]>;
}

export class DexieShiftPresetRepository
  implements ShiftPresetRepository
{
  async add(preset: ShiftPreset): Promise<void> {
    await db.shiftPresets.add(preset);
  }

  async update(preset: ShiftPreset): Promise<void> {
    await db.shiftPresets.put(preset);
  }

  async delete(id: string): Promise<void> {
    await db.shiftPresets.delete(id);
  }

  async getById(
    id: string,
  ): Promise<ShiftPreset | undefined> {
    return db.shiftPresets.get(id);
  }

  async getAll(): Promise<ShiftPreset[]> {
    return db.shiftPresets.toArray();
  }

  async getByPerson(
    personId: string,
  ): Promise<ShiftPreset[]> {
    return db.shiftPresets
      .where("personId")
      .equals(personId)
      .toArray();
  }
}