# Search Reliability & UX Overhaul Technical Specification

**Author:** ChatGPT (gpt-5-codex)

**Date:** 2024-05-27

**Status:** Draft

## 1. Background

Mercy Networks' current eligibility search relies on a single-stage pattern match paired with LLM-based filter extraction. The API (`app/api/search-eligibility/route.ts`) issues one `ILIKE` query against several columns and leans on the AI interpreter to determine filters, causing brittle behavior and many false negatives when the LLM fails or when text does not exactly match the user's words.【F:app/api/search-eligibility/route.ts†L44-L177】 The front-end depends on this interpreter before each request and only shows a generic fallback when zero services are returned, offering no graded matches or actionable next steps.【F:app/page.tsx†L81-L146】【F:app/page.tsx†L1127-L1206】 The database schema lacks a unified search text field or specialized indexes, so fuzzy matching, ranking, and performance guarantees are not achievable today.【F:db/schema.ts†L1-L33】

## 2. Goals & Non-goals

### Goals
- Deliver reliable, low-latency search that surfaces at least one relevant result for realistic queries when the database contains a matching service.
- Interpret natural-language input deterministically and expose interpreted filters to the UI.
- Provide explainable results grouped by match quality and display clear fallback options when direct matches are unavailable.
- Add indexing and caching layers to keep p95 API latency under 500 ms while supporting fuzzy matching and location-aware ranking.

### Non-goals
- Redesign of ingestion pipelines beyond updating them to populate the new `search_text` field.
- Implementation of advanced geospatial proximity (e.g., lat/lng KNN) beyond simple location filters.
- Replacement of the existing AI interpreter—LLM assistance may remain as an optional enhancement but not part of the critical search path.

## 3. Proposed Solution Overview

Search will be rebuilt end-to-end with four pillars: (1) richer data for retrieval, (2) multi-stage deterministic querying, (3) ranked and annotated results, and (4) confident front-end presentation. The system maintains the existing API route and client components but rewrites their internals to support the new pipeline.

## 4. Data Model & Indexing Changes

1. **Search text materialization**
   - Add `search_text` and generated `search_tsv` columns to `eligibility_documents` via a Drizzle migration.
   - Populate `search_text` by concatenating program name, location (city/county/state), primary eligibility summary, tags, and any structured descriptors during ingestion/update flows.
   - Ensure defaults for existing rows (backfill migration to re-compute `search_text` and refresh the generated column).

2. **Indexes**
   - Enable `pg_trgm` extension.
   - Create GIN index on `search_tsv` for full-text queries.
   - Create trigram GIN index on `search_text` for similarity and wildcard searches.
   - Add B-tree indexes on `location_city` and `location_county` (requires extending the schema with these fields if not present; populate from existing metadata or leave nullable until data is available).

3. **Migration strategy**
   - Step 1: add nullable columns and indexes with backfill script.
   - Step 2: update application code to write `search_text`.
   - Step 3: once backfill completes, enforce `NOT NULL` on `search_text`.
   - Refresh materialized data after ingestion jobs run to guarantee coverage.

## 5. Backend API Redesign (`app/api/search-eligibility/route.ts`)

1. **Request contract**
   - Accept `{ query: string, filters?: { locationCity?, locationCounty?, state?, populations?, needType? } }`.
   - `limit` retained for pagination; default 20.

2. **Deterministic query interpretation**
   - Normalize query (lowercase, collapse whitespace) while storing original for highlighting.
   - Extract hints: location tokens (maintain configurable city/county/state lists), population keywords (`youth`, `families`, `LGBTQ`, etc.), and need types (`shelter`, `housing`, etc.). Merge with explicit filters and store as `interpretedFilters`.
   - Run any LLM-based enrichment asynchronously (fire-and-forget) or behind a feature flag. The main response is never blocked or invalidated by AI output.

3. **Multi-stage retrieval pipeline**
   - Stage 1: Full-text search constrained by explicit/parsed location; limit 20; compute `ts_rank_cd`.
   - Stage 2: Full-text without strict city/county if Stage 1 returns fewer than `STRONG_MATCH_THRESHOLD` (e.g., 5) but still preference for state if present.
   - Stage 3: Trigram similarity & wildcard fallback for fuzzy terms and typos.
   - Stage 4: Default broader matches (e.g., top services in state or nationally) flagged as `broader` to avoid empty responses.
   - Combine results with deduplication by ID while tracking which stages contributed each service.

4. **Scoring**
   - Base score from `ts_rank_cd` (if available) or trigram similarity.
   - Boosts: exact city match (+0.5), county (+0.3), state (+0.2), population/need tag matches (+0.4 each), recency bonus based on `created_at` decay.
   - Final sort by composite score then recency.

5. **Response shape**
   - Return `{ query, interpretedFilters, results: [{ service, matchReason[], matchTier }] }`.
   - `service` includes `id`, names, location summary, `matchSnippet` (highlighted snippet referencing matched tokens), source metadata, and `tags` for chips.

