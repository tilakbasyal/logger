import { db } from "../database/db";
import type { Shift } from "../../domain/shift/shift";

export interface ShiftRepository {
  add(shift: Shift): Promise<void>;
  update(shift: Shift): Promise<void>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<Shift | undefined>;
  getAll(): Promise<Shift[]>;
  getByPerson(personId: string): Promise<Shift[]>;
  getByPersonAndDateRange(
    personId: string,
    from: string,
    to: string,
    ): Promise<Shift[]>;
}

export class DexieShiftRepository
  implements ShiftRepository
{
  async add(shift: Shift): Promise<void> {
    await db.shifts.add(shift);
  }

  async update(shift: Shift): Promise<void> {
    await db.shifts.put(shift);
  }

  async delete(id: string): Promise<void> {
    await db.shifts.delete(id);
  }

  async getById(
    id: string,
  ): Promise<Shift | undefined> {
    return db.shifts.get(id);
  }

  async getAll(): Promise<Shift[]> {
    return db.shifts.toArray();
  }

  async getByPerson(
    personId: string,
  ): Promise<Shift[]> {
    return db.shifts
      .where("personId")
      .equals(personId)
      .toArray();
  }

  async getByPersonAndDateRange(
  personId: string,
  from: string,
  to: string,
): Promise<Shift[]> {
  const shifts = await db.shifts
    .where("personId")
    .equals(personId)
    .toArray();

  const rangeStart = new Date(from);
  const rangeEnd = new Date(to);

  return shifts.filter((shift) => {
    const shiftStart = new Date(
      shift.startAt,
    );

    const shiftEnd = new Date(
      shift.endAt,
    );

    /*
     * Two time intervals overlap when:
     *
     * shiftStart < rangeEnd
     * AND
     * shiftEnd > rangeStart
     */

    return (
      shiftStart < rangeEnd &&
      shiftEnd > rangeStart
    );
  });
}
}