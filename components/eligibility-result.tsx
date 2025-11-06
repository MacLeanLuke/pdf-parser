import { useMemo, type ReactNode } from "react";
import type { Eligibility } from "@/lib/eligibility-schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, FileText, CalendarDays, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

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
  pdf: { label: "Saved from PDF file", icon: FileText },
  web: { label: "Saved from website page", icon: Globe },
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
  const details = useMemo(() => {
    const { eligibility } = record;

    const genderLabel =
      eligibility.genderRestriction && eligibility.genderRestriction !== "any"
        ? humanize(eligibility.genderRestriction)
        : "Anyone";

    const ageLabel =
      eligibility.ageRange.min || eligibility.ageRange.max
        ? `${eligibility.ageRange.min ?? "any age"} to ${
            eligibility.ageRange.max ?? "any age"
          }`
        : "All ages";

    const maxStay =
      eligibility.maxStayDays !== null && eligibility.maxStayDays !== undefined
        ? `${eligibility.maxStayDays} day${eligibility.maxStayDays === 1 ? "" : "s"}`
        : null;

    return {
      populations: eligibility.population,
      gender: genderLabel,
      ageRange: ageLabel,
      requirements: eligibility.requirements,
      locations: eligibility.locationConstraints,
      maxStay,
      notes: eligibility.notes?.trim() ?? "",
    };
  }, [record]);

  const heading =
    record.programName ||
    record.pageTitle ||
    record.sourceUrl ||
    "Service name coming soon";

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
        <SectionBlock title="Who this helps">
          <div className="flex flex-wrap gap-2">
            {details.populations.length ? (
              details.populations.map((population) => (
                <Badge key={population} variant="slate">
                  {humanize(population)}
                </Badge>
              ))
            ) : (
              <Badge variant="slate">Anyone welcome</Badge>
            )}
            <Badge variant="slate">{details.gender}</Badge>
            <Badge variant="slate">{details.ageRange}</Badge>
          </div>
        </SectionBlock>

        <SectionBlock title="What’s required">
          {details.requirements.length ? (
            <div className="flex flex-wrap gap-2">
              {details.requirements.map((req) => (
                <Badge key={req} variant="slate">
                  {humanize(req)}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-brand-muted">
              No specific requirements were mentioned in the document.
            </p>
          )}
        </SectionBlock>

        <SectionBlock title="Where it is">
          {details.locations.length ? (
            <div className="flex flex-wrap gap-2">
              {details.locations.map((location) => (
                <Badge key={location} variant="slate">
                  {location}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-brand-muted">
              The page didn’t list a specific city or service area.
            </p>
          )}
        </SectionBlock>

        <SectionBlock title="How long you can stay">
          <p className="text-sm text-brand-muted">
            {details.maxStay ?? "Stay length wasn’t specified."}
          </p>
        </SectionBlock>

        <SectionBlock title="Anything else to know">
          <p className="text-sm text-brand-muted">
            {details.notes || "No additional notes were provided."}
          </p>
        </SectionBlock>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-muted">
            Details from the source
          </h3>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl border border-brand-border bg-brand-background p-4 text-sm leading-relaxed text-brand-body">
            {record.rawEligibilityText}
          </pre>
        </div>

        <details className="group rounded-2xl border border-brand-border bg-brand-background p-4">
          <summary className="cursor-pointer text-sm font-semibold text-brand-heading">
            View the structured data
          </summary>
          <pre className="mt-3 max-h-72 overflow-auto rounded-2xl bg-white p-4 text-xs text-brand-muted">
            {JSON.stringify(record.eligibility, null, 2)}
          </pre>
        </details>

        {record.rawTextSnippet && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-muted">
              Quick summary from the source
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

function SectionBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-muted">
        {title}
      </h3>
      {children}
    </div>
  );
}
