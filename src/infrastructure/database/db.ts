import Dexie, { type Table } from "dexie";

import type { Person } from "../../domain/person/person";
import type { Employer } from "../../domain/employer/employer";
import type { WorkLocation } from "../../domain/employer/work-location";
import type { Shift } from "../../domain/shift/shift";
import type { ShiftPreset } from "../../domain/shift/shift-preset";
import type { WorkPolicy } from "../../domain/work-policy/work-policy";
import type { PayrollSchedule } from "../../domain/payroll/payroll-schedule";

export class WorkHoursDatabase extends Dexie {
  persons!: Table<Person, string>;
  employers!: Table<Employer, string>;
  workLocations!: Table<WorkLocation, string>;
  shifts!: Table<Shift, string>;
  shiftPresets!: Table<ShiftPreset, string>;
  workPolicies!: Table<WorkPolicy, string>;
  payrollSchedules!: Table<PayrollSchedule, string>;

  constructor() {
    super("WorkHoursDatabase");

    this.version(1).stores({
      persons: "id, name",

      employers: "id, name, isActive",

      workLocations:
        "id, employerId, name, isActive, [employerId+name]",

      shifts:
        "id, personId, workLocationId, startAt, [personId+startAt], [workLocationId+startAt]",

      shiftPresets:
        "id, personId, workLocationId, isActive",

      workPolicies:
        "id, personId, periodType, effectiveFrom",

      payrollSchedules:
        "id, employerId, type, effectiveFrom",
    });
  }
}

export const db = new WorkHoursDatabase();