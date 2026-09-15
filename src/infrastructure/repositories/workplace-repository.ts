import { db } from "../database/db";
import type { Employer } from "../../domain/employer/employer";
import type { WorkLocation } from "../../domain/employer/work-location";

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

export class DexieWorkLocationRepository
  implements WorkLocationRepository
{
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
    return db.workLocations
      .where("employerId")
      .equals(employerId)
      .toArray();
  }

  async getAll(): Promise<WorkLocation[]> {
    return db.workLocations.toArray();
  }
}