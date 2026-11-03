"use client";

import { useState } from "react";
import type {
  ScreenerAnswers,
  EmploymentStatus,
  HousingStatus,
  ResidencyStatus,
} from "@/lib/types";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
];

const EMPLOYMENT_OPTIONS: { value: EmploymentStatus; label: string }[] = [
  { value: "employed", label: "Working for an employer" },
  { value: "self_employed", label: "Self-employed" },
  { value: "unemployed", label: "Not working right now" },
  { value: "retired", label: "Retired" },
  { value: "unable_to_work", label: "Unable to work" },
];

const HOUSING_OPTIONS: { value: HousingStatus; label: string }[] = [
  { value: "rent", label: "I rent my home" },
  { value: "own", label: "I own my home" },
  { value: "unstable", label: "My housing is not stable" },
  { value: "homeless", label: "I don't have stable housing" },
  { value: "other", label: "Other" },
];

const RESIDENCY_OPTIONS: { value: ResidencyStatus; label: string }[] = [
  { value: "citizen", label: "U.S. citizen" },
  { value: "lawful_resident", label: "Lawfully present (green card, visa, etc.)" },
  { value: "other_or_unsure", label: "Other or not sure" },
];

const DEFAULT_ANSWERS: ScreenerAnswers = {
  householdSize: 1,
  monthlyIncome: 0,
  state: "",
  hasChildren: false,
  isPregnant: false,
  employment: "employed",
  housing: "rent",
  residency: "citizen",
};

const TOTAL_STEPS = 3;

export interface QuestionnaireProps {
  initialAnswers?: Partial<ScreenerAnswers>;
  onSubmit: (answers: ScreenerAnswers) => void;
}

export default function Questionnaire({
  initialAnswers,
  onSubmit,
}: QuestionnaireProps) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<ScreenerAnswers>({
    ...DEFAULT_ANSWERS,
    ...initialAnswers,
  });
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ScreenerAnswers>(
    key: K,
    value: ScreenerAnswers[K],
  ) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function validateStep(current: number): string | null {
    if (current === 1) {
      if (!Number.isFinite(answers.householdSize) || answers.householdSize < 1) {
        return "Household size must be at least 1.";
      }
      if (!Number.isFinite(answers.monthlyIncome) || answers.monthlyIncome < 0) {
        return "Monthly income can't be negative.";
      }
      if (!answers.state) {
        return "Please choose your state.";
      }
    }
    return null;
  }

  function next() {
    const problem = validateStep(step);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  }

  function handleSubmit() {
    const problem = validateStep(1);
    if (problem) {
      setError(problem);
      setStep(1);
      return;
    }
    setError(null);
    onSubmit(answers);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
          <span>
            Step {step} of {TOTAL_STEPS}
          </span>
          <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {step === 1 && (
        <fieldset className="space-y-5">
          <legend className="mb-2 text-xl font-semibold text-slate-900">
            About your household
          </legend>

          <div>
            <label
              htmlFor="householdSize"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              How many people live in your home? (including you)
            </label>
            <input
              id="householdSize"
              type="number"
              min={1}
              value={answers.householdSize}
              onChange={(e) =>
                update("householdSize", parseInt(e.target.value, 10) || 0)
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>

          <div>
            <label
              htmlFor="monthlyIncome"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              About how much money does your household make each month? (before
              taxes)
            </label>
            <div className="flex items-center rounded-lg border border-slate-300 px-3 focus-within:border-brand-600 focus-within:ring-1 focus-within:ring-brand-600">
              <span className="text-slate-500">$</span>
              <input
                id="monthlyIncome"
                type="number"
                min={0}
                value={answers.monthlyIncome}
                onChange={(e) =>
                  update("monthlyIncome", parseInt(e.target.value, 10) || 0)
                }
                className="w-full px-2 py-2 text-slate-900 focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              A rough number is fine.
            </p>
          </div>

          <div>
            <label
              htmlFor="state"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              What state do you live in?
            </label>
            <select
              id="state"
              value={answers.state}
              onChange={(e) => update("state", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            >
              <option value="">Choose a state…</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="space-y-5">
          <legend className="mb-2 text-xl font-semibold text-slate-900">
            Your family
          </legend>

          <Toggle
            label="Do you have children under 18 in your home?"
            checked={answers.hasChildren}
            onChange={(v) => update("hasChildren", v)}
          />
          <Toggle
            label="Is anyone in your home pregnant right now?"
            checked={answers.isPregnant}
            onChange={(v) => update("isPregnant", v)}
          />

          <RadioGroup
            label="What best describes your work right now?"
            name="employment"
            value={answers.employment}
            options={EMPLOYMENT_OPTIONS}
            onChange={(v) => update("employment", v)}
          />
        </fieldset>
      )}

      {step === 3 && (
        <fieldset className="space-y-5">
          <legend className="mb-2 text-xl font-semibold text-slate-900">
            Housing and status
          </legend>

          <RadioGroup
            label="What is your housing situation?"
            name="housing"
            value={answers.housing}
            options={HOUSING_OPTIONS}
            onChange={(v) => update("housing", v)}
          />

          <RadioGroup
            label="What is your immigration or residency status?"
            name="residency"
            value={answers.residency}
            options={RESIDENCY_OPTIONS}
            onChange={(v) => update("residency", v)}
          />
          <p className="text-xs text-slate-500">
            We only use this to show programs that may fit. We don&apos;t store
            or share your answers.
          </p>
        </fieldset>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={back}
          disabled={step === 1}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-40"
        >
          Back
        </button>

        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={next}
            className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            See my results
          </button>
        )}
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex gap-2">
        <button
          type="button"
          aria-pressed={checked}
          onClick={() => onChange(true)}
          className={`rounded-lg border px-4 py-1.5 text-sm font-medium ${
            checked
              ? "border-brand-600 bg-brand-50 text-brand-700"
              : "border-slate-300 text-slate-600"
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          aria-pressed={!checked}
          onClick={() => onChange(false)}
          className={`rounded-lg border px-4 py-1.5 text-sm font-medium ${
            !checked
              ? "border-brand-600 bg-brand-50 text-brand-700"
              : "border-slate-300 text-slate-600"
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}

function RadioGroup<T extends string>({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>
      <div className="space-y-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
              value === opt.value
                ? "border-brand-600 bg-brand-50 text-brand-800"
                : "border-slate-300 text-slate-700"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="h-4 w-4 accent-brand-600"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}
