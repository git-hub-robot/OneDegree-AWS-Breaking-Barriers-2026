import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ScreenerAnswers } from "@/lib/types";

// Mock the OpenAI SDK. The mock returns a fixed JSON completion.
const createMock = vi.fn();
vi.mock("openai", () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: createMock,
        },
      };
      constructor() {}
    },
  };
});

const answers: ScreenerAnswers = {
  householdSize: 3,
  monthlyIncome: 1200,
  state: "NY",
  hasChildren: true,
  isPregnant: false,
  employment: "employed",
  housing: "rent",
  residency: "citizen",
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/match", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/match", () => {
  const originalKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    createMock.mockReset();
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalKey;
    }
  });

  it("uses the deterministic fallback when no API key is set", async () => {
    delete process.env.OPENAI_API_KEY;
    const { POST } = await import("./route");

    const res = await POST(makeRequest(answers) as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.usedFallback).toBe(true);
    expect(data.results.length).toBe(6);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns AI results when a key is set and the call succeeds", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    createMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              results: [
                { programId: "snap", likelihood: "likely", reason: "Low income." },
                { programId: "medicaid", likelihood: "likely", reason: "Kids." },
              ],
            }),
          },
        },
      ],
    });

    const { POST } = await import("./route");
    const res = await POST(makeRequest(answers) as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.usedFallback).toBe(false);
    expect(data.results.length).toBe(6);
    const snap = data.results.find((r: { programId: string }) => r.programId === "snap");
    expect(snap.likelihood).toBe("likely");
    expect(snap.reason).toBe("Low income.");
    expect(createMock).toHaveBeenCalledOnce();
  });

  it("falls back when the AI call throws", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    createMock.mockRejectedValue(new Error("rate limited"));

    const { POST } = await import("./route");
    const res = await POST(makeRequest(answers) as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.usedFallback).toBe(true);
    expect(data.results.length).toBe(6);
  });

  it("rejects an invalid body with 400", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ foo: "bar" }) as never);
    expect(res.status).toBe(400);
  });
});
