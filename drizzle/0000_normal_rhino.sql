CREATE TABLE "eligibility_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" bigint NOT NULL,
	"mime_type" varchar(128) NOT NULL,
	"raw_text" text NOT NULL,
	"raw_eligibility_text" text NOT NULL,
	"eligibility_json" jsonb NOT NULL,
	"program_name" varchar(255),
	"hash" varchar(128)
);
