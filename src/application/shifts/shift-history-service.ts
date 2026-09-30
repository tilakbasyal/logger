import type { Shift } from "../../domain/shift/shift";

import {
  calculateShiftDurationMinutes,
} from "../../domain/shift/shift-duration";

import type { PersonRepository } from "../../infrastructure/repositories/person-repository";

import type {
  EmployerRepository,
  WorkLocationRepository,
} from "../../infrastructure/repositories/workplace-repository";

import type { ShiftRepository } from "../../infrastructure/repositories/shift-repository";

export interface ShiftHistoryItem {
  shift: Shift;

  personName: string;
  employerName: string;
  locationName: string;

  durationMinutes: number;
}

export class ShiftHistoryService {
  private readonly shiftRepository: ShiftRepository;
  private readonly personRepository: PersonRepository;
  private readonly employerRepository: EmployerRepository;
  private readonly workLocationRepository: WorkLocationRepository;

  constructor(
    shiftRepository: ShiftRepository,
    personRepository: PersonRepository,
    employerRepository: EmployerRepository,
    workLocationRepository: WorkLocationRepository,
  ) {
    this.shiftRepository = shiftRepository;
    this.personRepository = personRepository;
    this.employerRepository = employerRepository;
    this.workLocationRepository =
      workLocationRepository;
  }

  async getAll(): Promise<ShiftHistoryItem[]> {
    const [
      shifts,
      people,
      employers,
      locations,
    ] = await Promise.all([
      this.shiftRepository.getAll(),
      this.personRepository.getAll(),
      this.employerRepository.getAll(),
      this.workLocationRepository.getAll(),
    ]);

    const personMap = new Map(
      people.map((person) => [
        person.id,
        person.name,
      ]),
    );

    const employerMap = new Map(
      employers.map((employer) => [
        employer.id,
        employer.name,
      ]),
    );

    const locationMap = new Map(
      locations.map((location) => [
        location.id,
        location,
      ]),
    );

    return shifts
      .map((shift) => {
        const location = locationMap.get(
          shift.workLocationId,
        );

        if (!location) {
          return null;
        }

        const employerName =
          employerMap.get(
            location.employerId,
          );

        if (!employerName) {
          return null;
        }

        return {
          shift,
          personName:
            personMap.get(
              shift.personId,
            ) ?? "Unknown",
          employerName,
          locationName: location.name,
          durationMinutes:
            calculateShiftDurationMinutes(
              shift,
            ),
        };
      })
      .filter(
        (
          item,
        ): item is ShiftHistoryItem =>
          item !== null,
      )
      .sort(
        (a, b) =>
          b.shift.startAt.localeCompare(
            a.shift.startAt,
          ),
      );
  }

  async delete(id: string): Promise<void> {
    await this.shiftRepository.delete(id);
  }
}