import type { Shift } from "./shift";
import {
  calculateShiftDurationMinutes,
} from "./shift-duration";

export function validateShift(
  shift: Shift,
): void {
  if (!shift.personId) {
    throw new Error(
      "A shift must have a person.",
    );
  }

  if (!shift.workLocationId) {
    throw new Error(
      "A shift must have a work location.",
    );
  }

  if (!shift.startAt) {
    throw new Error(
      "A shift must have a start time.",
    );
  }

  if (!shift.endAt) {
    throw new Error(
      "A shift must have an end time.",
    );
  }

  const duration =
    calculateShiftDurationMinutes(shift);

  if (duration <= 0) {
    throw new Error(
      "A shift must be longer than zero minutes.",
    );
  }
}