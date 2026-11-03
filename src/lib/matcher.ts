import { PROGRAMS, type Program } from "@/data/programs";
import type {
  ScreenerAnswers,
  MatchResult,
  Likelihood,
} from "@/lib/types";

/**
 * Federal Poverty Level (annual, 48 contiguous states + DC) rough figures.
 * Used ONLY by the deterministic fallback to produce reasonable guesses when
 * the AI is unavailable. Not exact and updated roughly to recent guidelines.
 */
const FPL_BASE = 15060; // 1-person household
const FPL_PER_PERSON = 5380; // added per additional person

export function annualPovertyLine(householdSize: number): number {
  const size = Math.max(1, householdSize);
  return FPL_BASE + (size - 1) * FPL_PER_PERSON;
}

/** Percent of the federal poverty line the household's income represents. */
export function incomeAsPercentOfFpl(answers: ScreenerAnswers): number {
  const annualIncome = Math.max(0, answers.monthlyIncome) * 12;
  const line = annualPovertyLine(answers.householdSize);
  return (annualIncome / line) * 100;
}

const ORDER: Record<Likelihood, number> = {
  likely: 0,
  possible: 1,
  unlikely: 2,
};

/** Sorts results most-promising first, stable within a likelihood bucket. */
export function sortResults(results: MatchResult[]): MatchResult[] {
  return [...results].sort((a, b) => ORDER[a.likelihood] - ORDER[b.likelihood]);
}

/**
 * Deterministic, rules-based assessment. Intentionally conservative and
 * coarse. This runs when the OpenAI key is missing or the API call fails so
 * the demo always returns something sensible.
 */
export function fallbackMatch(answers: ScreenerAnswers): MatchResult[] {
  const pct = incomeAsPercentOfFpl(answers);
  const lawfulish =
    answers.residency === "citizen" ||
    answers.residency === "lawful_resident";

  const results: MatchResult[] = PROGRAMS.map((p) => {
    let likelihood: Likelihood = "possible";
    let reason = "";

    switch (p.id) {
      case "snap": {
        if (pct <= 130) {
          likelihood = "likely";
          reason =
            "Your household income looks at or below the usual SNAP limit.";
        } else if (pct <= 200) {
          likelihood = "possible";
          reason =
            "Your income is a bit above the typical limit, but some states allow more.";
        } else {
          likelihood = "unlikely";
          reason = "Your income looks above the usual SNAP limit.";
        }
        break;
      }
      case "medicaid": {
        if (pct <= 138 || answers.hasChildren || answers.isPregnant) {
          likelihood = "likely";
          reason =
            "Low income, children, or pregnancy often qualify for Medicaid in many states.";
        } else if (pct <= 200) {
          likelihood = "possible";
          reason = "You may qualify depending on your state's income limits.";
        } else {
          likelihood = "unlikely";
          reason = "Your income looks above common Medicaid limits.";
        }
        break;
      }
      case "wic": {
        if ((answers.isPregnant || answers.hasChildren) && pct <= 185) {
          likelihood = "likely";
          reason =
            "WIC serves pregnant people and young children in lower-income households.";
        } else if (answers.isPregnant || answers.hasChildren) {
          likelihood = "possible";
          reason =
            "WIC is for pregnant people and young children; check your state's income limit.";
        } else {
          likelihood = "unlikely";
          reason =
            "WIC is for pregnant people, new mothers, and children under 5.";
        }
        break;
      }
      case "liheap": {
        if (pct <= 150) {
          likelihood = "likely";
          reason = "Lower-income households often qualify for help with utility bills.";
        } else if (pct <= 200) {
          likelihood = "possible";
          reason = "You may qualify depending on your state and energy costs.";
        } else {
          likelihood = "unlikely";
          reason = "Your income looks above common energy-assistance limits.";
        }
        break;
      }
      case "eitc": {
        const working =
          answers.employment === "employed" ||
          answers.employment === "self_employed";
        if (working && pct <= 250) {
          likelihood = "likely";
          reason =
            "Working households with low-to-moderate income often get this tax credit.";
        } else if (working) {
          likelihood = "possible";
          reason = "You work, so check whether your income falls under the EITC limits.";
        } else {
          likelihood = "unlikely";
          reason = "The EITC is for people with earned income from work.";
        }
        break;
      }
      case "section8": {
        if (pct <= 100) {
          likelihood = "likely";
          reason =
            "Very low income relative to your area often qualifies for rental help.";
        } else if (pct <= 150) {
          likelihood = "possible";
          reason = "You may qualify; local income limits and waitlists vary.";
        } else {
          likelihood = "unlikely";
          reason = "Your income looks above common housing-voucher limits.";
        }
        break;
      }
      default: {
        likelihood = "possible";
        reason = "You may be eligible; check the official site for details.";
      }
    }

    // Residency is a coarse gate for some programs; soften if unsure.
    if (!lawfulish && (p.id === "snap" || p.id === "section8")) {
      if (likelihood === "likely") likelihood = "possible";
      reason += " Eligibility can depend on immigration status; check the official site.";
    }

    return {
      programId: p.id,
      name: p.name,
      category: p.category,
      summary: p.summary,
      likelihood,
      reason: reason.trim(),
      officialUrl: p.officialUrl,
    };
  });

  return sortResults(results);
}

