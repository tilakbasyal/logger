import { describe, expect, it } from "vitest";
import {
  getPayrollPeriod,
} from "./payroll-period";
import type { PayrollSchedule } from "./payroll-schedule";

describe("getPayrollPeriod", () => {
  const coorSchedule: PayrollSchedule = {
    id: "coor",
    employerId: "coor",
    type: "monthly_cutoff",
    cutoffDay: 14,
    effectiveFrom: "2026-01-01",
    createdAt: "",
    updatedAt: "",
  };

  const qfsSchedule: PayrollSchedule = {
    id: "qfs",
    employerId: "qfs",
    type: "calendar_month",
    effectiveFrom: "2026-01-01",
    createdAt: "",
    updatedAt: "",
  };

  it("calculates COOR period when date is after cutoff", () => {
    const period = getPayrollPeriod(
      coorSchedule,
      new Date(2026, 8, 20),
    );

    expect(period.start).toEqual(
      new Date(2026, 8, 15),
    );

    expect(period.end).toEqual(
      new Date(2026, 9, 15),
    );
  });

  it("calculates COOR period when date is before cutoff", () => {
    const period = getPayrollPeriod(
      coorSchedule,
      new Date(2026, 8, 10),
    );

    expect(period.start).toEqual(
      new Date(2026, 7, 15),
    );

    expect(period.end).toEqual(
      new Date(2026, 8, 15),
    );
  });

  it("calculates QFS calendar month", () => {
    const period = getPayrollPeriod(
      qfsSchedule,
      new Date(2026, 8, 20),
    );

    expect(period.start).toEqual(
      new Date(2026, 8, 1),
    );

    expect(period.end).toEqual(
      new Date(2026, 9, 1),
    );
  });
});