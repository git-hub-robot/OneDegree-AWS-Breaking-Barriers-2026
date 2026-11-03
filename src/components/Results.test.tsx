import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import Results from "./Results";
import type { MatchResult } from "@/lib/types";

function make(
  id: string,
  likelihood: MatchResult["likelihood"],
): MatchResult {
  return {
    programId: id,
    name: `Program ${id}`,
    category: "Food",
    summary: `Summary for ${id}`,
    likelihood,
    reason: `Reason for ${id}`,
    officialUrl: `https://example.com/${id}`,
  };
}

describe("Results", () => {
  it("always shows the safety disclaimer", () => {
    render(<Results results={[make("a", "likely")]} />);
    expect(screen.getByRole("note")).toHaveTextContent(
      /starting point, not an official decision/i,
    );
  });

  it("renders a card with reason, summary, category, and official link", () => {
    render(<Results results={[make("snap", "likely")]} />);
    expect(screen.getByText("Program snap")).toBeInTheDocument();
    expect(screen.getByText("Summary for snap")).toBeInTheDocument();
    expect(screen.getByText(/Reason for snap/)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /official site/i });
    expect(link).toHaveAttribute("href", "https://example.com/snap");
  });

  it("renders results in the order provided (already sorted upstream)", () => {
    const results = [
      make("x", "likely"),
      make("y", "possible"),
      make("z", "unlikely"),
    ];
    render(<Results results={results} />);
    const headings = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    expect(headings).toEqual(["Program x", "Program y", "Program z"]);
  });

  it("shows the 211 referral when there are no strong matches", () => {
    render(<Results results={[make("z", "unlikely")]} />);
    expect(screen.getByText(/don.t give up/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /211\.org/i })).toBeInTheDocument();
  });

  it("does not show the no-match message when there is a strong match", () => {
    render(<Results results={[make("a", "likely")]} />);
    expect(screen.queryByText(/don.t give up/i)).not.toBeInTheDocument();
  });

  it("shows a notice when results came from the fallback", () => {
    render(<Results results={[make("a", "likely")]} usedFallback />);
    expect(screen.getByText(/built-in rules/i)).toBeInTheDocument();
  });

  it("marks each likelihood with its label", () => {
    const results = [make("a", "likely"), make("b", "possible")];
    render(<Results results={results} />);
    const cards = screen.getAllByRole("listitem");
    expect(within(cards[0]).getByText(/Likely a match/i)).toBeInTheDocument();
    expect(within(cards[1]).getByText(/Possibly a match/i)).toBeInTheDocument();
  });
});
