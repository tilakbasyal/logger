export type PayrollScheduleType =
  | "calendar_month"
  | "monthly_cutoff";

export interface PayrollSchedule {
  id: string;
  employerId: string;

  type: PayrollScheduleType;

  /**
   * Used only when type === "monthly_cutoff".
   *
   * Example:
   * cutoffDay = 14
   * means the payroll period ends on the 14th
   * and the next period begins on the 15th.
   */
  cutoffDay?: number;

  effectiveFrom: string;
  effectiveTo?: string;

  createdAt: string;
  updatedAt: string;
}