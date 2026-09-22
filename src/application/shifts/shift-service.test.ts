import {
  describe,
  expect,
  it,
} from "vitest";

import { ShiftService } from "./shift-service";

import type { Shift } from "../../domain/shift/shift";
import type { ShiftRepository } from "../../infrastructure/repositories/shift-repository";

class FakeShiftRepository
  implements ShiftRepository
{
  private shifts: Shift[] = [];

  async add(shift: Shift): Promise<void> {
    this.shifts.push(shift);
  }

  async update(shift: Shift): Promise<void> {
    const index = this.shifts.findIndex(
      (item) => item.id === shift.id,
    );

    if (index === -1) {
      throw new Error("Shift not found");
    }

    this.shifts[index] = shift;
  }

  async delete(id: string): Promise<void> {
    this.shifts = this.shifts.filter(
      (shift) => shift.id !== id,
    );
  }

  async getById(
    id: string,
  ): Promise<Shift | undefined> {
    return this.shifts.find(
      (shift) => shift.id === id,
    );
  }

  async getAll(): Promise<Shift[]> {
    return [...this.shifts];
  }

  async getByPerson(
    personId: string,
  ): Promise<Shift[]> {
    return this.shifts.filter(
      (shift) => shift.personId === personId,
    );
  }

  async getByPersonAndDateRange(
    personId: string,
    from: string,
    to: string,
  ): Promise<Shift[]> {
    return this.shifts.filter(
      (shift) =>
        shift.personId === personId &&
        shift.startAt >= from &&
        shift.startAt < to,
    );
  }
}

describe("ShiftService", () => {
  it("creates and retrieves a shift", async () => {
    const repository =
      new FakeShiftRepository();

    const service =
      new ShiftService(repository);

    const shift =
      await service.createShift({
        personId: "me",
        workLocationId: "tv2",
        startAt: "2026-09-15T17:00",
        endAt: "2026-09-15T20:00",
      });

    expect(shift.personId).toBe("me");
    expect(shift.workLocationId).toBe("tv2");

    const stored =
      await service.getShift(shift.id);

    expect(stored).toEqual(shift);
  });

  it("rejects a zero-length shift", async () => {
    const repository =
      new FakeShiftRepository();

    const service =
      new ShiftService(repository);

    await expect(
      service.createShift({
        personId: "me",
        workLocationId: "tv2",
        startAt: "2026-09-15T17:00",
        endAt: "2026-09-15T17:00",
      }),
    ).rejects.toThrow(
      "A shift must be longer than zero minutes.",
    );
  });

  it("rejects a shift whose end is before its start", async () => {
    const repository =
      new FakeShiftRepository();

    const service =
      new ShiftService(repository);

    await expect(
      service.createShift({
        personId: "me",
        workLocationId: "tv2",
        startAt: "2026-09-15T20:00",
        endAt: "2026-09-15T17:00",
      }),
    ).rejects.toThrow();
  });
});