import type { ShiftPreset } from "../../domain/shift/shift-preset";
import type { ShiftPresetRepository } from "../../infrastructure/repositories/shift-preset-repository";
import { createId } from "../../shared/id";
import { nowIso } from "../../shared/time";

export class ShiftPresetService {
  private readonly repository: ShiftPresetRepository;

  constructor(repository: ShiftPresetRepository) {
    this.repository = repository;
  }

  async createPreset(params: {
    personId: string;
    workLocationId: string;
    label: string;
    startTime: string;
    endTime: string;
  }): Promise<ShiftPreset> {
    const now = nowIso();

    const preset: ShiftPreset = {
      id: createId(),
      personId: params.personId,
      workLocationId: params.workLocationId,
      label: params.label,
      startTime: params.startTime,
      endTime: params.endTime,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.add(preset);

    return preset;
  }

  async updatePreset(
    preset: ShiftPreset,
  ): Promise<void> {
    await this.repository.update({
      ...preset,
      updatedAt: nowIso(),
    });
  }

  async deletePreset(
    id: string,
  ): Promise<void> {
    await this.repository.delete(id);
  }

  async getPreset(
    id: string,
  ): Promise<ShiftPreset | undefined> {
    return this.repository.getById(id);
  }

  async getAllPresets(): Promise<ShiftPreset[]> {
    return this.repository.getAll();
  }

  async getPersonPresets(
    personId: string,
  ): Promise<ShiftPreset[]> {
    const presets =
      await this.repository.getByPerson(
        personId,
      );

    return presets.filter(
      (preset) => preset.isActive,
    );
  }
}