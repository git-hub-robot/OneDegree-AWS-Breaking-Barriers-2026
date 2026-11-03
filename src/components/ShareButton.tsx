"use client";

import { useState } from "react";
import { buildShareUrl } from "@/lib/share";
import type { ScreenerAnswers } from "@/lib/types";

export default function ShareButton({
  answers,
}: {
  answers: ScreenerAnswers;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const url = buildShareUrl(origin, answers);

    // Prefer the native share sheet on mobile, fall back to clipboard.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "BenefitFinder results",
          text: "Programs you may qualify for",
          url,
        });
        return;
      } catch {
        // user cancelled or share failed; fall through to copy
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked — show the URL so it can be copied manually.
      window.prompt("Copy this link to share:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-2 rounded-lg border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
    >
      {copied ? "Link copied!" : "Share these results"}
    </button>
  );
}
