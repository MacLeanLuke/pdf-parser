import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Globe, Link as LinkIcon } from "lucide-react";
import EligibilityResult from "@/components/eligibility-result";
import { db } from "@/db";
import { eligibilityDocuments } from "@/db/schema";
import type { Eligibility } from "@/lib/eligibility-schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type RecordDetail = {
  id: string;
  programName: string | null;
  sourceType: "pdf" | "web";
  sourceUrl: string | null;
  pageTitle: string | null;
  createdAt: string;
  rawEligibilityText: string;
  rawTextSnippet: string;
  eligibility: Eligibility;
};

const SOURCE_META: Record<
  RecordDetail["sourceType"],
  { label: string; icon: typeof FileText }
> = {
  pdf: { label: "PDF Source", icon: FileText },
  web: { label: "Website Source", icon: Globe },
};

async function getRecord(id: string): Promise<RecordDetail | null> {
  const record = await db.query.eligibilityDocuments.findFirst({
    where: eq(eligibilityDocuments.id, id),
  });

  if (!record) return null;

  return {
    id: record.id,
    programName: record.programName,
    sourceType: (record.sourceType as "pdf" | "web") ?? "pdf",
    sourceUrl: record.sourceUrl,
    pageTitle: record.pageTitle,
    createdAt: record.createdAt?.toISOString() ?? new Date().toISOString(),
    rawEligibilityText: record.rawEligibilityText,
    rawTextSnippet: createSnippet(record.rawText ?? "", 2000),
    eligibility: record.eligibilityJson as Eligibility,
  };
}

export default async function RecordPage({
  params,
}: {
  params: { id: string };
}) {
  const record = await getRecord(params.id);

  if (!record) {
    notFound();
  }

  const sourceMeta = SOURCE_META[record.sourceType];
  const SourceIcon = sourceMeta.icon;

  return (
    <div className="space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-full border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted transition hover:bg-brand-background hover:text-brand-heading"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to workspace
      </Link>

      <Card>
        <CardHeader className="space-y-4">
          <Badge className="flex w-fit items-center gap-2">
            <SourceIcon className="h-4 w-4" aria-hidden="true" />
            {sourceMeta.label}
          </Badge>
          <CardTitle className="text-3xl font-semibold text-brand-heading">
            {record.programName || record.pageTitle || "Eligibility record"}
          </CardTitle>
          <p className="text-sm text-brand-muted">
            Captured on {new Date(record.createdAt).toLocaleString()}
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-brand-muted">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-brand-heading">Record ID:</span>
            <code className="rounded-full bg-brand-background px-3 py-1 text-xs text-brand-muted">
              {record.id}
            </code>
          </div>
          {record.sourceUrl && (
            <Link
              href={record.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-brand-blue underline decoration-dotted underline-offset-4 hover:text-brand-heading"
            >
              <LinkIcon className="h-4 w-4" aria-hidden="true" />
              View source
            </Link>
          )}
        </CardContent>
      </Card>

      <EligibilityResult record={record} />
    </div>
  );
}

function createSnippet(text: string, maxLength: number) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}
