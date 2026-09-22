import { ShiftService } from "./shifts/shift-service";
import { HoursService } from "./hours/hours-service";
import { ConfigurationService } from "./configuration-service";

import {ShiftHistoryService} from "./shifts/shift-history-service";
import {DashboardService} from "./dashboard/dashboard-service";

import {DexieShiftPresetRepository} from "../infrastructure/repositories/shift-preset-repository";
import {ShiftPresetService} from "./shifts/shift-preset-service";

import { DexieShiftRepository } from "../infrastructure/repositories/shift-repository";

const shiftRepository = new DexieShiftRepository();
const shiftPresetRepository = new DexieShiftPresetRepository();

export const shiftService = new ShiftService(shiftRepository);

export const hoursService = new HoursService(shiftRepository);

export const configurationService = new ConfigurationService();

export const shiftHistoryService = new ShiftHistoryService();

export const dashboardService = new DashboardService();

export const shiftPresetService = new ShiftPresetService(shiftPresetRepository);