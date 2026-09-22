import type { WorkPolicy } from "../../domain/work-policy/work-policy";

import {
  calculateMonthlyMinutes,
} from "./monthly-hours";

import {
  evaluateMonthlyWorkLimit,
} from "./work-policy-evaluator";

import type { ShiftRepository } from "../../infrastructure/repositories/shift-repository";

export class HoursService {
    private readonly shiftRepository: ShiftRepository;
    
    constructor(
    shiftRepository: ShiftRepository,
    ) {
    this.shiftRepository = shiftRepository;
    }

  async getMonthlyMinutes(
  personId: string,
  year: number,
  month: number,
): Promise<number> {
  const monthStart = new Date(
    year,
    month - 1,
    1,
  );

  const nextMonthStart = new Date(
    year,
    month,
    1,
  );

  const shifts =
    await this.shiftRepository
      .getByPersonAndDateRange(
        personId,
        monthStart.toISOString(),
        nextMonthStart.toISOString(),
      );

  return calculateMonthlyMinutes(
    shifts,
    personId,
    year,
    month,
  );
}

  async getWorkLimitStatus(
  policy: WorkPolicy,
  year: number,
  month: number,
) {
  const monthStart = new Date(
    year,
    month - 1,
    1,
  );

  const nextMonthStart = new Date(
    year,
    month,
    1,
  );

  const shifts =
    await this.shiftRepository
      .getByPersonAndDateRange(
        policy.personId,
        monthStart.toISOString(),
        nextMonthStart.toISOString(),
      );

  return evaluateMonthlyWorkLimit(
    shifts,
    policy,
    year,
    month,
  );
}
}