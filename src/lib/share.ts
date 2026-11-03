import type {
  ScreenerAnswers,
  EmploymentStatus,
  HousingStatus,
  ResidencyStatus,
} from "@/lib/types";

/** URL-safe base64 that works in both the browser and Node. */
function toBase64Url(input: string): string {
  const b64 =
    typeof btoa === "function"
      ? btoa(unescape(encodeURIComponent(input)))
      : Buffer.from(input, "utf-8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): string {
  const b64 =
    input.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((input.length + 3) % 4);
  if (typeof atob === "function") {
    return decodeURIComponent(escape(atob(b64)));
  }
  return Buffer.from(b64, "base64").toString("utf-8");
}

const EMPLOYMENT: EmploymentStatus[] = [
  "employed",
  "self_employed",
  "unemployed",
  "retired",
  "unable_to_work",
];
const HOUSING: HousingStatus[] = [
  "rent",
  "own",
  "unstable",
  "homeless",
  "other",
];
const RESIDENCY: ResidencyStatus[] = [
  "citizen",
  "lawful_resident",
  "other_or_unsure",
];

/** Serializes answers into a short URL-safe token. */
export function encodeAnswers(answers: ScreenerAnswers): string {
  const json = JSON.stringify(answers);
  return toBase64Url(json);
}

function isValidEnum<T extends string>(arr: T[], value: unknown): value is T {
  return typeof value === "string" && (arr as string[]).includes(value);
}

/**
 * Decodes a share token back into answers. Returns null for anything
 * malformed or missing required fields, so callers can show a friendly error
 * instead of crashing.
 */
export function decodeAnswers(token: string): ScreenerAnswers | null {
  if (!token) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(fromBase64Url(token));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const b = parsed as Record<string, unknown>;

  if (
    typeof b.householdSize !== "number" ||
    b.householdSize < 1 ||
    typeof b.monthlyIncome !== "number" ||
    b.monthlyIncome < 0 ||
    typeof b.state !== "string" ||
    typeof b.hasChildren !== "boolean" ||
    typeof b.isPregnant !== "boolean" ||
    !isValidEnum(EMPLOYMENT, b.employment) ||
    !isValidEnum(HOUSING, b.housing) ||
    !isValidEnum(RESIDENCY, b.residency)
  ) {
    return null;
  }

  return {
    householdSize: b.householdSize,
    monthlyIncome: b.monthlyIncome,
    state: b.state,
    hasChildren: b.hasChildren,
    isPregnant: b.isPregnant,
    employment: b.employment,
    housing: b.housing,
    residency: b.residency,
  };
}

/** Builds a full shareable URL for the given answers. */
export function buildShareUrl(origin: string, answers: ScreenerAnswers): string {
  const token = encodeAnswers(answers);
  return `${origin}/screener?r=${token}`;
}
