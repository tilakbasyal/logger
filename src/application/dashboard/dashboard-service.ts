import type { Employer } from "../../domain/employer/employer";
import type { WorkLocation } from "../../domain/employer/work-location";
import type { Person } from "../../domain/person/person";
import type { Shift } from "../../domain/shift/shift";
// import type { WorkPolicy } from "../../domain/work-policy/work-policy";
import type { PayrollSchedule } from "../../domain/payroll/payroll-schedule";

import { db } from "../../infrastructure/database/db";

import { calculateMonthlyMinutes } from "../hours/monthly-hours";
import { calculatePayrollMinutes } from "../hours/payroll-hours";
import { evaluateMonthlyWorkLimit } from "../hours/work-policy-evaluator";

import { getPayrollPeriod } from "../../domain/payroll/payroll-period";

export interface LocationHours {
  locationId: string;
  locationName: string;
  minutes: number;
}

export interface EmployerHours {
  employerId: string;
  employerName: string;
  minutes: number;
  locations: LocationHours[];
}

export interface PayrollLocationHours {
  locationId: string;
  locationName: string;
  minutes: number;
}

export interface PayrollEmployerHours {
  employerId: string;
  employerName: string;
  periodStart: string;
  periodEnd: string;
  minutes: number;
  locations: PayrollLocationHours[];
}

export interface PersonDashboard {
  person: Person;
  monthlyMinutes: number;
  employerHours: EmployerHours[];
  payrollEmployerHours: PayrollEmployerHours[];
  limit?: {
    workedMinutes: number;
    maxMinutes: number;
    remainingMinutes: number;
    exceeded: boolean;
  };
}

export interface DashboardData {
  year: number;
  month: number;
  people: PersonDashboard[];
}

export class DashboardService {
  async getDashboardData(
    year: number,
    month: number,
    referenceDate: Date = new Date(),
  ): Promise<DashboardData> {
    const [
      people,
      employers,
      locations,
      shifts,
      policies,
      payrollSchedules,
    ] = await Promise.all([
      db.persons.toArray(),
      db.employers.toArray(),
      db.workLocations.toArray(),
      db.shifts.toArray(),
      db.workPolicies.toArray(),
      db.payrollSchedules.toArray(),
    ]);

    const result: PersonDashboard[] = people.map((person) => {
      const personShifts = shifts.filter(
        (shift) => shift.personId === person.id,
      );

      const monthlyMinutes = calculateMonthlyMinutes(
        personShifts,
        person.id,
        year,
        month,
      );

      const employerHours = this.calculateEmployerHours(
        personShifts,
        locations,
        employers,
        year,
        month,
      );

      const payrollEmployerHours =
        this.calculatePayrollEmployerHours(
          person.id,
          personShifts,
          locations,
          employers,
          payrollSchedules,
          referenceDate,
        );

      const policy = policies
        .filter(
          (item) =>
            item.personId === person.id &&
            new Date(item.effectiveFrom) <=
              new Date(year, month - 1, 1),
        )
        .sort(
          (a, b) =>
            new Date(b.effectiveFrom).getTime() -
            new Date(a.effectiveFrom).getTime(),
        )[0];

      let limit: PersonDashboard["limit"];

      if (policy) {
        const workLimitStatus =
          evaluateMonthlyWorkLimit(
            personShifts,
            policy,
            year,
            month,
          );

        limit = workLimitStatus;
      }

      return {
        person,
        monthlyMinutes,
        employerHours,
        payrollEmployerHours,
        limit,
      };
    });

    return {
      year,
      month,
      people: result,
    };
  }

  private calculateEmployerHours(
    personShifts: Shift[],
    locations: WorkLocation[],
    employers: Employer[],
    year: number,
    month: number,
  ): EmployerHours[] {
    const result = new Map<string, EmployerHours>();

    for (const shift of personShifts) {
      const location = locations.find(
        (item) => item.id === shift.workLocationId,
      );

      if (!location) {
        continue;
      }

      const employer = employers.find(
        (item) => item.id === location.employerId,
      );

      if (!employer) {
        continue;
      }

      if (!result.has(employer.id)) {
        result.set(employer.id, {
          employerId: employer.id,
          employerName: employer.name,
          minutes: 0,
          locations: [],
        });
      }

      const employerResult = result.get(employer.id)!;

      const shiftStart = new Date(shift.startAt);
      const shiftEnd = new Date(shift.endAt);

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

      const overlapStart = Math.max(
        shiftStart.getTime(),
        monthStart.getTime(),
      );

      const overlapEnd = Math.min(
        shiftEnd.getTime(),
        nextMonthStart.getTime(),
      );

      if (overlapEnd <= overlapStart) {
        continue;
      }

      const minutes = Math.round(
        (overlapEnd - overlapStart) / 60000,
      );

      employerResult.minutes += minutes;

      let locationResult =
        employerResult.locations.find(
          (item) =>
            item.locationId === location.id,
        );

      if (!locationResult) {
        locationResult = {
          locationId: location.id,
          locationName: location.name,
          minutes: 0,
        };

        employerResult.locations.push(
          locationResult,
        );
      }

      locationResult.minutes += minutes;
    }

    return Array.from(result.values()).map(
      (employer) => ({
        ...employer,
        locations: employer.locations.sort(
          (a, b) => b.minutes - a.minutes,
        ),
      }),
    );
  }

  private calculatePayrollEmployerHours(
    personId: string,
    personShifts: Shift[],
    locations: WorkLocation[],
    employers: Employer[],
    payrollSchedules: PayrollSchedule[],
    referenceDate: Date,
  ): PayrollEmployerHours[] {
    const result: PayrollEmployerHours[] = [];

    for (const employer of employers) {
      const schedule = payrollSchedules
        .filter(
          (item) =>
            item.employerId === employer.id,
        )
        .filter(
          (item) =>
            new Date(item.effectiveFrom) <=
            referenceDate,
        )
        .sort(
          (a, b) =>
            new Date(b.effectiveFrom).getTime() -
            new Date(a.effectiveFrom).getTime(),
        )[0];

      if (!schedule) {
        continue;
      }

      const period = getPayrollPeriod(
        schedule,
        referenceDate,
      );

      const employerShifts = personShifts.filter(
        (shift) => {
          const location = locations.find(
            (item) =>
              item.id === shift.workLocationId,
          );

          return (
            location?.employerId === employer.id
          );
        },
      );

      const minutes = calculatePayrollMinutes(
        employerShifts,
        personId,
        schedule,
        referenceDate,
      );

      const locationHours: PayrollLocationHours[] =
        [];

      for (const location of locations) {
        if (
          location.employerId !==
          employer.id
        ) {
          continue;
        }

        const locationShifts =
          employerShifts.filter(
            (shift) =>
              shift.workLocationId ===
              location.id,
          );

        const locationMinutes =
          calculatePayrollMinutes(
            locationShifts,
            personId,
            schedule,
            referenceDate,
          );

        if (locationMinutes > 0) {
          locationHours.push({
            locationId: location.id,
            locationName: location.name,
            minutes: locationMinutes,
          });
        }
      }

      if (minutes > 0) {
        result.push({
          employerId: employer.id,
          employerName: employer.name,
          periodStart:
            period.start.toISOString(),
          periodEnd:
            period.end.toISOString(),
          minutes,
          locations: locationHours.sort(
            (a, b) => b.minutes - a.minutes,
          ),
        });
      }
    }

    return result;
  }
}