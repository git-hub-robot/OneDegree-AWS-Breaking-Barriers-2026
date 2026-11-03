"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Questionnaire from "@/components/Questionnaire";
import Results from "@/components/Results";
import ShareButton from "@/components/ShareButton";
import { decodeAnswers } from "@/lib/share";
import type { ScreenerAnswers, MatchResponse } from "@/lib/types";

type Phase = "form" | "loading" | "results" | "error";

export default function Screener() {
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>("form");
  const [response, setResponse] = useState<MatchResponse | null>(null);
  const [answers, setAnswers] = useState<ScreenerAnswers | null>(null);
  const [sharedNotice, setSharedNotice] = useState(false);
  const [linkError, setLinkError] = useState(false);
  const autoRan = useRef(false);

  async function runMatch(submitted: ScreenerAnswers) {
    setAnswers(submitted);
    setPhase("loading");
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(submitted),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data: MatchResponse = await res.json();
      setResponse(data);
      setPhase("results");
    } catch {
      setPhase("error");
    }
  }

  // On first load, if a share token is present, decode and re-run it.
  useEffect(() => {
    if (autoRan.current) return;
    const token = searchParams.get("r");
    if (!token) return;
    autoRan.current = true;

    const decoded = decodeAnswers(token);
    if (!decoded) {
      setLinkError(true);
      return;
    }
    setSharedNotice(true);
    runMatch(decoded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function restart() {
    setResponse(null);
    setAnswers(null);
    setSharedNotice(false);
    setLinkError(false);
    setPhase("form");
  }

  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <div
          aria-label="Loading"
          className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600"
        />
        <p className="text-sm text-slate-600">
          Checking which programs may fit your household…
        </p>
      </div>
    );
  }

  if (phase === "results" && response && answers) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Your results</h1>
          <div className="flex items-center gap-3">
            <ShareButton answers={answers} />
            <button
              type="button"
              onClick={restart}
              className="text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              Start over
            </button>
          </div>
        </div>
        {sharedNotice && (
          <p className="rounded-lg border border-brand-100 bg-brand-50 p-3 text-sm text-brand-800">
            Showing results from a shared link. You can start over anytime to
            screen a different household.
          </p>
        )}
        <Results
          results={response.results}
          usedFallback={response.usedFallback}
        />
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm font-medium text-red-700">
          Something went wrong while checking your results. Please try again.
        </p>
        <button
          type="button"
          onClick={restart}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          A few quick questions
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          There are no wrong answers. Give your best estimate.
        </p>
      </div>
      {linkError && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          That shared link looked broken, so we started a fresh screening for
          you.
        </p>
      )}
      <Questionnaire
        initialAnswers={answers ?? undefined}
        onSubmit={runMatch}
      />
    </div>
  );
}