/** Builds the system + user prompt content for the LLM. */
export function buildPrompt(
  answers: ScreenerAnswers,
  programs: Program[] = PROGRAMS,
): { system: string; user: string } {
  const system = [
    "You are a careful assistant that helps low-income families discover U.S. social service programs they MAY qualify for.",
    "Rules you must follow:",
    "1. Only assess the exact programs provided in the list. Never invent programs.",
    "2. Never guarantee eligibility. Use only: likely, possible, or unlikely.",
    "3. Base your assessment on the household's answers and each program's eligibility signals.",
    "4. Keep each reason to ONE short, plain-language sentence a non-expert can understand.",
    "5. Do not give legal advice. This is a starting point, not an official decision.",
    "Return STRICT JSON only, no prose, matching this shape:",
    '{"results":[{"programId":"...","likelihood":"likely|possible|unlikely","reason":"..."}]}',
    "Include every program from the list exactly once.",
  ].join("\n");

  const programLines = programs
    .map(
      (p) =>
        `- id: ${p.id} | name: ${p.name} | category: ${p.category} | signals: ${p.eligibilitySignals.join("; ")}`,
    )
    .join("\n");

  const user = [
    "Household answers:",
    `- Household size: ${answers.householdSize}`,
    `- Monthly income (before taxes): $${answers.monthlyIncome}`,
    `- State: ${answers.state}`,
    `- Has children under 18: ${answers.hasChildren ? "yes" : "no"}`,
    `- Someone pregnant: ${answers.isPregnant ? "yes" : "no"}`,
    `- Employment: ${answers.employment}`,
    `- Housing: ${answers.housing}`,
    `- Residency/immigration status: ${answers.residency}`,
    "",
    "Programs to assess:",
    programLines,
  ].join("\n");

  return { system, user };
}

function isLikelihood(value: unknown): value is Likelihood {
  return value === "likely" || value === "possible" || value === "unlikely";
}

/**
 * Parses the raw LLM JSON text into full MatchResults, merging in the program
 * metadata (name, summary, link) that we already trust from our own data.
 * Any program the model omitted or returned badly falls back to "possible".
 */
export function parseAiResults(
  raw: string,
  answers: ScreenerAnswers,
  programs: Program[] = PROGRAMS,
): MatchResult[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Try to recover a JSON object embedded in extra text.
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("AI response was not valid JSON");
    }
    parsed = JSON.parse(raw.slice(start, end + 1));
  }

  const resultsRaw =
    parsed && typeof parsed === "object" && "results" in parsed
      ? (parsed as { results: unknown }).results
      : null;

  const byId = new Map<string, { likelihood: Likelihood; reason: string }>();
  if (Array.isArray(resultsRaw)) {
    for (const item of resultsRaw) {
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        const id = typeof obj.programId === "string" ? obj.programId : "";
        const likelihood = isLikelihood(obj.likelihood)
          ? obj.likelihood
          : "possible";
        const reason =
          typeof obj.reason === "string" && obj.reason.trim()
            ? obj.reason.trim()
            : "You may be eligible; check the official site for details.";
        if (id) byId.set(id, { likelihood, reason });
      }
    }
  }

  const fallbackByeId = new Map(
    fallbackMatch(answers).map((r) => [r.programId, r]),
  );

  const merged: MatchResult[] = programs.map((p) => {
    const ai = byId.get(p.id);
    if (ai) {
      return {
        programId: p.id,
        name: p.name,
        category: p.category,
        summary: p.summary,
        likelihood: ai.likelihood,
        reason: ai.reason,
        officialUrl: p.officialUrl,
      };
    }
    // Model dropped this program — use the deterministic result instead.
    return (
      fallbackByeId.get(p.id) ?? {
        programId: p.id,
        name: p.name,
        category: p.category,
        summary: p.summary,
        likelihood: "possible" as Likelihood,
        reason: "You may be eligible; check the official site for details.",
        officialUrl: p.officialUrl,
      }
    );
  });

  return sortResults(merged);
}
