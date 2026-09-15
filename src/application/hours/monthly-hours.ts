import type { Shift } from "../../domain/shift/shift";
import { splitShiftByDay } from "../../domain/shift/shift-day-allocation";

/**
 * Calculate the number of minutes a person worked
 * during a calendar month.
 *
 * Month is 1-12.
 */
export function calculateMonthlyMinutes(
  shifts: Shift[],
  personId: string,
  year: number,
  month: number,
): number {
  const monthStart = new Date(year, month - 1, 1);
  const nextMonthStart = new Date(year, month, 1);

  let totalMinutes = 0;

  for (const shift of shifts) {
    if (shift.personId !== personId) {
      continue;
    }

    const allocations = splitShiftByDay(shift);

    for (const allocation of allocations) {
      const date = new Date(`${allocation.date}T00:00`);

      if (
        date >= monthStart &&
        date < nextMonthStart
      ) {
        totalMinutes += allocation.minutes;
      }
    }
  }

  return totalMinutes;
}