export interface ShiftPreset {
  id: string;

  personId: string;
  workLocationId: string;

  label: string;

  startTime: string;
  endTime: string;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}