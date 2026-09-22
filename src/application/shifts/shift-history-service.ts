import type { Shift } from "../../domain/shift/shift";

import {
  calculateShiftDurationMinutes,
} from "../../domain/shift/shift-duration";

import { db } from "../../infrastructure/database/db";

export interface ShiftHistoryItem {
  shift: Shift;

  personName: string;
  employerName: string;
  locationName: string;

  durationMinutes: number;
}

export class ShiftHistoryService {
  async getAll(): Promise<ShiftHistoryItem[]> {
    const [
      shifts,
      people,
      employers,
      locations,
    ] = await Promise.all([
      db.shifts.toArray(),
      db.persons.toArray(),
      db.employers.toArray(),
      db.workLocations.toArray(),
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

  async delete(
  id: string,
): Promise<void> {
  await db.shifts.delete(id);
}
}