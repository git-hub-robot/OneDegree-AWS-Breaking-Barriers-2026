import { describe, it, expect } from "vitest";
import {
  PROGRAMS,
  getPrograms,
  validatePrograms,
  isValidHttpUrl,
  type Program,
} from "./programs";

describe("program seed data", () => {
  it("loads at least 5 programs", () => {
    expect(getPrograms().length).toBeGreaterThanOrEqual(5);
  });

  it("has the expected core programs", () => {
    const ids = PROGRAMS.map((p) => p.id);
    expect(ids).toContain("snap");
    expect(ids).toContain("medicaid");
    expect(ids).toContain("wic");
    expect(ids).toContain("liheap");
    expect(ids).toContain("eitc");
    expect(ids).toContain("section8");
  });

  it("passes validation with no errors", () => {
    expect(validatePrograms()).toEqual([]);
  });

  it("every program has all required fields", () => {
    for (const p of PROGRAMS) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.category).toBeTruthy();
      expect(p.summary).toBeTruthy();
      expect(p.eligibilitySignals.length).toBeGreaterThan(0);
      expect(isValidHttpUrl(p.officialUrl)).toBe(true);
    }
  });

  it("has unique ids", () => {
    const ids = PROGRAMS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("validatePrograms", () => {
  it("flags a missing name", () => {
    const bad: Program[] = [
      {
        id: "x",
        name: "",
        category: "Food",
        summary: "s",
        eligibilitySignals: ["a"],
        officialUrl: "https://example.com",
      },
    ];
    const errors = validatePrograms(bad);
    expect(errors.some((e) => e.field === "name")).toBe(true);
  });

  it("flags an invalid URL", () => {
    const bad: Program[] = [
      {
        id: "x",
        name: "X",
        category: "Food",
        summary: "s",
        eligibilitySignals: ["a"],
        officialUrl: "not-a-url",
      },
    ];
    const errors = validatePrograms(bad);
    expect(errors.some((e) => e.field === "officialUrl")).toBe(true);
  });

  it("flags duplicate ids", () => {
    const bad: Program[] = [
      {
        id: "dup",
        name: "A",
        category: "Food",
        summary: "s",
        eligibilitySignals: ["a"],
        officialUrl: "https://example.com",
      },
      {
        id: "dup",
        name: "B",
        category: "Food",
        summary: "s",
        eligibilitySignals: ["a"],
        officialUrl: "https://example.com",
      },
    ];
    const errors = validatePrograms(bad);
    expect(errors.some((e) => e.field === "id" && e.message === "duplicate id")).toBe(
      true,
    );
  });
});

describe("isValidHttpUrl", () => {
  it("accepts https", () => {
    expect(isValidHttpUrl("https://example.com")).toBe(true);
  });
  it("rejects junk", () => {
    expect(isValidHttpUrl("ftp://x")).toBe(false);
    expect(isValidHttpUrl("nope")).toBe(false);
  });
});
