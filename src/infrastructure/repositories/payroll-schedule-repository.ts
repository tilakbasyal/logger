import { db } from "../database/db";
import type { PayrollSchedule } from "../../domain/payroll/payroll-schedule";
import { supabase } from "../supabase/client";

export interface PayrollScheduleRepository {
  add(schedule: PayrollSchedule): Promise<void>;

  getByEmployer(employerId: string): Promise<PayrollSchedule | undefined>;

  getAll(): Promise<PayrollSchedule[]>;
}

export class DexiePayrollScheduleRepository implements PayrollScheduleRepository {
  async add(schedule: PayrollSchedule): Promise<void> {
    await db.payrollSchedules.add(schedule);
  }

  async getByEmployer(
    employerId: string,
  ): Promise<PayrollSchedule | undefined> {
    return db.payrollSchedules.where("employerId").equals(employerId).first();
  }

  async getAll(): Promise<PayrollSchedule[]> {
    return db.payrollSchedules.toArray();
  }
}

export class SupabasePayrollScheduleRepository implements PayrollScheduleRepository {
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
      throw new Error("No workspace found for the current user.");
    }

    return data.workspace_id;
  }

  async add(schedule: PayrollSchedule): Promise<void> {
    const workspaceId = await this.getWorkspaceId();

    const { error } = await supabase.from("payroll_schedules").insert({
      id: schedule.id,
      workspace_id: workspaceId,
      employer_id: schedule.employerId,
      type: schedule.type,
      cutoff_day: schedule.cutoffDay ?? null,
      effective_from: schedule.effectiveFrom,
      effective_to: schedule.effectiveTo ?? null,
      created_at: schedule.createdAt,
      updated_at: schedule.updatedAt,
    });

    if (error) {
      throw error;
    }
  }

  async update(schedule: PayrollSchedule): Promise<void> {
    const workspaceId = await this.getWorkspaceId();

    const { error } = await supabase
      .from("payroll_schedules")
      .update({
        employer_id: schedule.employerId,
        type: schedule.type,
        cutoff_day: schedule.cutoffDay ?? null,
        effective_from: schedule.effectiveFrom,
        effective_to: schedule.effectiveTo ?? null,
        updated_at: schedule.updatedAt,
      })
      .eq("id", schedule.id)
      .eq("workspace_id", workspaceId);

    if (error) {
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const workspaceId = await this.getWorkspaceId();

    const { error } = await supabase
      .from("payroll_schedules")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (error) {
      throw error;
    }
  }

  async getById(id: string): Promise<PayrollSchedule | undefined> {
    const workspaceId = await this.getWorkspaceId();

    const { data, error } = await supabase
      .from("payroll_schedules")
      .select(
        "id, employer_id, type, cutoff_day, effective_from, effective_to, created_at, updated_at",
      )
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? this.toDomain(data) : undefined;
  }

  async getAll(): Promise<PayrollSchedule[]> {
    const workspaceId = await this.getWorkspaceId();

    const { data, error } = await supabase
      .from("payroll_schedules")
      .select(
        "id, employer_id, type, cutoff_day, effective_from, effective_to, created_at, updated_at",
      )
      .eq("workspace_id", workspaceId)
      .order("effective_from", {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => this.toDomain(row));
  }

  async getByEmployer(
    employerId: string,
  ): Promise<PayrollSchedule | undefined> {
    const workspaceId = await this.getWorkspaceId();

    const { data, error } = await supabase
      .from("payroll_schedules")
      .select(
        "id, employer_id, type, cutoff_day, effective_from, effective_to, created_at, updated_at",
      )
      .eq("workspace_id", workspaceId)
      .eq("employer_id", employerId)
      .order("effective_from", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? this.toDomain(data) : undefined;
  }

  private toDomain(row: {
    id: string;
    employer_id: string;
    type: PayrollSchedule["type"];
    cutoff_day: number | null;
    effective_from: string;
    effective_to: string | null;
    created_at: string;
    updated_at: string;
  }): PayrollSchedule {
    return {
      id: row.id,
      employerId: row.employer_id,
      type: row.type,
      cutoffDay: row.cutoff_day ?? undefined,
      effectiveFrom: row.effective_from,
      effectiveTo: row.effective_to ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
