import type { Shift } from "../../domain/shift/shift";
import type { PayrollSchedule } from "../../domain/payroll/payroll-schedule";
import {
  getPayrollPeriod,
} from "../../domain/payroll/payroll-period";
import {
  parseLocalDateTime,
} from "../../domain/time/time-utils";

export function calculatePayrollMinutes(
  shifts: Shift[],
  personId: string,
  schedule: PayrollSchedule,
  referenceDate: Date,
): number {
  const period = getPayrollPeriod(
    schedule,
    referenceDate,
  );

  let totalMinutes = 0;

  for (const shift of shifts) {
    if (shift.personId !== personId) {
      continue;
    }

    const shiftStart = parseLocalDateTime(
      shift.startAt,
    );

    const shiftEnd = parseLocalDateTime(
      shift.endAt,
    );

    totalMinutes += calculateOverlapMinutes(
      shiftStart,
      shiftEnd,
      period.start,
      period.end,
    );
  }

  return totalMinutes;
}

function calculateOverlapMinutes(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): number {
  const start = Math.max(
    startA.getTime(),
    startB.getTime(),
  );

  const end = Math.min(
    endA.getTime(),
    endB.getTime(),
  );

  if (end <= start) {
    return 0;
  }

  return Math.round(
    (end - start) / 60000,
  );
}