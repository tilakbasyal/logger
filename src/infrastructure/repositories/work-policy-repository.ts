import { db } from "../database/db";
import type { WorkPolicy } from "../../domain/work-policy/work-policy";

export interface WorkPolicyRepository {
  add(policy: WorkPolicy): Promise<void>;
  getByPerson(
    personId: string,
  ): Promise<WorkPolicy | undefined>;
  getAll(): Promise<WorkPolicy[]>;
}

export class DexieWorkPolicyRepository
  implements WorkPolicyRepository
{
  async add(
    policy: WorkPolicy,
  ): Promise<void> {
    await db.workPolicies.add(policy);
  }

  async getByPerson(
    personId: string,
  ): Promise<WorkPolicy | undefined> {
    return db.workPolicies
      .where("personId")
      .equals(personId)
      .first();
  }

  async getAll(): Promise<WorkPolicy[]> {
    return db.workPolicies.toArray();
  }
}