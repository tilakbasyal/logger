import { db } from "../database/db";
import type { PayrollSchedule } from "../../domain/payroll/payroll-schedule";

export interface PayrollScheduleRepository {
  add(
    schedule: PayrollSchedule,
  ): Promise<void>;

  getByEmployer(
    employerId: string,
  ): Promise<PayrollSchedule | undefined>;

  getAll(): Promise<PayrollSchedule[]>;
}

export class DexiePayrollScheduleRepository
  implements PayrollScheduleRepository
{
  async add(
    schedule: PayrollSchedule,
  ): Promise<void> {
    await db.payrollSchedules.add(
      schedule,
    );
  }

  async getByEmployer(
    employerId: string,
  ): Promise<PayrollSchedule | undefined> {
    return db.payrollSchedules
      .where("employerId")
      .equals(employerId)
      .first();
  }

  async getAll(): Promise<PayrollSchedule[]> {
    return db.payrollSchedules.toArray();
  }
}