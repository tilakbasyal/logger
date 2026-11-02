import type { Person } from "../domain/person/person";
import type { Employer } from "../domain/employer/employer";
import type { WorkLocation } from "../domain/employer/work-location";
import type { WorkPolicy } from "../domain/work-policy/work-policy";

import type { PersonRepository } from "../infrastructure/repositories/person-repository";
import type {
  EmployerRepository,
  WorkLocationRepository,
} from "../infrastructure/repositories/workplace-repository";
import type { WorkPolicyRepository } from "../infrastructure/repositories/work-policy-repository";

export class ConfigurationService {
  private readonly personRepository: PersonRepository;
  private readonly employerRepository: EmployerRepository;
  private readonly workLocationRepository: WorkLocationRepository;
  private readonly workPolicyRepository: WorkPolicyRepository;

  constructor(
    personRepository: PersonRepository,
    employerRepository: EmployerRepository,
    workLocationRepository: WorkLocationRepository,
    workPolicyRepository: WorkPolicyRepository,
  ) {
    this.personRepository = personRepository;
    this.employerRepository = employerRepository;
    this.workLocationRepository = workLocationRepository;
    this.workPolicyRepository = workPolicyRepository;
  }

  async getPeople(): Promise<Person[]> {
    return this.personRepository.getAll();
  }

  async getWorkPolicies(): Promise<WorkPolicy[]> {
    return this.workPolicyRepository.getAll();
  }

  async addPerson(
    name: string,
    maxWorkHoursPerMonth?: number,
  ): Promise<Person> {
    const trimmedName = name.trim();

    if (!trimmedName) {
      throw new Error("Person name cannot be empty.");
    }

    if (maxWorkHoursPerMonth !== undefined && !(maxWorkHoursPerMonth > 0)) {
      throw new Error("Maximum work hours must be greater than zero.");
    }

    const now = new Date();
    const timestamp = now.toISOString();

    const person: Person = {
      id: crypto.randomUUID(),
      name: trimmedName,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.personRepository.add(person);

    if (maxWorkHoursPerMonth !== undefined) {
      // Policies are evaluated per calendar month, so start from the
      // first day of the current month (same as onboarding).
      const monthStart = `${now.getFullYear()}-${String(
        now.getMonth() + 1,
      ).padStart(2, "0")}-01`;

      await this.workPolicyRepository.add({
        id: crypto.randomUUID(),
        personId: person.id,
        periodType: "calendar_month",
        maxMinutes: Math.round(maxWorkHoursPerMonth * 60),
        effectiveFrom: monthStart,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    return person;
  }

  async renamePerson(person: Person, name: string): Promise<Person> {
    const trimmedName = name.trim();

    if (!trimmedName) {
      throw new Error("Person name cannot be empty.");
    }

    const updatedPerson: Person = {
      ...person,
      name: trimmedName,
      updatedAt: new Date().toISOString(),
    };

    await this.personRepository.update(updatedPerson);

    return updatedPerson;
  }

  async getEmployers(): Promise<Employer[]> {
    const employers = await this.employerRepository.getAll();

    return employers.filter((employer) => employer.isActive);
  }

  async getLocationsForEmployer(employerId: string): Promise<WorkLocation[]> {
    const locations =
      await this.workLocationRepository.getByEmployer(employerId);

    return locations.filter((location) => location.isActive);
  }

  async addEmployer(name: string): Promise<void> {
    const now = new Date().toISOString();

    const employer: Employer = {
      id: crypto.randomUUID(),
      name: name.trim(),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.employerRepository.add(employer);
  }

  async updateEmployer(employer: Employer): Promise<void> {
    const updatedEmployer: Employer = {
      ...employer,
      name: employer.name.trim(),
      updatedAt: new Date().toISOString(),
    };

    await this.employerRepository.update(updatedEmployer);
  }

  async deleteEmployer(employerId: string): Promise<void> {
    await this.employerRepository.delete(employerId);
  }

  async addLocation(employerId: string, name: string): Promise<WorkLocation> {
    const now = new Date().toISOString();

    const location: WorkLocation = {
      id: crypto.randomUUID(),
      employerId,
      name: name.trim(),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.workLocationRepository.add(location);
    return location;
  }

  async updateLocation(location: WorkLocation): Promise<void> {
    const updatedLocation: WorkLocation = {
      ...location,
      name: location.name.trim(),
      updatedAt: new Date().toISOString(),
    };

    await this.workLocationRepository.update(updatedLocation);
  }

  async deleteLocation(locationId: string): Promise<void> {
    await this.workLocationRepository.delete(locationId);
  }
}
