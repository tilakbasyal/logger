export type WorkPolicyPeriodType =
  | "calendar_month";

export interface WorkPolicy {
  id: string;
  personId: string;

  periodType: WorkPolicyPeriodType;

  /**
   * Maximum allowed working time in minutes.
   *
   * Example:
   * 90 hours = 5400 minutes.
   */
  maxMinutes: number;

  effectiveFrom: string;
  effectiveTo?: string;

  createdAt: string;
  updatedAt: string;
}