6. **Observability & caching**
   - Log query string, interpreted filters, stage usage, result counts, and latency.
   - Add optional short-lived cache (e.g., in-memory Map keyed by normalized query + filters) with TTL 120 seconds and size cap.
   - Ensure route exports `dynamic = 'force-dynamic'` to opt out of pre-render caching.

7. **Error handling**
   - Wrap DB calls; on failure return `{ error: "search_failed", message: "We couldn't run this search right now." }` with status 500.
   - Ensure partial results still return if later stages fail (e.g., Stage 3 error logs but does not abort Stage 1 output).

## 6. Front-end Experience Updates (`app/page.tsx` and related components)

1. **Request flow**
   - Call API with `{ query, filters }` directly; remove dependence on `useBuiltInAiInterpreter` on the hot path (retain only for optional suggestions).
   - Introduce optimistic loading state: disable submit button with spinner, render skeleton result cards (3-5 placeholders) instead of empty flash.

2. **Result presentation**
   - Group results by `matchTier`: `direct`, `nearby`, `fuzzy`. Use headings `Best matches`, `Other options near you`, `Broader & fuzzy matches`.
   - Each card displays program name, location chips, population/need chips, last-updated timestamp, and `Matched: …` caption derived from `matchReason`.
   - Provide quick filter chips reflecting `interpretedFilters`; allow users to clear/refine them inline.

3. **Zero-state & fallbacks**
   - If `results` empty, show strong message with:
     - Buttons: “Broaden search” (clear filters) and “Search the web” (open existing explorer prefilled with query).
     - CTA to add a new service (existing ingestion flow).
   - Continue to show Web Explorer results but as secondary enhancement (not triggered on every zero state once broadening occurs automatically).

4. **Perceived performance**
   - Maintain results list until new results arrive to avoid layout shift; overlay skeleton placeholders while new data fetches.
   - Stream updates: render Stage 1 results immediately; if API returns `pendingStages`, optionally update UI when additional tiers arrive (future enhancement if we expose incremental API).

5. **Accessibility & feedback**
   - Announce search completion via ARIA live region.
   - Ensure result cards have consistent keyboard focus states and “view details” buttons remain accessible.

## 7. Supporting Libraries & Utilities

- Add helper module (e.g., `lib/search-query.ts`) encapsulating normalization, token extraction, scoring helpers, and stage orchestration.
- Configure list of known locations/populations/needs in a dedicated config file for maintainability.
- Update ingestion utilities to compute `search_text` (e.g., inside PDF/web parsers) and to store structured location and tag data consistently.

## 8. Performance Considerations

- Expect Stage 1 queries to hit indexed `tsvector` operations with <100 ms execution for typical inputs.
- Stage 3 trigram queries may be slower; only run if earlier stages underperform and limit to 20 results.
- Cache repeated queries for short TTL; include metrics to monitor hit rate and eviction.
- Benchmark cold and warm requests; instrument to capture stage timings and response size.

## 9. Rollout Plan

1. Ship migrations and ingestion updates behind a feature flag that continues writing existing fields.
2. Deploy API changes with gating: if new pipeline fails, fall back to current `ILIKE` query for the request and log the incident.
3. Release front-end updates after verifying API response contract; ensure backwards compatibility during deployment by supporting both old and new response shapes temporarily (feature flag or runtime detection).
4. Conduct manual validation with 15–20 canonical queries covering natural language, typos, and structured hints.

## 10. Testing Strategy

- **Unit tests** for token extraction, scoring, and stage orchestration to ensure deterministic outcomes for known queries.
- **Integration tests** hitting a seeded Postgres database verifying pipeline progression and ranking order.
- **End-to-end tests** using Playwright: type queries, expect skeleton display, confirm grouped results and fallback messaging.
- **Performance tests** using k6 or custom scripts to assert p95 latency <500 ms under expected load.

## 11. Risks & Mitigations

- **Data gaps**: Missing location/tag data reduce ranking quality. Mitigation: fall back to fuzzy matching and highlight incomplete metadata in admin tooling.
- **Index maintenance**: Additional indexes increase write cost. Mitigation: measure impact; if necessary, defer trigram index to heavy-search deployments only.
- **Config drift**: Manual keyword lists may get stale. Mitigation: centralize config and schedule periodic review; optionally log unmatched tokens for analysis.
- **Complexity creep**: Multi-stage pipeline can become hard to reason about. Mitigation: document stages clearly and log stage transitions for observability.

## 12. Open Questions

- Do we have reliable structured location data for all services? If not, should we prompt ingestion to require it moving forward?
- Should Stage 4 return nationally-relevant services or restrict to same state? Needs product decision.
- What governance is needed for caching layer (e.g., clearing after ingestion updates)?

## 13. Success Metrics

- ≥90% of manual regression queries return a relevant `direct` match when data exists.
- p95 search latency (API + DB) under 500 ms in staging load tests.
- Reduction in “no results” states by at least 70% compared to baseline analytics.
- Positive qualitative feedback from internal test users on trust in search results.

