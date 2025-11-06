import { useMemo } from "react";
import type { Eligibility } from "@/lib/eligibility-schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, FileText, CalendarDays, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type EligibilityRecordDetail = {
  programName: string | null;
  sourceType: "pdf" | "web";
  sourceUrl: string | null;
  pageTitle: string | null;
  rawEligibilityText: string;
  rawTextSnippet?: string;
  eligibility: Eligibility;
  createdAt: string;
};

const SOURCE_META: Record<
  EligibilityRecordDetail["sourceType"],
  { label: string; icon: typeof FileText }
> = {
  pdf: { label: "PDF", icon: FileText },
  web: { label: "Website", icon: Globe },
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

function humanize(value: string) {
  return value.replace(/_/g, " ");
}

export function EligibilityResult({ record }: { record: EligibilityRecordDetail }) {
  const structuredFields = useMemo(() => {
    const { eligibility } = record;

    return [
      {
        label: "Population",
        value: eligibility.population,
      },
      {
        label: "Gender Restriction",
        value: eligibility.genderRestriction
          ? humanize(eligibility.genderRestriction)
          : "any",
      },
      {
        label: "Requirements",
        value: eligibility.requirements,
      },
      {
        label: "Location Constraints",
        value: eligibility.locationConstraints,
      },
      {
        label: "Max Stay (days)",
        value:
          eligibility.maxStayDays !== null && eligibility.maxStayDays !== undefined
            ? String(eligibility.maxStayDays)
            : "—",
      },
      {
        label: "Age Range",
        value:
          eligibility.ageRange.min || eligibility.ageRange.max
            ? `${eligibility.ageRange.min ?? "—"} – ${eligibility.ageRange.max ?? "—"}`
            : "—",
      },
      {
        label: "Notes",
        value: eligibility.notes?.trim() ? eligibility.notes : "—",
      },
    ];
  }, [record]);

  const heading =
    record.programName ||
    record.pageTitle ||
    record.sourceUrl ||
    "Unknown program";

  const SourceIcon = SOURCE_META[record.sourceType].icon;

  return (
    <Card className="space-y-6">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Badge className="gap-2">
            <SourceIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {SOURCE_META[record.sourceType].label}
          </Badge>
          <CardTitle className="text-2xl font-semibold text-brand-heading">
            {heading}
          </CardTitle>
          <p className="flex flex-wrap items-center gap-2 text-sm text-brand-muted">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Captured {formatDateTime(record.createdAt)}
            {record.sourceUrl && (
              <>
                <span className="text-brand-border">•</span>
                <Link
                  href={record.sourceUrl}
                  className="inline-flex items-center gap-1 text-brand-blue underline decoration-dotted underline-offset-4 hover:text-brand-heading"
                  target="_blank"
                  rel="noreferrer"
                >
                  <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  Source link
                </Link>
              </>
            )}
          </p>
        </div>
        {record.pageTitle && record.sourceType === "web" && (
          <div className="max-w-sm rounded-2xl border border-brand-border bg-brand-background px-4 py-3 text-sm text-brand-muted">
            <span className="font-semibold text-brand-heading">Page title:</span>{" "}
            {record.pageTitle}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-muted">
            Extracted eligibility section
          </h3>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl border border-brand-border bg-brand-background p-4 text-sm leading-relaxed text-brand-body">
            {record.rawEligibilityText}
          </pre>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-muted">
            Structured eligibility
          </h3>
          <dl className="mt-4 grid gap-4 md:grid-cols-2">
            {structuredFields.map((field) => (
              <div
                key={field.label}
                className="rounded-2xl border border-brand-border bg-brand-background p-4"
              >
                <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-muted">
                  {field.label}
                </dt>
                <dd className="mt-2 text-sm text-brand-heading">
                  {Array.isArray(field.value) ? (
                    field.value.length ? (
                      <div className="flex flex-wrap gap-2">
                        {field.value.map((value) => (
                          <Badge
                            key={value}
                            variant={
                              field.label === "Population" ? "default" : "slate"
                            }
                            className={cn(
                              field.label === "Population" &&
                                "bg-brand-blue/10 text-brand-blue",
                            )}
                          >
                            {humanize(value)}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-brand-muted">—</span>
                    )
                  ) : (
                    <span>{field.value}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <details className="group rounded-2xl border border-brand-border bg-brand-background p-4">
          <summary className="cursor-pointer text-sm font-semibold text-brand-heading">
            View raw JSON
          </summary>
          <pre className="mt-3 max-h-72 overflow-auto rounded-2xl bg-white p-4 text-xs text-brand-muted">
            {JSON.stringify(record.eligibility, null, 2)}
          </pre>
        </details>

        {record.rawTextSnippet && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-muted">
              Raw text snippet
            </h3>
            <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-2xl border border-brand-border bg-brand-background p-4 text-xs leading-relaxed text-brand-muted">
              {record.rawTextSnippet}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EligibilityResult;
