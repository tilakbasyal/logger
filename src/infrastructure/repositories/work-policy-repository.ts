import { db } from "../database/db";
import type { WorkPolicy } from "../../domain/work-policy/work-policy";
import { supabase } from "../supabase/client";

export interface WorkPolicyRepository {
  add(policy: WorkPolicy): Promise<void>;
  getByPerson(personId: string): Promise<WorkPolicy | undefined>;
  getAll(): Promise<WorkPolicy[]>;
}

export class DexieWorkPolicyRepository implements WorkPolicyRepository {
  async add(policy: WorkPolicy): Promise<void> {
    await db.workPolicies.add(policy);
  }

  async getByPerson(personId: string): Promise<WorkPolicy | undefined> {
    return db.workPolicies.where("personId").equals(personId).first();
  }

  async getAll(): Promise<WorkPolicy[]> {
    return db.workPolicies.toArray();
  }
}

export class SupabaseWorkPolicyRepository implements WorkPolicyRepository {
  async add(policy: WorkPolicy): Promise<void> {
    const workspaceId = await this.getWorkspaceId();

    const { error } = await supabase.from("work_policies").insert({
      id: policy.id,
      workspace_id: workspaceId,
      person_id: policy.personId,
      period_type: policy.periodType,
      max_minutes: policy.maxMinutes,
      effective_from: policy.effectiveFrom,
      effective_to: policy.effectiveTo ?? null,
      created_at: policy.createdAt,
      updated_at: policy.updatedAt,
    });

    if (error) {
      throw error;
    }
  }

  async update(policy: WorkPolicy): Promise<void> {
    const workspaceId = await this.getWorkspaceId();

    const { error } = await supabase
      .from("work_policies")
      .update({
        person_id: policy.personId,
        period_type: policy.periodType,
        max_minutes: policy.maxMinutes,
        effective_from: policy.effectiveFrom,
        effective_to: policy.effectiveTo ?? null,
        updated_at: policy.updatedAt,
      })
      .eq("id", policy.id)
      .eq("workspace_id", workspaceId);

    if (error) {
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const workspaceId = await this.getWorkspaceId();

    const { error } = await supabase
      .from("work_policies")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (error) {
      throw error;
    }
  }

  async getById(id: string): Promise<WorkPolicy | undefined> {
    const workspaceId = await this.getWorkspaceId();

    const { data, error } = await supabase
      .from("work_policies")
      .select(
        "id, person_id, period_type, max_minutes, effective_from, effective_to, created_at, updated_at",
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

  async getAll(): Promise<WorkPolicy[]> {
    const workspaceId = await this.getWorkspaceId();

    const { data, error } = await supabase
      .from("work_policies")
      .select(
        "id, person_id, period_type, max_minutes, effective_from, effective_to, created_at, updated_at",
      )
      .eq("workspace_id", workspaceId)
      .order("effective_from", {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    return data.map((policy) => this.toDomain(policy));
  }

  async getByPerson(personId: string): Promise<WorkPolicy | undefined> {
    const workspaceId = await this.getWorkspaceId();

    const { data, error } = await supabase
      .from("work_policies")
      .select(
        "id, person_id, period_type, max_minutes, effective_from, effective_to, created_at, updated_at",
      )
      .eq("workspace_id", workspaceId)
      .eq("person_id", personId)
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

  private toDomain(data: {
    id: string;
    person_id: string;
    period_type: WorkPolicy["periodType"];
    max_minutes: number;
    effective_from: string;
    effective_to: string | null;
    created_at: string;
    updated_at: string;
  }): WorkPolicy {
    return {
      id: data.id,
      personId: data.person_id,
      periodType: data.period_type,
      maxMinutes: data.max_minutes,
      effectiveFrom: data.effective_from,
      ...(data.effective_to
        ? {
            effectiveTo: data.effective_to,
          }
        : {}),
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
