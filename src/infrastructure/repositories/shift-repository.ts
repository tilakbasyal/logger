import { db } from "../database/db";
import type { Shift } from "../../domain/shift/shift";
import { supabase } from "../supabase/client";

export interface ShiftRepository {
  add(shift: Shift): Promise<void>;
  update(shift: Shift): Promise<void>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<Shift | undefined>;
  getAll(): Promise<Shift[]>;
  getByPerson(personId: string): Promise<Shift[]>;
  getByPersonAndDateRange(
    personId: string,
    from: string,
    to: string,
  ): Promise<Shift[]>;
}

export class DexieShiftRepository implements ShiftRepository {
  async add(shift: Shift): Promise<void> {
    await db.shifts.add(shift);
  }

  async update(shift: Shift): Promise<void> {
    await db.shifts.put(shift);
  }

  async delete(id: string): Promise<void> {
    await db.shifts.delete(id);
  }

  async getById(id: string): Promise<Shift | undefined> {
    return db.shifts.get(id);
  }

  async getAll(): Promise<Shift[]> {
    return db.shifts.toArray();
  }

  async getByPerson(personId: string): Promise<Shift[]> {
    return db.shifts.where("personId").equals(personId).toArray();
  }

  async getByPersonAndDateRange(
    personId: string,
    from: string,
    to: string,
  ): Promise<Shift[]> {
    const shifts = await db.shifts.where("personId").equals(personId).toArray();

    const rangeStart = new Date(from);
    const rangeEnd = new Date(to);

    return shifts.filter((shift) => {
      const shiftStart = new Date(shift.startAt);

      const shiftEnd = new Date(shift.endAt);

      /*
       * Two time intervals overlap when:
       *
       * shiftStart < rangeEnd
       * AND
       * shiftEnd > rangeStart
       */

      return shiftStart < rangeEnd && shiftEnd > rangeStart;
    });
  }
}

export class SupabaseShiftRepository implements ShiftRepository {
  async add(shift: Shift): Promise<void> {
    const workspaceId = await this.getWorkspaceId();

    const { error } = await supabase.from("shifts").insert({
      id: shift.id,
      workspace_id: workspaceId,
      person_id: shift.personId,
      work_location_id: shift.workLocationId,
      start_at: shift.startAt,
      end_at: shift.endAt,
      created_at: shift.createdAt,
      updated_at: shift.updatedAt,
    });

    if (error) {
      throw error;
    }
  }

  async update(shift: Shift): Promise<void> {
    const workspaceId = await this.getWorkspaceId();

    const { error } = await supabase
      .from("shifts")
      .update({
        person_id: shift.personId,
        work_location_id: shift.workLocationId,
        start_at: shift.startAt,
        end_at: shift.endAt,
        updated_at: shift.updatedAt,
      })
      .eq("id", shift.id)
      .eq("workspace_id", workspaceId);

    if (error) {
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const workspaceId = await this.getWorkspaceId();

    const { error } = await supabase
      .from("shifts")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (error) {
      throw error;
    }
  }

  async getById(id: string): Promise<Shift | undefined> {
    const workspaceId = await this.getWorkspaceId();

    const { data, error } = await supabase
      .from("shifts")
      .select(
        "id, person_id, work_location_id, start_at, end_at, created_at, updated_at",
      )
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return undefined;
    }

    return this.toDomain(data);
  }

  async getAll(): Promise<Shift[]> {
    const workspaceId = await this.getWorkspaceId();

    const { data, error } = await supabase
      .from("shifts")
      .select(
        "id, person_id, work_location_id, start_at, end_at, created_at, updated_at",
      )
      .eq("workspace_id", workspaceId)
      .order("start_at", {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    return data.map((shift) => this.toDomain(shift));
  }

  async getByPerson(personId: string): Promise<Shift[]> {
    const workspaceId = await this.getWorkspaceId();

    const { data, error } = await supabase
      .from("shifts")
      .select(
        "id, person_id, work_location_id, start_at, end_at, created_at, updated_at",
      )
      .eq("workspace_id", workspaceId)
      .eq("person_id", personId)
      .order("start_at", {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    return data.map((shift) => this.toDomain(shift));
  }

  async getByPersonAndDateRange(
    personId: string,
    from: string,
    to: string,
  ): Promise<Shift[]> {
    const workspaceId = await this.getWorkspaceId();

    const { data, error } = await supabase
      .from("shifts")
      .select(
        "id, person_id, work_location_id, start_at, end_at, created_at, updated_at",
      )
      .eq("workspace_id", workspaceId)
      .eq("person_id", personId)
      .lt("start_at", to)
      .gt("end_at", from)
      .order("start_at", {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    return data.map((shift) => this.toDomain(shift));
  }

  private toDomain(data: {
    id: string;
    person_id: string;
    work_location_id: string;
    start_at: string;
    end_at: string;
    created_at: string;
    updated_at: string;
  }): Shift {
    return {
      id: data.id,
      personId: data.person_id,
      workLocationId: data.work_location_id,
      startAt: data.start_at,
      endAt: data.end_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
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

    if (!data) {
      throw new Error("No workspace found for the current user.");
    }

    return data.workspace_id;
  }
}
