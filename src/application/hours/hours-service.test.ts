import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateMonthlyMinutes,
} from "./monthly-hours";

import type { Shift } from "../../domain/shift/shift";

describe("Monthly hours", () => {
  it("calculates hours across multiple employers/locations", () => {
    const shifts: Shift[] = [
      {
        id: "1",
        personId: "me",
        workLocationId: "tv2",
        startAt: "2026-09-05T17:00",
        endAt: "2026-09-05T20:00",
        createdAt: "",
        updatedAt: "",
      },

      {
        id: "2",
        personId: "me",
        workLocationId: "herlev",
        startAt: "2026-09-06T18:00",
        endAt: "2026-09-06T19:30",
        createdAt: "",
        updatedAt: "",
      },

      {
        id: "3",
        personId: "me",
        workLocationId: "tv2",
        startAt: "2026-09-10T23:00",
        endAt: "2026-09-11T03:00",
        createdAt: "",
        updatedAt: "",
      },
    ];

    const result =
      calculateMonthlyMinutes(
        shifts,
        "me",
        2026,
        9,
      );

    /*
     * 3 hours
     * + 1.5 hours
     * + 1 hour on Sep 10
     * + 3 hours on Sep 11
     *
     * = 8.5 hours
     */

    expect(result).toBe(8.5 * 60);
  });
});