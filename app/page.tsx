"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import EligibilityResult from "@/components/eligibility-result";
import type { Eligibility } from "@/lib/eligibility-schema";

type Tab = "pdf" | "web";

type EligibilityRecordDetail = {
  id: string;
  programName: string | null;
  sourceType: "pdf" | "web";
  sourceUrl: string | null;
  pageTitle: string | null;
  rawEligibilityText: string;
  rawTextSnippet: string;
  eligibility: Eligibility;
  createdAt: string;
};

type EligibilityRecordSummary = {
  id: string;
  programName: string | null;
  sourceType: "pdf" | "web";
  sourceUrl: string | null;
  pageTitle: string | null;
  createdAt: string;
  preview: string;
};

type ListResponseItem = {
  id: string;
  programName: string | null;
  sourceType: "pdf" | "web";
  sourceUrl: string | null;
  pageTitle: string | null;
  createdAt: string;
  preview: string;
};

const SOURCE_LABELS: Record<EligibilityRecordSummary["sourceType"], string> = {
  pdf: "PDF",
  web: "Website",
};

function detailToSummary(record: EligibilityRecordDetail): EligibilityRecordSummary {
  return {
    id: record.id,
    programName: record.programName,
    sourceType: record.sourceType,
    sourceUrl: record.sourceUrl,
    pageTitle: record.pageTitle,
    createdAt: record.createdAt,
    preview: record.rawTextSnippet || record.rawEligibilityText,
  };
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

function previewText(text: string, maxLength = 180) {
  if (!text) {
    return "";
  }

  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("pdf");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isPdfSubmitting, setIsPdfSubmitting] = useState(false);
  const [isUrlSubmitting, setIsUrlSubmitting] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<EligibilityRecordDetail | null>(null);
  const [history, setHistory] = useState<EligibilityRecordSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "pdf" | "web">("all");
  const [detailLoading, setDetailLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const params = new URLSearchParams();
      params.set("limit", "20");

      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
      }

      if (sourceFilter !== "all") {
        params.set("sourceType", sourceFilter);
      }

      const response = await fetch(
        `/api/eligibility-records?${params.toString()}`,
      );

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const payload: { items: ListResponseItem[] } = await response.json();
      const items = payload.items ?? [];

      setHistory(
        items.map((item) => ({
          id: item.id,
          programName: item.programName,
          sourceType: item.sourceType,
          sourceUrl: item.sourceUrl,
          pageTitle: item.pageTitle,
          createdAt: item.createdAt,
          preview: item.preview,
        })),
      );
    } catch (error) {
      console.error("Failed to load history", error);
      setHistoryError("Unable to load history. Please try again.");
    } finally {
      setHistoryLoading(false);
    }
  }, [searchQuery, sourceFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    setPdfFile(selected ?? null);
    setPdfError(null);
  };

  const handlePdfSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPdfError(null);

    if (!pdfFile) {
      setPdfError("Please select a PDF to analyze.");
      return;
    }

    const formData = new FormData();
    formData.append("file", pdfFile);

    setIsPdfSubmitting(true);

    try {
      const response = await fetch("/api/parse-eligibility", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to analyze PDF.");
      }

      const payload = (await response.json()) as EligibilityRecordDetail;
      setSelectedRecord(payload);
      setHistory((prev) => {
        const summary = detailToSummary(payload);
        const merged = [summary, ...prev.filter((item) => item.id !== summary.id)];
        return merged.slice(0, 20);
      });
      setPdfFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to parse PDF", error);
      setPdfError(
        error instanceof Error ? error.message : "Unable to analyze PDF.",
      );
    } finally {
      setIsPdfSubmitting(false);
    }
  };

  const handleUrlSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUrlError(null);

    if (!urlInput.trim()) {
      setUrlError("Please enter a program page URL.");
      return;
    }

    try {
      new URL(urlInput);
    } catch {
      setUrlError("Please enter a valid URL.");
      return;
    }

    setIsUrlSubmitting(true);

    try {
      const response = await fetch("/api/parse-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to analyze URL.");
      }

      const payload = (await response.json()) as EligibilityRecordDetail;
      setSelectedRecord(payload);
      setHistory((prev) => {
        const summary = detailToSummary(payload);
        const merged = [summary, ...prev.filter((item) => item.id !== summary.id)];
        return merged.slice(0, 20);
      });
      setUrlInput("");
    } catch (error) {
      console.error("Failed to parse URL", error);
      setUrlError(
        error instanceof Error ? error.message : "Unable to analyze the URL.",
      );
    } finally {
      setIsUrlSubmitting(false);
    }
  };

  const handleSearchSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    fetchHistory();
  };

  const handleSelectRecord = async (id: string) => {
    setDetailLoading(true);
    setHistoryError(null);

    try {
      const response = await fetch(`/api/eligibility-records/${id}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to load record.");
      }

      const payload = (await response.json()) as EligibilityRecordDetail;
      setSelectedRecord(payload);
    } catch (error) {
      console.error("Failed to load record", error);
      setHistoryError(
        error instanceof Error ? error.message : "Unable to load record.",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12 md:py-16">
        <header className="space-y-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Eligibility Ingestion Workspace
          </h1>
          <p className="text-base text-slate-300 md:text-lg">
            Upload PDFs or point to websites describing homeless-services programs,
            then extract structured eligibility data in seconds.
          </p>
        </header>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40 backdrop-blur">
          <nav className="flex gap-3">
            {(["pdf", "web"] as Tab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab
                    ? "bg-emerald-400 text-emerald-900"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {tab === "pdf" ? "From PDF" : "From Website"}
              </button>
            ))}
          </nav>

          {activeTab === "pdf" ? (
            <form
              onSubmit={handlePdfSubmit}
              className="mt-6 space-y-6"
            >
              <label
                htmlFor="pdf-file"
                className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 transition hover:border-slate-500 hover:bg-slate-900/60"
              >
                <span className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
                  Program PDF
                </span>
                <span className="text-lg font-semibold text-slate-100">
                  {pdfFile?.name ?? "Select a PDF file"}
                </span>
                <span className="text-sm text-slate-400">
                  Upload a single PDF up to 10 MB.
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

              {pdfError && (
                <p className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                  {pdfError}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  {pdfFile ? `${pdfFile.type || "application/pdf"} • ${Math.round(pdfFile.size / 1024)} KB` : "No file selected"}
                </div>
                <button
                  type="submit"
                  disabled={isPdfSubmitting}
                  className="rounded-full bg-emerald-400 px-6 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPdfSubmitting ? "Analyzing…" : "Analyze PDF"}
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handleUrlSubmit}
              className="mt-6 space-y-4"
            >
              <label className="block text-left text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
                Program Page URL
                <input
                  type="url"
                  value={urlInput}
                  onChange={(event) => {
                    setUrlInput(event.target.value);
                    setUrlError(null);
                  }}
                  placeholder="https://example.org/shelter/program"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                />
              </label>

              {urlError && (
                <p className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                  {urlError}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUrlSubmitting}
                  className="rounded-full bg-emerald-400 px-6 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isUrlSubmitting ? "Analyzing…" : "Analyze Website"}
                </button>
              </div>
            </form>
          )}
        </div>

        {detailLoading && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
            Loading record details…
          </div>
        )}

        {selectedRecord && (
          <EligibilityResult record={selectedRecord} />
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-lg shadow-slate-950/40">
          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                History &amp; Search
              </p>
              <h2 className="text-lg font-semibold text-slate-50">
                Recent records
              </h2>
            </div>
            <form
              onSubmit={handleSearchSubmit}
              className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center"
            >
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by program name, title, or URL"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 md:w-64"
              />
              <select
                value={sourceFilter}
                onChange={(event) =>
                  setSourceFilter(event.target.value as "all" | "pdf" | "web")
                }
                className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              >
                <option value="all">All sources</option>
                <option value="pdf">PDFs</option>
                <option value="web">Websites</option>
              </select>
              <button
                type="submit"
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white md:ml-2"
              >
                Search
              </button>
            </form>
          </header>

          {historyError && (
            <p className="mt-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-300">
              {historyError}
            </p>
          )}

          <div className="mt-6 space-y-3">
            {historyLoading ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                Loading history…
              </div>
            ) : history.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-400">
                No records yet. Ingest a PDF or website to get started.
              </div>
            ) : (
              history.map((item) => {
                const isActive = selectedRecord?.id === item.id;
                const label =
                  item.programName ||
                  item.pageTitle ||
                  item.sourceUrl ||
                  "Untitled record";

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectRecord(item.id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      isActive
                        ? "border-emerald-500/70 bg-emerald-500/10"
                        : "border-slate-800 bg-slate-950/40 hover:border-emerald-500/50 hover:bg-slate-950/70"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">
                          {label}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Source: {SOURCE_LABELS[item.sourceType]}
                          {item.sourceUrl && (
                            <>
                              <span className="mx-1 text-slate-600">•</span>
                              {item.sourceUrl}
                            </>
                          )}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500">
                        {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                    <p className="mt-3 text-xs text-slate-400">
                      {previewText(item.preview)}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
