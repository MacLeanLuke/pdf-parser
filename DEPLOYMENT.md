# Deployment Guide

This document covers deploying the Eligibility PDF Ingestor to a managed hosting provider such as Vercel or Fly.io with PostgreSQL enabled from day one.

## Prerequisites

- Node.js 18+ environment
- PostgreSQL instance (Supabase, Neon, RDS, etc.)
- OpenAI API key with access to the desired model (`gpt-4.1` by default)
- Drizzle migrations applied to the target database

## Environment Variables

| Variable         | Description                                                   |
| ---------------- | ------------------------------------------------------------- |
| `OPENAI_API_KEY` | Secret key used for calling OpenAI through the Vercel AI SDK |
| `DATABASE_URL`   | PostgreSQL connection string                                  |
| `OPENAI_MODEL`   | Optional; overrides the default model name (`gpt-4.1`)        |

Example `.env` snippet:

```bash
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
OPENAI_MODEL=gpt-4o-mini
```

## Setting Up the Database

1. Provision a PostgreSQL database.
2. Ensure extensions `pgcrypto` (for `gen_random_uuid`) is available.
3. Run the Drizzle migration against the database:

   ```bash
   npx drizzle-kit push
   ```

   The migration files live in the `drizzle/` directory and create the `eligibility_documents` table.

## Deploying to Vercel

1. Connect the repository to Vercel.
2. Add the environment variables in the Vercel dashboard (`Project Settings → Environment Variables`).
3. Trigger a deployment (`npm run build` is executed automatically).
4. After deployment, verify connectivity by uploading a sample PDF.

## Deploying to Other Platforms

For platforms such as Fly.io, Render, or Railway:

1. Build the Next.js production bundle (`npm run build`).
2. Run `npm run start` in the start command.
3. Provide the same environment variables with appropriate SSL requirements (many providers require `sslmode=require` inside the `DATABASE_URL`).

## Operational Notes

- The API routes connect to the database using a pooled connection with the `pg` driver. Tune pool settings in `db/index.ts` if your platform enforces strict connection limits.
- Large PDFs are truncated to 50k characters before being sent to OpenAI to manage prompt size.
- Logs from API routes (`/api/parse-eligibility` and `/api/history`) are available through the platform’s standard logging interface.
