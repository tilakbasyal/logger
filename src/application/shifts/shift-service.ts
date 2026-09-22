import type { Shift } from "../../domain/shift/shift";
import {validateShift} from "../../domain/shift/shift-validation";
import { createId } from "../../shared/id";
import { nowIso } from "../../shared/time";
import type { ShiftRepository } from "../../infrastructure/repositories/shift-repository";

export class ShiftService {
  private readonly shiftRepository: ShiftRepository;

  constructor(
    shiftRepository: ShiftRepository,
  ) {
    this.shiftRepository = shiftRepository;
  }

  async createShift(params: {
    personId: string;
    workLocationId: string;
    startAt: string;
    endAt: string;
  }): Promise<Shift> {
    const now = nowIso();

    const shift: Shift = {
      id: createId(),
      personId: params.personId,
      workLocationId: params.workLocationId,
      startAt: params.startAt,
      endAt: params.endAt,
      createdAt: now,
      updatedAt: now,
    };

    validateShift(shift);

    await this.shiftRepository.add(shift);

    return shift;
  }

  async updateShift(
    shift: Shift,
  ): Promise<void> {
    validateShift(shift);

    const updatedShift: Shift = {
      ...shift,
      updatedAt: nowIso(),
    };

    await this.shiftRepository.update(
      updatedShift,
    );
  }

  async deleteShift(
    id: string,
  ): Promise<void> {
    await this.shiftRepository.delete(id);
  }

  async getShift(
    id: string,
  ): Promise<Shift | undefined> {
    return this.shiftRepository.getById(id);
  }

  async getAllShifts(): Promise<Shift[]> {
    return this.shiftRepository.getAll();
  }

  async getPersonShifts(
    personId: string,
  ): Promise<Shift[]> {
    return this.shiftRepository.getByPerson(
      personId,
    );
  }
}