import type { PayrollSchedule } from "./payroll-schedule";

export interface PayrollPeriod {
  start: Date;
  end: Date;
}

/**
 * Returns the payroll period containing the supplied date.
 *
 * The end date is EXCLUSIVE.
 *
 * Example:
 *
 * COOR:
 * 15 Aug → 14 Sep
 *
 * is represented as:
 *
 * start = 15 Aug 00:00
 * end   = 15 Sep 00:00
 */
export function getPayrollPeriod(
  schedule: PayrollSchedule,
  date: Date,
): PayrollPeriod {
  if (schedule.type === "calendar_month") {
    return getCalendarMonthPeriod(date);
  }

  if (schedule.type === "monthly_cutoff") {
    return getMonthlyCutoffPeriod(
      schedule.cutoffDay!,
      date,
    );
  }

  throw new Error(
    `Unsupported payroll schedule: ${schedule.type}`,
  );
}

function getCalendarMonthPeriod(
  date: Date,
): PayrollPeriod {
  const start = new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
  );

  const end = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    1,
  );

  return { start, end };
}

function getMonthlyCutoffPeriod(
  cutoffDay: number,
  date: Date,
): PayrollPeriod {
  if (
    cutoffDay < 1 ||
    cutoffDay > 28
  ) {
    throw new Error(
      "Payroll cutoff day must be between 1 and 28.",
    );
  }

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  /*
   * Example cutoffDay = 14:
   *
   * day 1-14:
   * previous period started on 15th
   *
   * day 15-end:
   * current period started on 15th
   */

  if (day <= cutoffDay) {
    const start = new Date(
      year,
      month - 1,
      cutoffDay + 1,
    );

    const end = new Date(
      year,
      month,
      cutoffDay + 1,
    );

    return { start, end };
  }

  const start = new Date(
    year,
    month,
    cutoffDay + 1,
  );

  const end = new Date(
    year,
    month + 1,
    cutoffDay + 1,
  );

  return { start, end };
}