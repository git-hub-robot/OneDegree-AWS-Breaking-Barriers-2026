import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Questionnaire from "./Questionnaire";
import type { ScreenerAnswers } from "@/lib/types";

describe("Questionnaire", () => {
  it("shows step 1 first", () => {
    render(<Questionnaire onSubmit={vi.fn()} />);
    expect(screen.getByText("About your household")).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
  });

  it("blocks advancing without a state and shows an error", async () => {
    const user = userEvent.setup();
    render(<Questionnaire onSubmit={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("alert")).toHaveTextContent("state");
    // still on step 1
    expect(screen.getByText("About your household")).toBeInTheDocument();
  });

  it("navigates forward and back between steps", async () => {
    const user = userEvent.setup();
    render(<Questionnaire onSubmit={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText(/state/i), "CA");
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Your family")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("About your household")).toBeInTheDocument();
  });

  it("assembles the correct answers object on submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(a: ScreenerAnswers) => void>();
    render(<Questionnaire onSubmit={onSubmit} />);

    // Step 1
    const sizeInput = screen.getByLabelText(/how many people/i);
    await user.clear(sizeInput);
    await user.type(sizeInput, "4");

    const incomeInput = screen.getByLabelText(/how much money/i);
    await user.clear(incomeInput);
    await user.type(incomeInput, "2500");

    await user.selectOptions(screen.getByLabelText(/state/i), "TX");
    await user.click(screen.getByRole("button", { name: "Next" }));

    // Step 2 — click "Yes" for the children question (first toggle row)
    const childrenRow = screen
      .getByText(/do you have children/i)
      .closest("div") as HTMLElement;
    await user.click(
      within(childrenRow).getByRole("button", { name: "Yes" }),
    );
    await user.click(screen.getByRole("button", { name: "Next" }));

    // Step 3 -> submit
    await user.click(screen.getByRole("button", { name: "See my results" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const arg = onSubmit.mock.calls[0][0];
    expect(arg.householdSize).toBe(4);
    expect(arg.monthlyIncome).toBe(2500);
    expect(arg.state).toBe("TX");
    expect(arg.hasChildren).toBe(true);
  });
});
