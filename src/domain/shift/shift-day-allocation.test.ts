import { describe, expect, it } from "vitest";
import { splitShiftByDay } from "./shift-day-allocation";
import type { Shift } from "./shift";

describe("splitShiftByDay", () => {
  it("does not split a normal shift", () => {
    const shift: Shift = {
      id: "1",
      personId: "person-1",
      workLocationId: "location-1",
      startAt: "2026-09-15T17:00",
      endAt: "2026-09-15T22:30",
      createdAt: "",
      updatedAt: "",
    };

    const result = splitShiftByDay(shift);

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2026-09-15");
    expect(result[0].minutes).toBe(330);
  });

  it("splits a shift crossing midnight", () => {
    const shift: Shift = {
      id: "2",
      personId: "person-1",
      workLocationId: "location-1",
      startAt: "2026-09-15T23:00",
      endAt: "2026-09-16T03:00",
      createdAt: "",
      updatedAt: "",
    };

    const result = splitShiftByDay(shift);

    expect(result).toHaveLength(2);

    expect(result[0].date).toBe("2026-09-15");
    expect(result[0].minutes).toBe(60);

    expect(result[1].date).toBe("2026-09-16");
    expect(result[1].minutes).toBe(180);
  });
});