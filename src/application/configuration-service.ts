import type { Person } from "../domain/person/person";
import type { Employer } from "../domain/employer/employer";
import type { WorkLocation } from "../domain/employer/work-location";

import type { PersonRepository } from "../infrastructure/repositories/person-repository";
import type {
  EmployerRepository,
  WorkLocationRepository,
} from "../infrastructure/repositories/workplace-repository";

export class ConfigurationService {
  private readonly personRepository: PersonRepository;
  private readonly employerRepository: EmployerRepository;
  private readonly workLocationRepository: WorkLocationRepository;

  constructor(
    personRepository: PersonRepository,
    employerRepository: EmployerRepository,
    workLocationRepository: WorkLocationRepository,
  ) {
    this.personRepository = personRepository;
    this.employerRepository = employerRepository;
    this.workLocationRepository = workLocationRepository;
  }

  async getPeople(): Promise<Person[]> {
    return this.personRepository.getAll();
  }

  async getEmployers(): Promise<Employer[]> {
    const employers = await this.employerRepository.getAll();

    return employers.filter(
      (employer) => employer.isActive,
    );
  }

  async getLocationsForEmployer(
    employerId: string,
  ): Promise<WorkLocation[]> {
    const locations =
      await this.workLocationRepository.getByEmployer(
        employerId,
      );

    return locations.filter(
      (location) => location.isActive,
    );
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

  async updateEmployer(
    employer: Employer,
  ): Promise<void> {
    const updatedEmployer: Employer = {
      ...employer,
      name: employer.name.trim(),
      updatedAt: new Date().toISOString(),
    };

    await this.employerRepository.update(
      updatedEmployer,
    );
  }

  async deleteEmployer(
    employerId: string,
  ): Promise<void> {
    await this.employerRepository.delete(employerId);
  }

  async addLocation(
    employerId: string,
    name: string,
  ): Promise<void> {
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
  }

  async updateLocation(
    location: WorkLocation,
  ): Promise<void> {
    const updatedLocation: WorkLocation = {
      ...location,
      name: location.name.trim(),
      updatedAt: new Date().toISOString(),
    };

    await this.workLocationRepository.update(
      updatedLocation,
    );
  }

  async deleteLocation(
    locationId: string,
  ): Promise<void> {
    await this.workLocationRepository.delete(
      locationId,
    );
  }
}