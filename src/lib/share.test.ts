import { describe, it, expect } from "vitest";
import { encodeAnswers, decodeAnswers, buildShareUrl } from "./share";
import type { ScreenerAnswers } from "./types";

const answers: ScreenerAnswers = {
  householdSize: 4,
  monthlyIncome: 2300,
  state: "TX",
  hasChildren: true,
  isPregnant: false,
  employment: "self_employed",
  housing: "rent",
  residency: "lawful_resident",
};

describe("share encode/decode", () => {
  it("round-trips answers losslessly", () => {
    const token = encodeAnswers(answers);
    const decoded = decodeAnswers(token);
    expect(decoded).toEqual(answers);
  });

  it("produces a URL-safe token (no +, /, or =)", () => {
    const token = encodeAnswers(answers);
    expect(token).not.toMatch(/[+/=]/);
  });

  it("builds a full share URL with the token", () => {
    const url = buildShareUrl("https://app.example", answers);
    expect(url).toMatch(/^https:\/\/app\.example\/screener\?r=/);
    const token = url.split("r=")[1];
    expect(decodeAnswers(token)).toEqual(answers);
  });

  it("returns null for an empty token", () => {
    expect(decodeAnswers("")).toBeNull();
  });

  it("returns null for garbage that is not base64 JSON", () => {
    expect(decodeAnswers("!!!not-valid!!!")).toBeNull();
  });

  it("returns null when a required field is missing", () => {
    const partial = encodeAnswers({ ...answers });
    // Corrupt by encoding an object missing fields
    const badToken = encodeAnswers({
      ...answers,
      // @ts-expect-error intentionally break the shape for the test
      householdSize: "four",
    });
    expect(decodeAnswers(badToken)).toBeNull();
    // sanity: the valid one still decodes
    expect(decodeAnswers(partial)).not.toBeNull();
  });

  it("returns null for an invalid enum value", () => {
    const badToken = encodeAnswers({
      ...answers,
      // @ts-expect-error intentionally invalid enum
      employment: "astronaut",
    });
    expect(decodeAnswers(badToken)).toBeNull();
  });
});
