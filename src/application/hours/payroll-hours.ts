import type { Shift } from "../../domain/shift/shift";
import type { PayrollSchedule } from "../../domain/payroll/payroll-schedule";
import { getPayrollPeriod } from "../../domain/payroll/payroll-period";
import {
  calculateGrossShiftDurationMinutes,
  calculateBreakMinutes,
} from "../../domain/shift/shift-duration";
import { parseLocalDateTime } from "../../domain/time/time-utils";

export function calculatePayrollMinutes(
  shifts: Shift[],
  personId: string,
  schedule: PayrollSchedule,
  referenceDate: Date
): number {
  const period = getPayrollPeriod(
    schedule,
    referenceDate
  );

  let totalMinutes = 0;

  for (const shift of shifts) {
    if (shift.personId !== personId) {
      continue;
    }

    const shiftStart = parseLocalDateTime(shift.startAt);
    const shiftEnd = parseLocalDateTime(shift.endAt);

    const grossMinutes =
      calculateGrossShiftDurationMinutes(shift);

    const breakMinutes =
      calculateBreakMinutes(grossMinutes);

    const overlapMinutes = calculateOverlapMinutes(
      shiftStart,
      shiftEnd,
      period.start,
      period.end
    );

    if (overlapMinutes <= 0) {
      continue;
    }

    /*
     * If the whole shift is inside the payroll period,
     * deduct the complete break.
     */
    const entireShiftIsInsidePeriod =
      shiftStart.getTime() >= period.start.getTime() &&
      shiftEnd.getTime() <= period.end.getTime();

    if (entireShiftIsInsidePeriod) {
      totalMinutes +=
        overlapMinutes - breakMinutes;
      continue;
    }

    /*
     * For a shift crossing a payroll boundary, the break
     * is allocated to the final part of the shift.
     *
     * This prevents the same break being deducted twice.
     */
    const breakEnd =
      shiftEnd.getTime();

    const breakStart =
      breakEnd - breakMinutes * 60000;

    const breakOverlap = calculateOverlapMilliseconds(
      new Date(breakStart),
      shiftEnd,
      period.start,
      period.end
    );

    totalMinutes +=
      overlapMinutes -
      Math.round(breakOverlap / 60000);
  }

  return totalMinutes;
}

function calculateOverlapMinutes(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): number {
  return Math.round(
    calculateOverlapMilliseconds(
      startA,
      endA,
      startB,
      endB
    ) / 60000
  );
}

function calculateOverlapMilliseconds(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): number {
  const start = Math.max(
    startA.getTime(),
    startB.getTime()
  );

  const end = Math.min(
    endA.getTime(),
    endB.getTime()
  );

  if (end <= start) {
    return 0;
  }

  return end - start;
}