import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BenefitFinder — Find help you may qualify for",
  description:
    "Answer a few quick questions and see social service programs you may qualify for, with clear reasons and links to apply.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-4">
            <span
              aria-hidden
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white"
            >
              B
            </span>
            <div>
              <p className="text-lg font-semibold leading-tight text-slate-900">
                BenefitFinder
              </p>
              <p className="text-xs leading-tight text-slate-500">
                Find help you may qualify for
              </p>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-3xl px-4 py-8 text-center text-xs text-slate-400">
          BenefitFinder is a demo tool. It does not make official eligibility
          decisions.
        </footer>
      </body>
    </html>
  );
}
