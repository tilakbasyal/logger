import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculatePayrollMinutes,
} from "./payroll-hours";

import type { Shift } from "../../domain/shift/shift";
import type { PayrollSchedule } from "../../domain/payroll/payroll-schedule";

describe("Payroll hours", () => {
  const coorSchedule: PayrollSchedule = {
    id: "coor",
    employerId: "coor",
    type: "monthly_cutoff",
    cutoffDay: 14,
    effectiveFrom: "2026-01-01",
    createdAt: "",
    updatedAt: "",
  };

  it("splits a shift correctly across the COOR payroll boundary", () => {
    const shifts: Shift[] = [
      {
        id: "overnight",
        personId: "me",
        workLocationId: "tv2",
        startAt: "2026-09-14T22:00",
        endAt: "2026-09-15T02:00",
        createdAt: "",
        updatedAt: "",
      },
    ];

    /*
     * COOR payroll period ending on September 15:
     *
     * 15 Aug → 15 Sep
     *
     * The shift is:
     *
     * Sep 14 23:00 → Sep 15 03:00
     *
     * Only the first 2 hours belong
     * to this payroll period.
     */

    const previousPeriodMinutes =
      calculatePayrollMinutes(
        shifts,
        "me",
        coorSchedule,
        new Date(2026, 8, 14),
      );

    expect(previousPeriodMinutes).toBe(
      2 * 60,
    );

    /*
     * COOR payroll period starting on September 15:
     *
     * 15 Sep → 15 Oct
     *
     * The remaining 2 hours belong
     * to this payroll period.
     */

    const nextPeriodMinutes =
      calculatePayrollMinutes(
        shifts,
        "me",
        coorSchedule,
        new Date(2026, 8, 15),
      );

    expect(nextPeriodMinutes).toBe(
      2 * 60,
    );
  });
});