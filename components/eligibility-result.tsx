import { useMemo } from "react";
import type { Eligibility } from "@/lib/eligibility-schema";

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

const SOURCE_BADGES: Record<EligibilityRecordDetail["sourceType"], string> = {
  pdf: "PDF",
  web: "Website",
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

  return (
    <section className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/40">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Analysis Result
          </p>
          <h2 className="text-2xl font-semibold text-slate-50">{heading}</h2>
          <dl className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
            <div>
              <dt className="uppercase tracking-[0.2em] text-slate-500">
                Source
              </dt>
              <dd className="mt-1 inline-flex items-center gap-2">
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200">
                  {SOURCE_BADGES[record.sourceType]}
                </span>
                {record.sourceUrl && (
                  <a
                    href={record.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-300 underline decoration-dotted underline-offset-4 hover:text-emerald-200"
                  >
                    Open source
                  </a>
                )}
              </dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.2em] text-slate-500">
                Captured
              </dt>
              <dd className="mt-1 text-slate-300">
                {formatDateTime(record.createdAt)}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      {record.pageTitle && record.sourceType === "web" && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
          <span className="font-semibold text-slate-200">Page title: </span>
          {record.pageTitle}
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Extracted Eligibility Section
        </h3>
        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-sm leading-relaxed text-slate-200">
          {record.rawEligibilityText}
        </pre>
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Structured Eligibility
        </h3>
        <dl className="mt-3 grid gap-4 md:grid-cols-2">
          {structuredFields.map((field) => (
            <div
              key={field.label}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
            >
              <dt className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                {field.label}
              </dt>
              <dd className="mt-2 text-sm text-slate-50">
                {Array.isArray(field.value) ? (
                  field.value.length ? (
                    <div className="flex flex-wrap gap-2">
                      {field.value.map((value) => (
                        <span
                          key={value}
                          className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300"
                        >
                          {humanize(value)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )
                ) : (
                  <span className="text-slate-100">{field.value}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <details className="group rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-200">
          View raw JSON
        </summary>
        <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-slate-950/90 p-4 text-xs text-emerald-200">
          {JSON.stringify(record.eligibility, null, 2)}
        </pre>
      </details>

      {record.rawTextSnippet && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Raw Text Snippet
          </h3>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs leading-relaxed text-slate-300">
            {record.rawTextSnippet}
          </pre>
        </div>
      )}
    </section>
  );
}

export default EligibilityResult;
