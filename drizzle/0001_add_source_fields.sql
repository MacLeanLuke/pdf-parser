ALTER TABLE "eligibility_documents"
  ADD COLUMN "source_type" text NOT NULL DEFAULT 'pdf',
  ADD COLUMN "source_url" text,
  ADD COLUMN "page_title" text;
