"use client";

import { eligibilitySchema, eligibilitySystemPrompt } from "./eligibility-schema";
import {
  buildEligibilityUserPrompt,
  sanitizeEligibilityText,
  type BaseExtractEligibilityOptions,
} from "./eligibility-shared";
import { createBrowserAiProvider } from "./ai-providers";
import type { Eligibility } from "./eligibility-schema";

const DEFAULT_BROWSER_LIMIT = 12_000;

export type BrowserExtractEligibilityOptions = BaseExtractEligibilityOptions & {
  requestAccess?: boolean;
};

export async function tryExtractEligibilityInBrowser(
  options: BrowserExtractEligibilityOptions,
): Promise<Eligibility | null> {
  const providerState = await createBrowserAiProvider();

  const provider = await resolveProvider(providerState, options.requestAccess);
  if (!provider) {
    return null;
  }

  const sanitized = sanitizeEligibilityText(
    options.text,
    options.maxCharacters ??
      (options.sourceType === "web" ? DEFAULT_BROWSER_LIMIT : 40_000),
  );

  try {
    const { object } = await provider.generateObject<Eligibility>({
      schema: eligibilitySchema,
      messages: [
        { role: "system", content: eligibilitySystemPrompt },
        {
          role: "user",
          content: `${buildEligibilityUserPrompt(options, sanitized)}\n\nRespond only with a JSON object that matches the schema.`,
        },
      ],
    });

    return object;
  } catch (error) {
    console.warn("Browser eligibility extraction failed", error);
    return null;
  }
}

async function resolveProvider(
  state: Awaited<ReturnType<typeof createBrowserAiProvider>>,
  requestAccess = false,
) {
  if (state.status === "ready") {
    return state.provider;
  }

  if (state.status === "permission-required" && requestAccess) {
    const next = await state.requestAccess();
    return resolveProvider(next, false);
  }

  return null;
}
