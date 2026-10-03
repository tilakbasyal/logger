import { SupabasePersonRepository } from "../infrastructure/repositories/person-repository";

import {
  SupabaseEmployerRepository,
  SupabaseWorkLocationRepository,
} from "../infrastructure/repositories/workplace-repository";

import { SupabaseShiftRepository } from "../infrastructure/repositories/shift-repository";

import { SupabaseWorkPolicyRepository } from "../infrastructure/repositories/work-policy-repository";

import { SupabasePayrollScheduleRepository } from "../infrastructure/repositories/payroll-schedule-repository";
import { SupabaseShiftPresetRepository } from "../infrastructure/repositories/shift-preset-repository";

const dashboardPersonRepository = new SupabasePersonRepository();

const dashboardEmployerRepository = new SupabaseEmployerRepository();

const dashboardWorkLocationRepository = new SupabaseWorkLocationRepository();

const dashboardShiftRepository = new SupabaseShiftRepository();

const dashboardWorkPolicyRepository = new SupabaseWorkPolicyRepository();

const dashboardPayrollScheduleRepository =
  new SupabasePayrollScheduleRepository();

import { ShiftService } from "./shifts/shift-service";
import { HoursService } from "./hours/hours-service";
import { ConfigurationService } from "./configuration-service";

import { ShiftHistoryService } from "./shifts/shift-history-service";
import { DashboardService } from "./dashboard/dashboard-service";

import { ShiftPresetService } from "./shifts/shift-preset-service";


const shiftRepository = new SupabaseShiftRepository();
const shiftPresetRepository =new SupabaseShiftPresetRepository();
export const shiftService = new ShiftService(shiftRepository);
export const hoursService = new HoursService(shiftRepository);

export const configurationService = new ConfigurationService(
  dashboardPersonRepository,
  dashboardEmployerRepository,
  dashboardWorkLocationRepository,
);

export const shiftHistoryService = new ShiftHistoryService(
  shiftRepository,
  dashboardPersonRepository,
  dashboardEmployerRepository,
  dashboardWorkLocationRepository,
);

export const dashboardService = new DashboardService(
  dashboardPersonRepository,
  dashboardEmployerRepository,
  dashboardWorkLocationRepository,
  dashboardShiftRepository,
  dashboardWorkPolicyRepository,
  dashboardPayrollScheduleRepository,
);

export const shiftPresetService = new ShiftPresetService(shiftPresetRepository);
