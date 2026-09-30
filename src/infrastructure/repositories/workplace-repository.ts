import { db } from "../database/db";
import type { Employer } from "../../domain/employer/employer";
import type { WorkLocation } from "../../domain/employer/work-location";
import { supabase } from "../supabase/client";

export interface EmployerRepository {
  add(employer: Employer): Promise<void>;
  update(employer: Employer): Promise<void>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<Employer | undefined>;
  getAll(): Promise<Employer[]>;
}

export class DexieEmployerRepository implements EmployerRepository {
  async add(employer: Employer): Promise<void> {
    await db.employers.add(employer);
  }

  async update(employer: Employer): Promise<void> {
    await db.employers.put(employer);
  }

  async delete(id: string): Promise<void> {
    await db.employers.delete(id);
  }

  async getById(id: string): Promise<Employer | undefined> {
    return db.employers.get(id);
  }

  async getAll(): Promise<Employer[]> {
    return db.employers.toArray();
  }
}

export interface WorkLocationRepository {
  add(location: WorkLocation): Promise<void>;
  update(location: WorkLocation): Promise<void>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<WorkLocation | undefined>;
  getByEmployer(employerId: string): Promise<WorkLocation[]>;
  getAll(): Promise<WorkLocation[]>;
}

export class DexieWorkLocationRepository implements WorkLocationRepository {
  async add(location: WorkLocation): Promise<void> {
    await db.workLocations.add(location);
  }

  async update(location: WorkLocation): Promise<void> {
    await db.workLocations.put(location);
  }

  async delete(id: string): Promise<void> {
    await db.workLocations.delete(id);
  }

  async getById(id: string): Promise<WorkLocation | undefined> {
    return db.workLocations.get(id);
  }

  async getByEmployer(employerId: string): Promise<WorkLocation[]> {
    return db.workLocations.where("employerId").equals(employerId).toArray();
  }

  async getAll(): Promise<WorkLocation[]> {
    return db.workLocations.toArray();
  }
}

export class SupabaseEmployerRepository implements EmployerRepository {
  async add(employer: Employer): Promise<void> {
    const workspaceId = await this.getWorkspaceId();

    const { error } = await supabase.from("employers").insert({
      id: employer.id,
      workspace_id: workspaceId,
      name: employer.name,
      is_active: employer.isActive,
      created_at: employer.createdAt,
      updated_at: employer.updatedAt,
    });

    if (error) {
      throw error;
    }
  }

  async update(employer: Employer): Promise<void> {
    const workspaceId = await this.getWorkspaceId();

    const { error } = await supabase
      .from("employers")
      .update({
        name: employer.name,
        is_active: employer.isActive,
        updated_at: employer.updatedAt,
      })
      .eq("id", employer.id)
      .eq("workspace_id", workspaceId);

    if (error) {
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const workspaceId = await this.getWorkspaceId();

    const { error } = await supabase
      .from("employers")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (error) {
      throw error;
    }
  }

  async getById(id: string): Promise<Employer | undefined> {
    const workspaceId = await this.getWorkspaceId();

    const { data, error } = await supabase
      .from("employers")
      .select("id, name, is_active, created_at, updated_at")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return undefined;
    }

    return {
      id: data.id,
      name: data.name,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async getAll(): Promise<Employer[]> {
    const workspaceId = await this.getWorkspaceId();

    const { data, error } = await supabase
      .from("employers")
      .select("id, name, is_active, created_at, updated_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    return data.map((employer) => ({
      id: employer.id,
      name: employer.name,
      isActive: employer.is_active,
      createdAt: employer.created_at,
      updatedAt: employer.updated_at,
    }));
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

export class SupabaseWorkLocationRepository implements WorkLocationRepository {
  async add(location: WorkLocation): Promise<void> {
    const workspaceId = await this.getWorkspaceId();

    const { error } = await supabase.from("work_locations").insert({
      id: location.id,
      workspace_id: workspaceId,
      employer_id: location.employerId,
      name: location.name,
      is_active: location.isActive,
      created_at: location.createdAt,
      updated_at: location.updatedAt,
    });

    if (error) {
      throw error;
    }
  }

  async update(location: WorkLocation): Promise<void> {
    const workspaceId = await this.getWorkspaceId();

    const { error } = await supabase
      .from("work_locations")
      .update({
        employer_id: location.employerId,
        name: location.name,
        is_active: location.isActive,
        updated_at: location.updatedAt,
      })
      .eq("id", location.id)
      .eq("workspace_id", workspaceId);

    if (error) {
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const workspaceId = await this.getWorkspaceId();

    const { error } = await supabase
      .from("work_locations")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (error) {
      throw error;
    }
  }

  async getById(id: string): Promise<WorkLocation | undefined> {
    const workspaceId = await this.getWorkspaceId();

    const { data, error } = await supabase
      .from("work_locations")
      .select("id, employer_id, name, is_active, created_at, updated_at")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return undefined;
    }

    return {
      id: data.id,
      employerId: data.employer_id,
      name: data.name,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async getByEmployer(employerId: string): Promise<WorkLocation[]> {
    const workspaceId = await this.getWorkspaceId();

    const { data, error } = await supabase
      .from("work_locations")
      .select("id, employer_id, name, is_active, created_at, updated_at")
      .eq("workspace_id", workspaceId)
      .eq("employer_id", employerId)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    return data.map((location) => ({
      id: location.id,
      employerId: location.employer_id,
      name: location.name,
      isActive: location.is_active,
      createdAt: location.created_at,
      updatedAt: location.updated_at,
    }));
  }

  async getAll(): Promise<WorkLocation[]> {
    const workspaceId = await this.getWorkspaceId();

    const { data, error } = await supabase
      .from("work_locations")
      .select("id, employer_id, name, is_active, created_at, updated_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    return data.map((location) => ({
      id: location.id,
      employerId: location.employer_id,
      name: location.name,
      isActive: location.is_active,
      createdAt: location.created_at,
      updatedAt: location.updated_at,
    }));
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
