import { act, renderHook } from "@testing-library/react-hooks";
import { waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useBuiltInAiInterpreter } from "../useBuiltInAiInterpreter";

vi.mock("@vercel/analytics/react", () => ({
  track: vi.fn(),
}));

describe("useBuiltInAiInterpreter", () => {
  beforeEach(() => {
    delete (window as any).ai;
    vi.clearAllMocks();
  });

  it("interprets queries when Chrome AI is available", async () => {
    mockWindowAi(() =>
      JSON.stringify({
        textQuery: "Dallas",
        populations: ["families"],
        genderRestriction: null,
        locations: ["Dallas County"],
        requirementsInclude: [],
      }),
    );

    const { result } = renderHook(() => useBuiltInAiInterpreter());

    await waitFor(() => expect(result.current.status).toBe("ready"));

    let filters = null;
    await act(async () => {
      filters = await result.current.interpret(
        "Families needing shelter in Dallas County",
      );
    });

    expect(filters).toEqual({
      textQuery: "Dallas",
      populations: ["families"],
      genderRestriction: null,
      locations: ["Dallas County"],
      requirementsInclude: [],
    });
    expect(result.current.lastRun).toBe("chrome");
  });

  it("falls back when Chrome AI is unavailable", async () => {
    const { result } = renderHook(() => useBuiltInAiInterpreter());

    await waitFor(() => expect(result.current.status).toBe("unavailable"));

    let filters = null;
    await act(async () => {
      filters = await result.current.interpret("any query");
    });

    expect(filters).toBeNull();
    expect(result.current.lastRun).toBe("fallback");
  });

  it("records errors when Chrome AI returns invalid JSON", async () => {
    mockWindowAi(() => "{not-valid}");

    const { result } = renderHook(() => useBuiltInAiInterpreter());

    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      const value = await result.current.interpret("test query");
      expect(value).toBeNull();
    });

    expect(result.current.lastRun).toBe("fallback");
    expect(result.current.lastError).toBeTruthy();
  });
});

function mockWindowAi(response: string | (() => string)) {
  (window as any).ai = {
    canCreateTextSession: () =>
      Promise.resolve({
        available: "readily" as const,
      }),
    createTextSession: async () => ({
      prompt: async () => (typeof response === "function" ? response() : response),
      destroy: () => undefined,
    }),
  };
}
