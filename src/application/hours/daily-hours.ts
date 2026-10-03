import type { Employer } from "../../domain/employer/employer";
import type { Shift } from "../../domain/shift/shift";
import type { WorkLocation } from "../../domain/employer/work-location";
import { splitShiftByDay } from "../../domain/shift/shift-day-allocation";

export interface DailyLocationMinutes {
  locationId: string;
  locationName: string;
  minutes: number;
}

export interface DailyEmployerMinutes {
  employerId: string;
  employerName: string;
  minutes: number;
  locations: DailyLocationMinutes[];
}

export interface DailyMinutes {
  date: string;
  minutes: number;
  employers: DailyEmployerMinutes[];
}

/**
 * Calculate worked minutes for each calendar day
 * during a specific month, including the employer
 * breakdown for each day.
 *
 * Month is 1-12.
 */
export function calculateDailyMinutes(
  shifts: Shift[],
  personId: string,
  locations: WorkLocation[],
  employers: Employer[],
  year: number,
  month: number,
): DailyMinutes[] {
  const monthStartDate = `${year}-${String(month).padStart(2, "0")}-01`;

  const nextMonth = new Date(year, month, 1);

  const nextMonthDate = `${nextMonth.getFullYear()}-${String(
    nextMonth.getMonth() + 1,
  ).padStart(2, "0")}-01`;

  const dailyMinutes = new Map<
    string,
    {
      minutes: number;
      employers: Map<string, DailyEmployerMinutes>;
    }
  >();

  for (const shift of shifts) {
    if (shift.personId !== personId) {
      continue;
    }

    const location = locations.find((item) => item.id === shift.workLocationId);

    if (!location) {
      continue;
    }

    const employer = employers.find((item) => item.id === location.employerId);

    if (!employer) {
      continue;
    }

    const allocations = splitShiftByDay(shift);

    for (const allocation of allocations) {
      if (
        allocation.date < monthStartDate ||
        allocation.date >= nextMonthDate
      ) {
        continue;
      }

      let day = dailyMinutes.get(allocation.date);

      if (!day) {
        day = {
          minutes: 0,
          employers: new Map(),
        };

        dailyMinutes.set(allocation.date, day);
      }

      day.minutes += allocation.minutes;

      const employerResult = day.employers.get(employer.id);

      if (employerResult) {
        employerResult.minutes += allocation.minutes;

        const locationResult = employerResult.locations.find(
          (item) => item.locationId === location.id,
        );

        if (locationResult) {
          locationResult.minutes += allocation.minutes;
        } else {
          employerResult.locations.push({
            locationId: location.id,
            locationName: location.name,
            minutes: allocation.minutes,
          });
        }
      } else {
        day.employers.set(employer.id, {
          employerId: employer.id,
          employerName: employer.name,
          minutes: allocation.minutes,
          locations: [
            {
              locationId: location.id,
              locationName: location.name,
              minutes: allocation.minutes,
            },
          ],
        });
      }
    }
  }

  return Array.from(dailyMinutes.entries())
    .map(([date, day]) => ({
      date,
      minutes: day.minutes,
      employers: Array.from(day.employers.values())
        .map((employer) => ({
          ...employer,
          locations: employer.locations.sort((a, b) => b.minutes - a.minutes),
        }))
        .sort((a, b) => b.minutes - a.minutes),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
