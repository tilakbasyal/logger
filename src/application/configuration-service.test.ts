import { describe, expect, it, vi } from "vitest";

import { ConfigurationService } from "./configuration-service";

import type { Person } from "../domain/person/person";
import type { WorkPolicy } from "../domain/work-policy/work-policy";
import type { PersonRepository } from "../infrastructure/repositories/person-repository";
import type { WorkPolicyRepository } from "../infrastructure/repositories/work-policy-repository";
import type {
  EmployerRepository,
  WorkLocationRepository,
} from "../infrastructure/repositories/workplace-repository";

class FakePersonRepository implements PersonRepository {
  people: Person[] = [];

  async add(person: Person): Promise<void> {
    this.people.push(person);
  }

  async update(person: Person): Promise<void> {
    this.people = this.people.map((item) =>
      item.id === person.id ? person : item,
    );
  }

  async delete(id: string): Promise<void> {
    this.people = this.people.filter((person) => person.id !== id);
  }

  async getById(id: string): Promise<Person | undefined> {
    return this.people.find((person) => person.id === id);
  }

  async getAll(): Promise<Person[]> {
    return this.people;
  }
}

class FakeWorkPolicyRepository implements WorkPolicyRepository {
  policies: WorkPolicy[] = [];

  async add(policy: WorkPolicy): Promise<void> {
    this.policies.push(policy);
  }

  async getByPerson(personId: string): Promise<WorkPolicy | undefined> {
    return this.policies.find((policy) => policy.personId === personId);
  }

  async getAll(): Promise<WorkPolicy[]> {
    return this.policies;
  }
}

function createService() {
  const personRepository = new FakePersonRepository();
  const workPolicyRepository = new FakeWorkPolicyRepository();

  const service = new ConfigurationService(
    personRepository,
    {} as EmployerRepository,
    {} as WorkLocationRepository,
    workPolicyRepository,
  );

  return { service, personRepository, workPolicyRepository };
}

describe("ConfigurationService.addPerson", () => {
  it("adds a person without a monthly limit", async () => {
    const { service, personRepository, workPolicyRepository } =
      createService();

    const person = await service.addPerson("  Sita  ");

    expect(person.name).toBe("Sita");
    expect(personRepository.people).toEqual([person]);
    expect(workPolicyRepository.policies).toHaveLength(0);
  });

  it("adds a monthly limit starting at the first of the current month", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 15, 12));

    try {
      const { service, workPolicyRepository } = createService();

      const person = await service.addPerson("Sita", 90);

      expect(workPolicyRepository.policies).toHaveLength(1);
      expect(workPolicyRepository.policies[0]).toMatchObject({
        personId: person.id,
        periodType: "calendar_month",
        maxMinutes: 5400,
        effectiveFrom: "2026-11-01",
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects an empty name or a non-positive limit", async () => {
    const { service, personRepository } = createService();

    await expect(service.addPerson("   ")).rejects.toThrow();
    await expect(service.addPerson("Sita", 0)).rejects.toThrow();
    expect(personRepository.people).toHaveLength(0);
  });
});
