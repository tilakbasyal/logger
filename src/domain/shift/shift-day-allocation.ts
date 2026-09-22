import type { Shift } from "./shift";
import {
  calculateGrossShiftDurationMinutes,
  calculateBreakMinutes,
} from "./shift-duration";
import {
  parseLocalDateTime,
  startOfDay,
  startOfNextDay,
} from "../time/time-utils";

export interface ShiftDayAllocation {
  date: string;
  minutes: number;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function splitShiftByDay(
  shift: Shift
): ShiftDayAllocation[] {
  const start = parseLocalDateTime(shift.startAt);
  const end = parseLocalDateTime(shift.endAt);

  const grossMinutes =
    calculateGrossShiftDurationMinutes(shift);

  const breakMinutes =
    calculateBreakMinutes(grossMinutes);

  const allocations: ShiftDayAllocation[] = [];

  let currentDay = startOfDay(start);

  while (currentDay < end) {
    const nextDay = startOfNextDay(currentDay);

    const segmentStart =
      Math.max(start.getTime(), currentDay.getTime());

    const segmentEnd =
      Math.min(end.getTime(), nextDay.getTime());

    if (segmentEnd > segmentStart) {
      const minutes = Math.round(
        (segmentEnd - segmentStart) / 60000
      );

      allocations.push({
        date: formatDate(currentDay),
        minutes,
      });
    }

    currentDay = nextDay;
  }

  /*
   * The break belongs to the complete shift, not to each
   * individual calendar-day segment.
   *
   * We deduct it from the final allocation because the actual
   * break timestamp is not stored.
   */
  if (breakMinutes > 0 && allocations.length > 0) {
    const lastAllocation =
      allocations[allocations.length - 1];

    lastAllocation.minutes = Math.max(
      0,
      lastAllocation.minutes - breakMinutes
    );
  }

  return allocations;
}