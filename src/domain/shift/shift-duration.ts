import type { Shift } from "./shift";
import { parseLocalDateTime } from "../time/time-utils";

export const BREAK_THRESHOLD_MINUTES = 6 * 60 + 30; // 6h 30m
export const BREAK_DURATION_MINUTES = 30;

export function calculateGrossShiftDurationMinutes(
  shift: Shift
): number {
  const start = parseLocalDateTime(shift.startAt);
  const end = parseLocalDateTime(shift.endAt);

  const duration = Math.round(
    (end.getTime() - start.getTime()) / 60000
  );

  if (duration < 0) {
    throw new Error("Shift end time cannot be before shift start time.");
  }

  return duration;
}

export function calculateBreakMinutes(
  grossMinutes: number
): number {
  return grossMinutes >= BREAK_THRESHOLD_MINUTES
    ? BREAK_DURATION_MINUTES
    : 0;
}

export function calculateShiftDurationMinutes(
  shift: Shift
): number {
  const grossMinutes =
    calculateGrossShiftDurationMinutes(shift);

  return grossMinutes - calculateBreakMinutes(grossMinutes);
}

export function calculateNetDurationMinutes(
  startAt: string,
  endAt: string
): number {
  const start = parseLocalDateTime(startAt);
  const end = parseLocalDateTime(endAt);

  const grossMinutes = Math.round(
    (end.getTime() - start.getTime()) / 60000
  );

  if (grossMinutes < 0) {
    throw new Error(
      "End time cannot be before start time."
    );
  }

  return (
    grossMinutes -
    calculateBreakMinutes(grossMinutes)
  );
}