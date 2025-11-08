"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics/react";
import {
  searchFilterSchema,
  searchInterpretationPrompt,
  normalizeSearchFilters,
  type SearchFilter,
} from "@/lib/search-filter";
import {
  createBrowserAiProvider,
  type BrowserAiProviderState,
  type BrowserAiReadyProvider,
} from "@/lib/ai-providers";

export type ChromeInterpreterStatus =
  | "checking"
  | "ready"
  | "permission-required"
  | "unavailable"
  | "error";

export type ChromeInterpreterRun = "none" | "chrome" | "fallback";

type HookState = {
  status: ChromeInterpreterStatus;
  statusMessage: string | null;
  lastError: string | null;
  lastRun: ChromeInterpreterRun;
  interpret: (query: string) => Promise<SearchFilter | null>;
  refresh: () => Promise<void>;
  requestAccess: () => Promise<void>;
};

const MAX_QUERY_LENGTH = 400;

export function useBuiltInAiInterpreter(): HookState {
  const [status, setStatus] = useState<ChromeInterpreterStatus>("checking");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<ChromeInterpreterRun>("none");

  const providerRef = useRef<BrowserAiReadyProvider | null>(null);
  const permissionRequesterRef = useRef<(() => Promise<void>) | null>(null);

  const trackStatus = useCallback((nextStatus: ChromeInterpreterStatus) => {
    track("chrome_ai_status", { status: nextStatus });
  }, []);

  const installState = useCallback(
    async (
      state: BrowserAiProviderState,
      options: { requestPermission?: boolean } = {},
    ) => {
      if (state.status === "ready") {
        providerRef.current = state.provider;
        permissionRequesterRef.current = null;
        setStatus("ready");
        setStatusMessage(null);
        trackStatus("ready");
        return;
      }

      if (state.status === "permission-required") {
        providerRef.current = null;
        permissionRequesterRef.current = async () => {
          const next = await state.requestAccess();
          await installState(next);
        };
        setStatus("permission-required");
        setStatusMessage(
          state.reason ?? "Chrome built-in AI requires your permission.",
        );
        trackStatus("permission-required");
        if (options.requestPermission) {
          await permissionRequesterRef.current();
        }
        return;
      }

      providerRef.current = null;
      permissionRequesterRef.current = null;
      setStatus("unavailable");
      setStatusMessage(state.reason);
      trackStatus("unavailable");
    },
    [trackStatus],
  );

  const refresh = useCallback(
    async (requestPermission = false) => {
      setStatus("checking");
      setStatusMessage(null);
      setLastError(null);
      try {
        const state = await createBrowserAiProvider();
        await installState(state, { requestPermission });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to initialize Chrome built-in AI.";
        setStatus("error");
        setStatusMessage(message);
        setLastError(message);
        trackStatus("error");
      }
    },
    [installState, trackStatus],
  );

  useEffect(() => {
    void refresh(false);
  }, [refresh]);

  const requestAccess = useCallback(async () => {
    if (permissionRequesterRef.current) {
      setStatus("checking");
      setStatusMessage(null);
      setLastError(null);
      try {
        await permissionRequesterRef.current();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Chrome built-in AI permission was denied.";
        setStatus("error");
        setStatusMessage(message);
        setLastError(message);
        trackStatus("error");
      }
      return;
    }
    await refresh(true);
  }, [refresh, trackStatus]);

  const interpret = useCallback(
    async (query: string) => {
      setLastError(null);
      const provider = providerRef.current;
      if (!provider) {
        setLastRun("fallback");
        return null;
      }

      const trimmed = query.slice(0, MAX_QUERY_LENGTH);
      try {
        const { object } = await provider.generateObject({
          schema: searchFilterSchema,
          messages: [
            {
              role: "system",
              content: `${searchInterpretationPrompt}\n\nRespond only with a JSON object following the schema.`,
            },
            { role: "user", content: trimmed },
          ],
        });

        const normalized = normalizeSearchFilters(object, query);
        setLastRun("chrome");
        track("chrome_ai_interpretation", { status: "success" });
        return normalized;
      } catch (error) {
        console.warn("Chrome AI interpretation failed", error);
        const message =
          error instanceof Error ? error.message : "Chrome AI interpretation failed.";
        setLastRun("fallback");
        setLastError(message);
        track("chrome_ai_interpretation", {
          status: "error",
          reason: message.slice(0, 120),
        });
        return null;
      }
    },
    [],
  );

  return {
    status,
    statusMessage,
    lastError,
    lastRun,
    interpret,
    refresh: () => refresh(false),
    requestAccess,
  };
}
