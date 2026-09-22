import { describe, expect, it } from "vitest";
import {
  calculateNetDurationMinutes,
  calculateBreakMinutes,
} from "./shift-duration";

describe("shift break rule", () => {
  it("does not deduct a break below 6 hours 30 minutes", () => {
    expect(
      calculateBreakMinutes(389)
    ).toBe(0);
  });

  it("deducts 30 minutes at exactly 6 hours 30 minutes", () => {
    expect(
      calculateBreakMinutes(390)
    ).toBe(30);
  });

  it("deducts 30 minutes above 6 hours 30 minutes", () => {
    expect(
      calculateBreakMinutes(420)
    ).toBe(30);
  });

  it("calculates 6:29 as 6:29", () => {
    expect(
      calculateNetDurationMinutes(
        "2026-09-22T08:00",
        "2026-09-22T14:29"
      )
    ).toBe(389);
  });

  it("calculates exactly 6:30 as 6:00", () => {
    expect(
      calculateNetDurationMinutes(
        "2026-09-22T08:00",
        "2026-09-22T14:30"
      )
    ).toBe(360);
  });

  it("calculates 7 hours as 6:30", () => {
    expect(
      calculateNetDurationMinutes(
        "2026-09-22T08:00",
        "2026-09-22T15:00"
      )
    ).toBe(390);
  });

  it("calculates 8 hours as 7:30", () => {
    expect(
      calculateNetDurationMinutes(
        "2026-09-22T08:00",
        "2026-09-22T16:00"
      )
    ).toBe(450);
  });

  it("handles overnight shifts", () => {
    expect(
      calculateNetDurationMinutes(
        "2026-09-22T23:00",
        "2026-09-23T07:00"
      )
    ).toBe(450);
  });
});