import { db } from "../database/db";
import type { Person } from "../../domain/person/person";
import { supabase } from "../supabase/client";

export interface PersonRepository {
  add(person: Person): Promise<void>;
  update(person: Person): Promise<void>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<Person | undefined>;
  getAll(): Promise<Person[]>;
}

export class DexiePersonRepository implements PersonRepository {
  async add(person: Person): Promise<void> {
    await db.persons.add(person);
  }

  async update(person: Person): Promise<void> {
    await db.persons.put(person);
  }

  async delete(id: string): Promise<void> {
    await db.persons.delete(id);
  }

  async getById(id: string): Promise<Person | undefined> {
    return db.persons.get(id);
  }

  async getAll(): Promise<Person[]> {
    return db.persons.toArray();
  }
}

export class SupabasePersonRepository implements PersonRepository {
  async add(person: Person): Promise<void> {
    const { error } = await supabase.from("people").insert({
      id: person.id,
      workspace_id: await this.getWorkspaceId(),
      user_id: null,
      name: person.name,
      created_at: person.createdAt,
      updated_at: person.updatedAt,
    });

    if (error) {
      throw error;
    }
  }

  async update(person: Person): Promise<void> {
    const { error } = await supabase
      .from("people")
      .update({
        name: person.name,
        updated_at: person.updatedAt,
      })
      .eq("id", person.id)
      .eq("workspace_id", await this.getWorkspaceId());

    if (error) {
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("people")
      .delete()
      .eq("id", id)
      .eq("workspace_id", await this.getWorkspaceId());

    if (error) {
      throw error;
    }
  }

  async getById(id: string): Promise<Person | undefined> {
    const { data, error } = await supabase
      .from("people")
      .select("id, name, created_at, updated_at")
      .eq("id", id)
      .eq("workspace_id", await this.getWorkspaceId())
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
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async getAll(): Promise<Person[]> {
    const { data, error } = await supabase
      .from("people")
      .select("id, name, created_at, updated_at")
      .eq("workspace_id", await this.getWorkspaceId())
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    return data.map((person) => ({
      id: person.id,
      name: person.name,
      createdAt: person.created_at,
      updatedAt: person.updated_at,
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
