"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Eligibility = {
  programName: string | null;
  rawEligibilityText: string;
  population: string[];
  genderRestriction: string;
  requirements: string[];
  locationConstraints: string[];
  maxStayDays: number | null;
  ageRange: {
    min: number | null;
    max: number | null;
  };
  notes: string;
};

type EligibilityRecord = {
  id: string;
  programName: string | null;
  rawEligibilityText: string;
  eligibility: Eligibility;
  createdAt: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
};

type HistoryResponse = {
  items: Array<{
    id: string;
    programName: string | null;
    fileName: string;
    createdAt: string;
    rawEligibilityText: string;
    eligibilityJson: Eligibility;
    fileSize: number;
    mimeType: string;
  }>;
};

const formatBytes = (bytes: number | null | undefined) => {
  if (!bytes) return "—";

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const formatDateTime = (timestamp: string | null | undefined) => {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleString();
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EligibilityRecord | null>(null);
  const [history, setHistory] = useState<EligibilityRecord[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch("/api/history");
        if (!response.ok) return;
        const data: HistoryResponse = await response.json();
        const mapped = data.items.map<EligibilityRecord>((item) => ({
          id: item.id,
          programName: item.programName,
          rawEligibilityText: item.rawEligibilityText,
          eligibility: item.eligibilityJson,
          createdAt: item.createdAt,
          fileName: item.fileName,
          fileSize: item.fileSize,
          mimeType: item.mimeType,
        }));
        setHistory(mapped);
      } catch (historyError) {
        console.error("Failed to load history", historyError);
      }
    };

    loadHistory();
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    setFile(selected ?? null);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError("Please select a PDF to analyze.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/parse-eligibility", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to analyze PDF.");
      }

      const payload = (await response.json()) as EligibilityRecord;
      setResult(payload);
      setHistory((prev) => {
        const deduped = [payload, ...prev.filter((item) => item.id !== payload.id)];
        return deduped.slice(0, 10);
      });
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (submitError) {
      console.error(submitError);
      setError(submitError instanceof Error ? submitError.message : "Unable to analyze the PDF.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasResult = Boolean(result);

  const structuredFields = useMemo(() => {
    if (!result) return [];

    const { eligibility } = result;
    const fields: Array<{ label: string; value: string | string[] }> = [
      {
        label: "Population",
        value: eligibility.population,
      },
      {
        label: "Gender Restriction",
        value: eligibility.genderRestriction.replace(/_/g, " "),
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

    return fields;
  }, [result]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-12 md:py-16">
        <header className="space-y-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Eligibility PDF Ingestor
          </h1>
          <p className="text-base text-slate-300 md:text-lg">
            Upload a program PDF and extract structured eligibility information for homeless-services and housing programs.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40 backdrop-blur"
        >
          <div className="space-y-4">
            <label
              htmlFor="pdf-file"
              className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 transition hover:border-slate-500 hover:bg-slate-900/60"
            >
              <span className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
                Program PDF
              </span>
              <span className="text-lg font-semibold text-slate-100">
                {file?.name ?? "Select a PDF file"}
              </span>
              <span className="text-sm text-slate-400">
                Maximum 10 MB. We only support PDF files at the moment.
              </span>
              <input
                ref={fileInputRef}
                id="pdf-file"
                name="file"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-100"
              >
                Choose File
              </button>
            </label>

            {error && (
              <p className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                {error}
              </p>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-slate-400">
              {file
                ? `${file.type || "application/pdf"} • ${formatBytes(file.size)}`
                : "No file selected"}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-emerald-400 px-6 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Analyzing…" : "Analyze PDF"}
            </button>
          </div>
        </form>

        {hasResult && result && (
          <section className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/40">
            <header className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Analysis Result
                </p>
                <h2 className="text-2xl font-semibold text-slate-50">
                  {result.programName || "Unknown program"}
                </h2>
              </div>
              <div className="text-xs text-slate-400">
                <span>{result.fileName}</span>
                <span className="mx-2 opacity-50">•</span>
                <span>{formatBytes(result.fileSize)}</span>
                <span className="mx-2 opacity-50">•</span>
                <span>{formatDateTime(result.createdAt)}</span>
              </div>
            </header>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Extracted Eligibility Section
                </h3>
                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-sm leading-relaxed text-slate-200">
                  {result.rawEligibilityText || result.eligibility.rawEligibilityText}
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
                                  {value.replace(/_/g, " ")}
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
                  {JSON.stringify(result.eligibility, null, 2)}
                </pre>
              </details>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-lg shadow-slate-950/40">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Recent Documents
              </p>
              <h2 className="text-lg font-semibold text-slate-50">
                History
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              {history.length ? `${history.length} loaded` : "No history yet"}
            </span>
          </header>

          <div className="mt-4 space-y-3">
            {history.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setResult(item)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-left transition hover:border-emerald-500/50 hover:bg-slate-950/70"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      {item.programName || "Unknown program"}
                    </p>
                    <p className="text-xs text-slate-500">{item.fileName}</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {formatDateTime(item.createdAt)}
                  </p>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {item.rawEligibilityText}
                </p>
              </button>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
