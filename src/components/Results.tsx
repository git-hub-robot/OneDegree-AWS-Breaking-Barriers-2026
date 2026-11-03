import type { MatchResult, Likelihood } from "@/lib/types";

const LIKELIHOOD_STYLES: Record<
  Likelihood,
  { label: string; badge: string; dot: string }
> = {
  likely: {
    label: "Likely a match",
    badge: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  possible: {
    label: "Possibly a match",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  unlikely: {
    label: "Less likely",
    badge: "bg-slate-50 text-slate-500 border-slate-200",
    dot: "bg-slate-400",
  },
};

export interface ResultsProps {
  results: MatchResult[];
  usedFallback?: boolean;
}

export default function Results({ results, usedFallback }: ResultsProps) {
  const strong = results.filter((r) => r.likelihood !== "unlikely");
  const noStrongMatches = strong.length === 0;

  return (
    <div className="space-y-5">
      <div
        role="note"
        className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
      >
        <strong className="font-semibold">Please read:</strong> These are
        programs you <em>may</em> qualify for. This is a starting point, not an
        official decision. Always confirm on each program&apos;s official site,
        where you can also apply.
      </div>

      {noStrongMatches && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            We didn&apos;t find a strong match — don&apos;t give up
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Programs and limits vary a lot by state and situation. A local
            expert can often find help that a quick screen misses. Call{" "}
            <strong>211</strong> (free, 24/7) or visit{" "}
            <a
              href="https://www.211.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-700 underline"
            >
              211.org
            </a>{" "}
            to talk with someone near you.
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {results.map((r) => {
          const style = LIKELIHOOD_STYLES[r.likelihood];
          return (
            <li
              key={r.programId}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {r.name}
                  </h3>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {r.category}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${style.badge}`}
                >
                  <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                  {style.label}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-600">{r.summary}</p>

              <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                <span className="font-medium text-slate-900">Why: </span>
                {r.reason}
              </p>

              <a
                href={r.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                Learn more &amp; apply on the official site
                <span aria-hidden>→</span>
              </a>
            </li>
          );
        })}
      </ul>

      {usedFallback && (
        <p className="text-center text-xs text-slate-400">
          Results generated with built-in rules (AI assistant was not available).
        </p>
      )}
    </div>
  );
}
