import type { Shift } from "./shift";
import {
  differenceInMinutes,
  parseLocalDateTime,
} from "../time/time-utils";

export function calculateShiftDurationMinutes(
  shift: Shift,
): number {
  const start = parseLocalDateTime(shift.startAt);
  const end = parseLocalDateTime(shift.endAt);

  const duration = differenceInMinutes(start, end);

  if (duration < 0) {
    throw new Error(
      "Shift end time cannot be before its start time.",
    );
  }

  return duration;
}