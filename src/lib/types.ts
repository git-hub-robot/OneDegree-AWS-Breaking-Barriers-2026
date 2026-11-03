/** Shared types for the screener answers and match results. */

export type HousingStatus =
  | "rent"
  | "own"
  | "unstable"
  | "homeless"
  | "other";

export type EmploymentStatus =
  | "employed"
  | "self_employed"
  | "unemployed"
  | "retired"
  | "unable_to_work";

export type ResidencyStatus =
  | "citizen"
  | "lawful_resident"
  | "other_or_unsure";

/** The answers collected by the questionnaire. */
export interface ScreenerAnswers {
  householdSize: number;
  monthlyIncome: number;
  state: string;
  hasChildren: boolean;
  isPregnant: boolean;
  employment: EmploymentStatus;
  housing: HousingStatus;
  residency: ResidencyStatus;
}

export type Likelihood = "likely" | "possible" | "unlikely";

/** One program's assessment returned to the UI. */
export interface MatchResult {
  programId: string;
  name: string;
  category: string;
  summary: string;
  likelihood: Likelihood;
  reason: string;
  officialUrl: string;
}

export interface MatchResponse {
  results: MatchResult[];
  /** True when results came from the deterministic fallback, not the AI. */
  usedFallback: boolean;
}
