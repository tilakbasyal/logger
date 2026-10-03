import type { ShiftPreset } from "../../domain/shift/shift-preset";
import { db } from "../database/db";
import { supabase } from "../supabase/client";

export interface ShiftPresetRepository {
  add(preset: ShiftPreset): Promise<void>;
  update(preset: ShiftPreset): Promise<void>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<ShiftPreset | undefined>;
  getAll(): Promise<ShiftPreset[]>;
  getByPerson(personId: string): Promise<ShiftPreset[]>;
}

export class DexieShiftPresetRepository
  implements ShiftPresetRepository
{
  async add(preset: ShiftPreset): Promise<void> {
    await db.shiftPresets.add(preset);
  }

  async update(preset: ShiftPreset): Promise<void> {
    await db.shiftPresets.put(preset);
  }

  async delete(id: string): Promise<void> {
    await db.shiftPresets.delete(id);
  }

  async getById(
    id: string,
  ): Promise<ShiftPreset | undefined> {
    return db.shiftPresets.get(id);
  }

  async getAll(): Promise<ShiftPreset[]> {
    return db.shiftPresets.toArray();
  }

  async getByPerson(
    personId: string,
  ): Promise<ShiftPreset[]> {
    return db.shiftPresets
      .where("personId")
      .equals(personId)
      .toArray();
  }
}

export class SupabaseShiftPresetRepository
  implements ShiftPresetRepository
{
  async add(preset: ShiftPreset): Promise<void> {
    const workspaceId = await this.getWorkspaceId();

    const { error } = await supabase
      .from("shift_presets")
      .insert({
        id: preset.id,
        workspace_id: workspaceId,
        person_id: preset.personId,
        work_location_id: preset.workLocationId,
        label: preset.label,
        start_time: preset.startTime,
        end_time: preset.endTime,
        is_active: preset.isActive,
        created_at: preset.createdAt,
        updated_at: preset.updatedAt,
      });

    if (error) {
      throw error;
    }
  }

  async update(preset: ShiftPreset): Promise<void> {
    const workspaceId = await this.getWorkspaceId();

    const { error } = await supabase
      .from("shift_presets")
      .update({
        person_id: preset.personId,
        work_location_id: preset.workLocationId,
        label: preset.label,
        start_time: preset.startTime,
        end_time: preset.endTime,
        is_active: preset.isActive,
        updated_at: preset.updatedAt,
      })
      .eq("id", preset.id)
      .eq("workspace_id", workspaceId);

    if (error) {
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const workspaceId = await this.getWorkspaceId();

    const { error } = await supabase
      .from("shift_presets")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (error) {
      throw error;
    }
  }

  async getById(
    id: string,
  ): Promise<ShiftPreset | undefined> {
    const workspaceId = await this.getWorkspaceId();

    const { data, error } = await supabase
      .from("shift_presets")
      .select(
        "id, person_id, work_location_id, label, start_time, end_time, is_active, created_at, updated_at",
      )
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? this.toDomain(data) : undefined;
  }

  async getAll(): Promise<ShiftPreset[]> {
    const workspaceId = await this.getWorkspaceId();

    const { data, error } = await supabase
      .from("shift_presets")
      .select(
        "id, person_id, work_location_id, label, start_time, end_time, is_active, created_at, updated_at",
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) =>
      this.toDomain(row),
    );
  }

  async getByPerson(
    personId: string,
  ): Promise<ShiftPreset[]> {
    const workspaceId = await this.getWorkspaceId();

    const { data, error } = await supabase
      .from("shift_presets")
      .select(
        "id, person_id, work_location_id, label, start_time, end_time, is_active, created_at, updated_at",
      )
      .eq("workspace_id", workspaceId)
      .eq("person_id", personId)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) =>
      this.toDomain(row),
    );
  }

  private toDomain(row: {
    id: string;
    person_id: string;
    work_location_id: string;
    label: string;
    start_time: string;
    end_time: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }): ShiftPreset {
    return {
      id: row.id,
      personId: row.person_id,
      workLocationId: row.work_location_id,
      label: row.label,
      startTime: row.start_time,
      endTime: row.end_time,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private async getWorkspaceId(): Promise<string> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error("Authentication required.");
    }

    const { data, error } = await supabase
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data?.workspace_id) {
      throw new Error(
        "No workspace found for the current user.",
      );
    }

    return data.workspace_id;
  }
}