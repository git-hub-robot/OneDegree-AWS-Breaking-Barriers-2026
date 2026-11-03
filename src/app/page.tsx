import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">
          See what help you may qualify for
        </h1>
        <p className="text-lg text-slate-600">
          Answer a few simple questions about your household. We&apos;ll show you
          social service programs you may be able to get, explain why, and link
          you to the official place to apply.
        </p>
        <Link
          href="/screener"
          className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-700"
        >
          Get started
        </Link>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            What this is
          </h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Takes about 2 minutes. No account needed.</li>
            <li>• Works for you, or for a helper screening with you.</li>
            <li>• A clear reason for each program, plus a link to apply.</li>
          </ul>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            What this isn&apos;t
          </h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Not an official eligibility decision.</li>
            <li>• Not legal or financial advice.</li>
            <li>
              • Always confirm on the official site, or call{" "}
              <strong>211</strong> for free local help.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
