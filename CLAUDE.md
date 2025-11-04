# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when contributing to this repository.

## Development Commands

- `npm run dev` – start the Next.js development server at http://localhost:3000
- `npm run build` – produce a production build
- `npm run start` – run the built app
- `npm run lint` – run ESLint

## Architecture Overview

Eligibility PDF Ingestor is a Next.js 14 (App Router) application that ingests program PDFs for homeless-services and housing support, extracts structured eligibility information with OpenAI, and persists the result in PostgreSQL through Drizzle ORM.

### Backend

- **PDF Parsing**: `lib/pdf-parser.ts` wraps `pdf-parse` with fallbacks and cleaning.
- **AI Extraction**: `lib/eligibility-extractor.ts` uses the Vercel AI SDK (`ai` + `@ai-sdk/openai`) alongside the Zod schema defined in `lib/eligibility-schema.ts`.
- **Database**: `db/schema.ts` defines the `eligibility_documents` table and `db/index.ts` connects via `pg`. Migrations live in `drizzle/`.
- **API Routes**:
  - `POST /api/parse-eligibility` handles file upload, parsing, AI extraction, persistence, and JSON response.
  - `GET /api/history` returns the most recent ingestions for the UI.

### Frontend

- Single-page interface (`app/page.tsx`) with a PDF upload form, result display, collapsible JSON debug view, and history list.
- Tailwind CSS used for styling; minimal components to keep the UI focused.

### Environment

Required environment variables:

- `OPENAI_API_KEY`
- `DATABASE_URL`
- `OPENAI_MODEL` (optional override, defaults to `gpt-4.1`)

### Testing Ideas

- Upload representative PDFs with known eligibility sections.
- Verify history list updates and handles empty states.
- Confirm database rows are created and truncated raw text behaves as expected for large documents.
