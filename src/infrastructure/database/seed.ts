import { db } from "./db";
import { createId } from "../../shared/id";
import { nowIso } from "../../shared/time";

export async function initializeDatabase(): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.persons,
      db.employers,
      db.workLocations,
      db.workPolicies,
      db.payrollSchedules,
    ],
    async () => {
      // ============================================
      // PEOPLE
      // ============================================

      let me = await db.persons
        .where("name")
        .equals("Me")
        .first();

      if (!me) {
        const now = nowIso();

        me = {
          id: createId(),
          name: "Me",
          createdAt: now,
          updatedAt: now,
        };

        await db.persons.add(me);
      }

      let wife = await db.persons
        .where("name")
        .equals("Wife")
        .first();

      if (!wife) {
        const now = nowIso();

        wife = {
          id: createId(),
          name: "Wife",
          createdAt: now,
          updatedAt: now,
        };

        await db.persons.add(wife);
      }

      // ============================================
      // EMPLOYERS
      // ============================================

      let coor = await db.employers
        .where("name")
        .equals("COOR")
        .first();

      if (!coor) {
        const now = nowIso();

        coor = {
          id: createId(),
          name: "COOR",
          isActive: true,
          createdAt: now,
          updatedAt: now,
        };

        await db.employers.add(coor);
      }

      let qfs = await db.employers
        .where("name")
        .equals("QFS")
        .first();

      if (!qfs) {
        const now = nowIso();

        qfs = {
          id: createId(),
          name: "QFS",
          isActive: true,
          createdAt: now,
          updatedAt: now,
        };

        await db.employers.add(qfs);
      }

      // ============================================
      // COOR LOCATIONS
      // ============================================

      await ensureLocation(coor.id, "TV2");

      await ensureLocation(
        coor.id,
        "HERLEV BYMIDT",
      );

      // ============================================
      // QFS LOCATIONS
      // ============================================

      await ensureLocation(qfs.id, "CIRCUS");

      await ensureLocation(
        qfs.id,
        "ENGHAVE APOTEK",
      );

      await ensureLocation(
        qfs.id,
        "SYDHAVN APOTEK",
      );

      // ============================================
      // YOUR 90-HOUR WORK POLICY
      // ============================================

      const existingPolicy = await db.workPolicies
        .where("personId")
        .equals(me.id)
        .first();

      if (!existingPolicy) {
        const now = nowIso();

        await db.workPolicies.add({
          id: createId(),
          personId: me.id,
          periodType: "calendar_month",
          maxMinutes: 90 * 60,
          effectiveFrom: "2026-01-01",
          createdAt: now,
          updatedAt: now,
        });
      }

      // ============================================
      // COOR PAYROLL SCHEDULE
      // 15th → 14th
      // ============================================

      const existingCoorSchedule = await db.payrollSchedules
        .where("employerId")
        .equals(coor.id)
        .first();

      if (!existingCoorSchedule) {
        const now = nowIso();

        await db.payrollSchedules.add({
          id: createId(),
          employerId: coor.id,
          type: "monthly_cutoff",
          cutoffDay: 14,
          effectiveFrom: "2026-01-01",
          createdAt: now,
          updatedAt: now,
        });
      }

      // ============================================
      // QFS PAYROLL SCHEDULE
      // 1st → last day
      // ============================================

      const existingQfsSchedule = await db.payrollSchedules
        .where("employerId")
        .equals(qfs.id)
        .first();

      if (!existingQfsSchedule) {
        const now = nowIso();

        await db.payrollSchedules.add({
          id: createId(),
          employerId: qfs.id,
          type: "calendar_month",
          effectiveFrom: "2026-01-01",
          createdAt: now,
          updatedAt: now,
        });
      }
    },
  );

  console.log("Database initialization complete.");
}


// ==================================================
// Helper: Create a location only if it doesn't exist
// ==================================================

async function ensureLocation(
  employerId: string,
  name: string,
): Promise<void> {
  const existingLocation = await db.workLocations
    .where("employerId")
    .equals(employerId)
    .filter((location) => location.name === name)
    .first();

  if (existingLocation) {
    return;
  }

  const now = nowIso();

  await db.workLocations.add({
    id: createId(),
    employerId,
    name,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
}