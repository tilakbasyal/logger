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
    const shifts =
      await this.shiftRepository.getByPerson(
        personId,
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
    const shifts =
      await this.shiftRepository.getByPerson(
        policy.personId,
      );

    return evaluateMonthlyWorkLimit(
      shifts,
      policy,
      year,
      month,
    );
  }
}