import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  buildPrompt,
  parseAiResults,
  fallbackMatch,
} from "@/lib/matcher";
import type { ScreenerAnswers, MatchResponse } from "@/lib/types";

export const runtime = "nodejs";

function isValidAnswers(body: unknown): body is ScreenerAnswers {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.householdSize === "number" &&
    typeof b.monthlyIncome === "number" &&
    typeof b.state === "string" &&
    typeof b.hasChildren === "boolean" &&
    typeof b.isPregnant === "boolean" &&
    typeof b.employment === "string" &&
    typeof b.housing === "string" &&
    typeof b.residency === "string"
  );
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (!isValidAnswers(body)) {
    return NextResponse.json(
      { error: "Missing or invalid answers." },
      { status: 400 },
    );
  }

  const answers = body;
  const apiKey = process.env.OPENAI_API_KEY;

  // No key configured -> deterministic fallback so the demo always works.
  if (!apiKey) {
    const response: MatchResponse = {
      results: fallbackMatch(answers),
      usedFallback: true,
    };
    return NextResponse.json(response);
  }

  try {
    const client = new OpenAI({ apiKey });
    const { system, user } = buildPrompt(answers);

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const results = parseAiResults(raw, answers);

    const response: MatchResponse = { results, usedFallback: false };
    return NextResponse.json(response);
  } catch (err) {
    // Any AI failure (network, quota, parse) -> deterministic fallback.
    console.error("match: AI call failed, using fallback:", err);
    const response: MatchResponse = {
      results: fallbackMatch(answers),
      usedFallback: true,
    };
    return NextResponse.json(response);
  }
}
