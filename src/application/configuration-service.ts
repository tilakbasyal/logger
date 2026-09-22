import type { Person } from "../domain/person/person";
import type { Employer } from "../domain/employer/employer";
import type { WorkLocation } from "../domain/employer/work-location";

import { db } from "../infrastructure/database/db";

export class ConfigurationService {
  async getPeople(): Promise<Person[]> {
    return db.persons.toArray();
  }

  async getEmployers(): Promise<Employer[]> {
    const employers = await db.employers.toArray();

    return employers.filter(
      (employer) => employer.isActive,
    );
  }

  async getLocationsForEmployer(
    employerId: string,
  ): Promise<WorkLocation[]> {
    const locations = await db.workLocations
      .where("employerId")
      .equals(employerId)
      .toArray();

    return locations.filter(
      (location) => location.isActive,
    );
  }
}