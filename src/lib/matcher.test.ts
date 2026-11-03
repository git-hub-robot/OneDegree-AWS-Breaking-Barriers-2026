import { describe, it, expect } from "vitest";
import {
  fallbackMatch,
  buildPrompt,
  parseAiResults,
  sortResults,
  incomeAsPercentOfFpl,
} from "./matcher";
import type { ScreenerAnswers, MatchResult } from "./types";

const lowIncomeFamily: ScreenerAnswers = {
  householdSize: 4,
  monthlyIncome: 1500,
  state: "TX",
  hasChildren: true,
  isPregnant: false,
  employment: "employed",
  housing: "rent",
  residency: "citizen",
};

const highIncomeSingle: ScreenerAnswers = {
  householdSize: 1,
  monthlyIncome: 9000,
  state: "CA",
  hasChildren: false,
  isPregnant: false,
  employment: "employed",
  housing: "own",
  residency: "citizen",
};

describe("incomeAsPercentOfFpl", () => {
  it("is higher for higher income", () => {
    expect(incomeAsPercentOfFpl(highIncomeSingle)).toBeGreaterThan(
      incomeAsPercentOfFpl(lowIncomeFamily),
    );
  });
});

describe("fallbackMatch", () => {
  it("returns one result per program", () => {
    const results = fallbackMatch(lowIncomeFamily);
    expect(results.length).toBe(6);
    const ids = results.map((r) => r.programId).sort();
    expect(ids).toEqual(
      ["eitc", "liheap", "medicaid", "section8", "snap", "wic"].sort(),
    );
  });

  it("rates SNAP likely for a low-income family", () => {
    const results = fallbackMatch(lowIncomeFamily);
    const snap = results.find((r) => r.programId === "snap")!;
    expect(snap.likelihood).toBe("likely");
    expect(snap.reason.length).toBeGreaterThan(0);
  });

  it("rates SNAP unlikely for a high earner", () => {
    const results = fallbackMatch(highIncomeSingle);
    const snap = results.find((r) => r.programId === "snap")!;
    expect(snap.likelihood).toBe("unlikely");
  });

  it("includes official links for each result", () => {
    for (const r of fallbackMatch(lowIncomeFamily)) {
      expect(r.officialUrl).toMatch(/^https?:\/\//);
    }
  });

  it("sorts likely results before unlikely ones", () => {
    const results = fallbackMatch(lowIncomeFamily);
    const firstUnlikely = results.findIndex((r) => r.likelihood === "unlikely");
    const lastLikely = results.map((r) => r.likelihood).lastIndexOf("likely");
    if (firstUnlikely !== -1 && lastLikely !== -1) {
      expect(lastLikely).toBeLessThan(firstUnlikely);
    }
  });
});

describe("buildPrompt", () => {
  it("includes the household details and all program ids", () => {
    const { system, user } = buildPrompt(lowIncomeFamily);
    expect(system).toMatch(/Never guarantee eligibility/i);
    expect(system).toMatch(/Never invent programs/i);
    expect(user).toContain("Household size: 4");
    expect(user).toContain("snap");
    expect(user).toContain("medicaid");
  });
});

describe("parseAiResults", () => {
  it("parses well-formed JSON and merges program metadata", () => {
    const raw = JSON.stringify({
      results: [
        { programId: "snap", likelihood: "likely", reason: "Low income." },
        { programId: "medicaid", likelihood: "possible", reason: "Maybe." },
      ],
    });
    const results = parseAiResults(raw, lowIncomeFamily);
    expect(results.length).toBe(6); // all programs present
    const snap = results.find((r) => r.programId === "snap")!;
    expect(snap.likelihood).toBe("likely");
    expect(snap.reason).toBe("Low income.");
    expect(snap.name).toBe("SNAP (Food Stamps)"); // merged from our data
    expect(snap.officialUrl).toMatch(/^https/);
  });

  it("recovers JSON embedded in extra prose", () => {
    const raw =
      'Here you go: {"results":[{"programId":"snap","likelihood":"likely","reason":"ok"}]} thanks';
    const results = parseAiResults(raw, lowIncomeFamily);
    expect(results.find((r) => r.programId === "snap")!.likelihood).toBe(
      "likely",
    );
  });

  it("fills in programs the model dropped using the fallback", () => {
    const raw = JSON.stringify({
      results: [
        { programId: "snap", likelihood: "likely", reason: "ok" },
      ],
    });
    const results = parseAiResults(raw, lowIncomeFamily);
    // medicaid was omitted by the model but should still appear
    const medicaid = results.find((r) => r.programId === "medicaid");
    expect(medicaid).toBeDefined();
    expect(["likely", "possible", "unlikely"]).toContain(medicaid!.likelihood);
  });

  it("throws on completely non-JSON input", () => {
    expect(() => parseAiResults("not json at all", lowIncomeFamily)).toThrow();
  });

  it("defaults bad likelihood values to possible", () => {
    const raw = JSON.stringify({
      results: [{ programId: "snap", likelihood: "definitely", reason: "x" }],
    });
    const results = parseAiResults(raw, lowIncomeFamily);
    expect(results.find((r) => r.programId === "snap")!.likelihood).toBe(
      "possible",
    );
  });
});

describe("sortResults", () => {
  it("orders likely, possible, unlikely", () => {
    const input: MatchResult[] = [
      { programId: "a", name: "a", category: "Food", summary: "", likelihood: "unlikely", reason: "", officialUrl: "https://x.com" },
      { programId: "b", name: "b", category: "Food", summary: "", likelihood: "likely", reason: "", officialUrl: "https://x.com" },
      { programId: "c", name: "c", category: "Food", summary: "", likelihood: "possible", reason: "", officialUrl: "https://x.com" },
    ];
    const sorted = sortResults(input).map((r) => r.likelihood);
    expect(sorted).toEqual(["likely", "possible", "unlikely"]);
  });
});
