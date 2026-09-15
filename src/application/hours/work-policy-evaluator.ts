import type { Shift } from "../../domain/shift/shift";
import type { WorkPolicy } from "../../domain/work-policy/work-policy";
import { calculateMonthlyMinutes } from "./monthly-hours";

export interface WorkLimitStatus {
  workedMinutes: number;
  maxMinutes: number;
  remainingMinutes: number;
  exceeded: boolean;
}

export function evaluateMonthlyWorkLimit(
  shifts: Shift[],
  policy: WorkPolicy,
  year: number,
  month: number,
): WorkLimitStatus {
  const workedMinutes = calculateMonthlyMinutes(
    shifts,
    policy.personId,
    year,
    month,
  );

  const remainingMinutes = Math.max(
    policy.maxMinutes - workedMinutes,
    0,
  );

  return {
    workedMinutes,
    maxMinutes: policy.maxMinutes,
    remainingMinutes,
    exceeded:
      workedMinutes > policy.maxMinutes,
  };
}