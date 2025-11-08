# Chrome Built-In AI Integration

Mercy Networks opportunistically uses Chrome's on-device models (`window.ai`) when the browser exposes them. This enables private, low-latency interpretation of search queries and optional website extraction previews without sending sensitive data to the server.

## Feature flags

Client-side extraction is guarded by the `NEXT_PUBLIC_ENABLE_BROWSER_EXTRACTION` environment variable. Set it to `true` to allow browser-based eligibility extraction attempts before calling the server APIs. When disabled, the app immediately falls back to the existing server flows.

## Query interpretation

The search page uses the `useBuiltInAiInterpreter` hook (`app/hooks/useBuiltInAiInterpreter.ts`) to detect model availability and interpret natural-language queries into structured filters. The hook:

- Checks `window.ai.canCreateTextSession()` and requests permission when needed.
- Emits analytics via `@vercel/analytics` to monitor availability and fallback rates.
- Normalizes results through the shared `normalizeSearchFilters` helper so the server receives the same schema it expects.
- Tracks the most recent run outcome so the UI can surface "Chrome AI ready" / "Using server fallback" badges.

## Browser extraction previews

When `NEXT_PUBLIC_ENABLE_BROWSER_EXTRACTION` is enabled, manual URL ingests and web search previews try to fetch public HTML content directly from the browser. The helper trims the page text, runs the on-device model with `tryExtractEligibilityInBrowser`, and renders the resulting eligibility in the UI while the server ingest proceeds in the background. Cross-origin failures or model errors are logged via analytics and silently fall back to the normal server ingestion flow.

Because PDF parsing in the browser would require additional dependencies, PDF uploads still use the existing server-side parser.

## Developer notes

- The browser provider (`lib/ai-providers/browser.ts`) first attempts to load the AI SDK community provider (`@ai-sdk/built-in-ai`). If the package is unavailable, it gracefully falls back to a minimal wrapper around `window.ai`.
- Telemetry events: `chrome_ai_status`, `chrome_ai_interpretation`, and `chrome_ai_browser_extraction` are emitted through `@vercel/analytics` for observability.
- Vitest tests (`app/hooks/__tests__/useBuiltInAiInterpreter.test.tsx`) cover hook behavior, validating readiness detection and fallback logic.

For manual verification, use Chrome M127+ (or Canary with the "Prompt API for Gemini Nano" flag enabled) over HTTPS/localhost so `window.ai` is exposed.
