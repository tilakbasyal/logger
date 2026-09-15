import { db } from "../database/db";
import type { Person } from "../../domain/person/person";

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