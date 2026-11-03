/**
 * Seeded social service programs for BenefitFinder.
 *
 * These are plain-language summaries with COARSE eligibility signals meant to
 * help a family discover programs worth looking into. They are NOT official
 * eligibility rules. Every result in the app links to the official source so
 * users can verify and apply.
 */

export type ProgramCategory =
  | "Food"
  | "Healthcare"
  | "Housing"
  | "Utilities"
  | "Income/Tax"
  | "Nutrition";

export interface Program {
  /** Stable machine id. */
  id: string;
  /** Human-friendly program name. */
  name: string;
  /** What area of need this covers. */
  category: ProgramCategory;
  /** One or two plain-language sentences a non-expert can understand. */
  summary: string;
  /**
   * Coarse, human-readable eligibility signals. Used to guide the AI and the
   * deterministic fallback. Not exhaustive and not legally binding.
   */
  eligibilitySignals: string[];
  /** Official page to learn more and apply. */
  officialUrl: string;
}

export const PROGRAMS: Program[] = [
  {
    id: "snap",
    name: "SNAP (Food Stamps)",
    category: "Food",
    summary:
      "Monthly money on a card to buy groceries for your household. One of the most widely used food programs in the U.S.",
    eligibilitySignals: [
      "Household income at or below roughly 130% of the federal poverty level",
      "Based on household size and monthly income",
      "Available to many U.S. citizens and some lawfully present non-citizens",
    ],
    officialUrl: "https://www.fns.usda.gov/snap/recipient/eligibility",
  },
  {
    id: "medicaid",
    name: "Medicaid",
    category: "Healthcare",
    summary:
      "Free or low-cost health coverage for people and families with limited income, including doctor visits, hospital care, and more.",
    eligibilitySignals: [
      "Low to moderate household income (limits vary by state)",
      "Children, pregnant people, parents, and some adults may qualify",
      "Eligibility expanded in many states for low-income adults",
    ],
    officialUrl: "https://www.medicaid.gov/medicaid/eligibility/index.html",
  },
  {
    id: "wic",
    name: "WIC",
    category: "Nutrition",
    summary:
      "Food, nutrition help, and support for pregnant people, new mothers, babies, and young children under 5.",
    eligibilitySignals: [
      "Pregnant, recently pregnant, breastfeeding, or have a child under 5",
      "Income at or below roughly 185% of the federal poverty level",
      "Often automatically income-eligible if you already get SNAP or Medicaid",
    ],
    officialUrl: "https://www.fns.usda.gov/wic/wic-eligibility-requirements",
  },
  {
    id: "liheap",
    name: "LIHEAP (Energy Assistance)",
    category: "Utilities",
    summary:
      "Help paying heating and cooling bills, and sometimes help if your utilities are about to be shut off.",
    eligibilitySignals: [
      "Low household income (limits set by each state)",
      "Prioritizes households with high energy costs or shut-off risk",
      "Households with young children, older adults, or disabilities often prioritized",
    ],
    officialUrl:
      "https://www.acf.hhs.gov/ocs/programs/liheap/about-liheap",
  },
  {
    id: "eitc",
    name: "Earned Income Tax Credit (EITC)",
    category: "Income/Tax",
    summary:
      "A tax credit that can mean a bigger refund for working people with low to moderate income, especially those with children.",
    eligibilitySignals: [
      "You earned income from a job or self-employment",
      "Low to moderate income; larger credit for families with children",
      "Claimed when you file a federal tax return",
    ],
    officialUrl:
      "https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit-eitc",
  },
  {
    id: "section8",
    name: "Housing Choice Voucher (Section 8)",
    category: "Housing",
    summary:
      "Help paying rent in private housing. You pay part of the rent and the voucher covers the rest, paid to your landlord.",
    eligibilitySignals: [
      "Income generally at or below 50% of the area median income",
      "Based on household size and local income limits",
      "Often has a waitlist; apply through your local housing authority",
    ],
    officialUrl:
      "https://www.hud.gov/topics/housing_choice_voucher_program_section_8",
  },
];

/** Minimal URL check good enough for seed-data validation. */
export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export interface ProgramValidationError {
  programId: string;
  field: string;
  message: string;
}

/**
 * Validates that every program has the required fields populated and a valid
 * official URL. Returns a list of problems (empty when all good).
 */
export function validatePrograms(
  programs: Program[] = PROGRAMS,
): ProgramValidationError[] {
  const errors: ProgramValidationError[] = [];
  const seenIds = new Set<string>();

  for (const p of programs) {
    const id = p.id || "(missing id)";

    if (!p.id) {
      errors.push({ programId: id, field: "id", message: "id is required" });
    } else if (seenIds.has(p.id)) {
      errors.push({ programId: id, field: "id", message: "duplicate id" });
    } else {
      seenIds.add(p.id);
    }

    if (!p.name) {
      errors.push({ programId: id, field: "name", message: "name is required" });
    }
    if (!p.category) {
      errors.push({
        programId: id,
        field: "category",
        message: "category is required",
      });
    }
    if (!p.summary) {
      errors.push({
        programId: id,
        field: "summary",
        message: "summary is required",
      });
    }
    if (!p.eligibilitySignals || p.eligibilitySignals.length === 0) {
      errors.push({
        programId: id,
        field: "eligibilitySignals",
        message: "at least one eligibility signal is required",
      });
    }
    if (!p.officialUrl) {
      errors.push({
        programId: id,
        field: "officialUrl",
        message: "officialUrl is required",
      });
    } else if (!isValidHttpUrl(p.officialUrl)) {
      errors.push({
        programId: id,
        field: "officialUrl",
        message: `officialUrl is not a valid http(s) URL: ${p.officialUrl}`,
      });
    }
  }

  return errors;
}

/** Returns all seeded programs. */
export function getPrograms(): Program[] {
  return PROGRAMS;
}
