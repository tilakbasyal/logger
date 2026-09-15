import type { Shift } from "./shift";
import {
  differenceInMinutes,
  formatLocalDateTime,
  parseLocalDateTime,
  startOfNextDay,
} from "../time/time-utils";

export interface ShiftDayAllocation {
  date: string;
  startAt: string;
  endAt: string;
  minutes: number;
}

/**
 * Splits a shift across calendar days.
 *
 * Example:
 *
 * 2026-09-15 23:00
 * →
 * 2026-09-16 03:00
 *
 * becomes:
 *
 * September 15: 60 minutes
 * September 16: 180 minutes
 */
export function splitShiftByDay(
  shift: Shift,
): ShiftDayAllocation[] {
  const start = parseLocalDateTime(shift.startAt);
  const end = parseLocalDateTime(shift.endAt);

  if (end < start) {
    throw new Error(
      "Shift end time cannot be before its start time.",
    );
  }

  if (end.getTime() === start.getTime()) {
    return [];
  }

  const allocations: ShiftDayAllocation[] = [];

  let currentStart = new Date(start);

  while (currentStart < end) {
    const nextDay = startOfNextDay(currentStart);

    const currentEnd =
      end < nextDay ? new Date(end) : nextDay;

    const minutes = differenceInMinutes(
      currentStart,
      currentEnd,
    );

    allocations.push({
      date: formatDateOnly(currentStart),
      startAt: formatLocalDateTime(currentStart),
      endAt: formatLocalDateTime(currentEnd),
      minutes,
    });

    currentStart = currentEnd;
  }

  return allocations;
}

function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}