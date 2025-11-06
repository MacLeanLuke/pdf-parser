# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when contributing to this repository.

## Development Commands

- `npm run dev` – start the Next.js development server at http://localhost:3000
- `npm run build` – produce a production build
- `npm run start` – run the built app
- `npm run lint` – run ESLint

## Architecture Overview

Eligibility Finder is a Next.js 14 (App Router) application that ingests program PDFs or public website pages for homeless-services and housing support, extracts structured eligibility information with OpenAI, and persists the result in PostgreSQL through Drizzle ORM.

### Backend

- **PDF Parsing**: `lib/pdf-parser.ts` wraps `pdf-parse` with fallbacks and cleaning.
- **AI Extraction**: `lib/eligibility-extractor.ts` uses the Vercel AI SDK (`ai` + `@ai-sdk/openai`) alongside the Zod schema defined in `lib/eligibility-schema.ts`.
- **Database**: `db/schema.ts` defines the `eligibility_documents` table and `db/index.ts` connects via `pg`. Migrations live in `drizzle/`.
- **API Routes**:
  - `POST /api/parse-eligibility` handles PDF uploads, parsing, AI extraction, persistence, and JSON response.
  - `POST /api/parse-url` fetches a website, extracts readable text, runs the same eligibility pipeline, and stores the row with `sourceType = "web"`.
  - `GET /api/eligibility-records` lists/searches records with optional text/source filters.
  - `GET /api/eligibility-records/[id]` returns the full details for a single record.

### Frontend

- Single-page interface (`app/page.tsx`) with tabs for PDF upload and website ingestion, a shared result viewer, and a searchable history panel.
- Tailwind CSS with a custom brand system (see `components/ui/*` and `app/docs/brand/page.tsx`) keeps visuals cohesive.

### Environment

Required environment variables:

- `OPENAI_API_KEY`
- `DATABASE_URL`
- `OPENAI_MODEL` (optional override, defaults to `gpt-4.1`)

### Testing Ideas

- Upload representative PDFs with known eligibility sections.
- Verify history/search updates when ingesting records from both sources.
- Confirm database rows are created and truncated raw text behaves as expected for large documents.
