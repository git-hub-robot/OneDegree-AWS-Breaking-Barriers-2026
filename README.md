# BenefitFinder

Answer a few plain-language questions and see U.S. social service programs you
**may** qualify for — with a clear reason for each and a link to the official
site to verify and apply. Built for a hackathon to help low-income families cut
through the discovery barrier: not knowing what exists.

Works for a family screening themselves, or a caseworker screening on someone's
behalf and sharing the results via a link.

## What it does

- A short 3-step questionnaire (household size, income, state, family, housing,
  status) written at a low reading level.
- An AI assistant ranks each seeded program as **likely / possible / unlikely**
  with a one-sentence reason.
- Results link straight to the official application page for each program.
- **Share these results** builds a link that re-runs the same screening — the
  caseworker-to-family handoff.

## Safety by design

- Results are always framed as programs you *may* qualify for — never an
  official decision. A disclaimer is shown on every results view.
- The AI prompt forbids inventing programs or guaranteeing eligibility and must
  only assess the seeded list.
- If the OpenAI key is missing or the API call fails, the app falls back to
  deterministic, rules-based estimates so a demo never hard-crashes.
- Program names, summaries, and official links always come from our own trusted
  data, not the model.

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- One server-side API route (`/api/match`) that holds the OpenAI key securely
- No database — program data is a committed TypeScript file, and shared results
  are encoded into the URL

## Getting started

```bash
npm install

# Optional: enable AI matching
cp .env.example .env.local   # then add your OPENAI_API_KEY

npm run dev                  # http://localhost:3000
```

Without a key, the app runs on the built-in rules-based fallback.

## Scripts

| Command          | What it does                          |
| ---------------- | ------------------------------------- |
| `npm run dev`    | Start the dev server                  |
| `npm run build`  | Production build                      |
| `npm run start`  | Serve the production build            |
| `npm test`       | Run the test suite (Vitest)           |

## Project structure

```
src/
  app/
    page.tsx              Landing page
    screener/page.tsx     Screener (Suspense wrapper)
    api/match/route.ts    AI matching endpoint + fallback
  components/
    Screener.tsx          Flow: form -> loading -> results
    Questionnaire.tsx     Multi-step form
    Results.tsx           Ranked result cards + disclaimer
    ShareButton.tsx       Build/copy a shareable link
  data/
    programs.ts           Seeded programs + validation
  lib/
    types.ts              Shared types
    matcher.ts            Prompt builder, fallback rules, AI parsing
    share.ts              Encode/decode answers in the URL
```

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel (it auto-detects Next.js).
3. Add an environment variable `OPENAI_API_KEY` (optional — omit to run on the
   fallback rules).
4. Deploy. Vercel gives you a public URL you can open on a phone.

## Important disclaimer

BenefitFinder is a demo tool. The eligibility signals are coarse and not legal
advice. Program rules and income limits vary by state and change over time.
Always confirm on the official site, or call **211** for free local help.
