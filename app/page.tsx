"use client";

import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  FileText,
  Globe,
  Loader2,
  ShieldCheck,
  Search,
  AlertCircle,
  History,
} from "lucide-react";
import EligibilityResult from "@/components/eligibility-result";
import type { Eligibility } from "@/lib/eligibility-schema";
import { Tabs } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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

type ListResponse = {
  items: EligibilityRecordSummary[];
};

const tabs = [
  {
    id: "pdf" as const,
    label: "From PDF",
    icon: <FileText className="h-4 w-4" aria-hidden="true" />,
  },
  {
    id: "web" as const,
    label: "From Website",
    icon: <Globe className="h-4 w-4" aria-hidden="true" />,
  },
];

const SOURCE_BADGES: Record<
  EligibilityRecordSummary["sourceType"],
  { label: string; className: string }
> = {
  pdf: { label: "PDF", className: "bg-brand-blue/15 text-brand-blue" },
  web: { label: "Website", className: "bg-brand-green/15 text-brand-green" },
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("pdf");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [pdfError, setPdfError] = useState<string | null>(null);
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
      const params = new URLSearchParams({ limit: "10" });
      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
      }
      if (sourceFilter !== "all") {
        params.set("sourceType", sourceFilter);
      }

      const response = await fetch(`/api/eligibility-records?${params}`);
      if (!response.ok) {
        throw new Error("Request failed");
      }

      const payload: ListResponse = await response.json();
      setHistory(payload.items ?? []);
    } catch (error) {
      console.error("Failed to load history", error);
      setHistoryError("Unable to load recent records. Please try again.");
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
      updateHistoryWith(payload);
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
      updateHistoryWith(payload);
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

  const updateHistoryWith = (record: EligibilityRecordDetail) => {
    setHistory((prev) => {
      const summary = detailToSummary(record);
      const merged = [summary, ...prev.filter((item) => item.id !== summary.id)];
      return merged.slice(0, 10);
    });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    fetchHistory();
  };

  const handleSelectRecord = async (id: string) => {
    setDetailLoading(true);
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
    <div className="space-y-10">
      <Card className="bg-brand-slate/80">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Badge variant="default" className="bg-brand-blue/15 text-brand-blue">
              <ShieldCheck className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Eligibility Finder
            </Badge>
            <CardTitle className="text-3xl font-semibold text-brand-white">
              Clarity from complexity.
            </CardTitle>
            <p className="max-w-2xl text-sm text-brand-gray">
              Upload program PDFs or analyze public websites to surface structured
              eligibility rules in seconds. Built for social workers and housing
              agencies to move faster with confidence.
            </p>
          </div>
          <Button
            variant="outline"
            size="lg"
            className="gap-2 border-brand-blue/30 text-brand-white hover:border-brand-blue/60 hover:bg-brand-blue/10"
            onClick={() => setActiveTab("pdf")}
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            Start with a PDF
          </Button>
        </CardHeader>
      </Card>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="max-w-xl"
      />

      {activeTab === "pdf" ? (
        <Card className="bg-brand-slate/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5" aria-hidden="true" />
              Analyze a program PDF
            </CardTitle>
            <p className="text-sm text-brand-gray">
              Upload one PDF at a time. We parse the text, extract the eligibility
              section, and store everything securely.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePdfSubmit} className="space-y-6">
              <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-white/10 bg-brand-navy/60 p-6 text-sm text-brand-gray">
                <label
                  htmlFor="pdf-file"
                  className="flex flex-col gap-2 text-brand-white"
                >
                  <span className="text-base font-medium text-brand-white">
                    Program PDF
                  </span>
                  <span className="text-sm text-brand-gray">
                    Upload a single PDF up to 10 MB. Scanned/image-only PDFs may
                    require manual review.
                  </span>
                </label>
                <Input
                  ref={fileInputRef}
                  id="pdf-file"
                  name="file"
                  type="file"
                  accept="application/pdf"
                  className="cursor-pointer bg-brand-slate/40 file:mr-4 file:rounded-full file:border-0 file:bg-brand-blue file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-white hover:file:bg-brand-blue/90"
                  onChange={handleFileChange}
                />
                {pdfFile && (
                  <div className="flex flex-wrap items-center gap-3 text-xs text-brand-gray">
                    <Badge variant="slate" className="bg-white/10 text-brand-white">
                      Selected file
                    </Badge>
                    <span className="font-medium text-brand-white">
                      {pdfFile.name}
                    </span>
                    <span className="text-brand-gray/70">
                      {formatFileSize(pdfFile.size)}
                    </span>
                  </div>
                )}
                {pdfError && <ErrorBanner message={pdfError} />}
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isPdfSubmitting}
                  className="gap-2"
                >
                  {isPdfSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      Analyze PDF
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-brand-slate/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Globe className="h-5 w-5" aria-hidden="true" />
              Analyze a program website
            </CardTitle>
            <p className="text-sm text-brand-gray">
              Paste the public URL of a program or shelter page. We fetch the page,
              extract the relevant content, and return a structured eligibility
              record.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUrlSubmit} className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="program-url"
                  className="text-sm font-medium text-brand-white"
                >
                  Program page URL
                </label>
                <Input
                  id="program-url"
                  type="url"
                  value={urlInput}
                  onChange={(event) => {
                    setUrlInput(event.target.value);
                    setUrlError(null);
                  }}
                  placeholder="https://example.org/housing/support-program"
                />
                {urlError && <ErrorBanner message={urlError} />}
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isUrlSubmitting}
                  className="gap-2"
                >
                  {isUrlSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4" aria-hidden="true" />
                      Analyze website
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {detailLoading && (
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-brand-slate/60 px-4 py-3 text-sm text-brand-gray">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading record details…
        </div>
      )}

      {selectedRecord && <EligibilityResult record={selectedRecord} />}

      <Card className="bg-brand-slate/80">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="slate" className="bg-white/10 text-brand-white">
              <History className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Recent activity
            </Badge>
            <CardTitle className="text-xl text-brand-white">
              Eligibility records
            </CardTitle>
            <p className="text-sm text-brand-gray">
              Search by program name, page title, or source URL. Click a record to
              reopen its details.
            </p>
          </div>
          <form
            onSubmit={handleSearchSubmit}
            className="flex w-full flex-col gap-3 md:w-auto md:flex-row"
          >
            <div className="relative md:w-72">
              <Search
                className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-brand-gray/70"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search records"
                className="pl-9"
              />
            </div>
            <select
              value={sourceFilter}
              onChange={(event) =>
                setSourceFilter(event.target.value as "all" | "pdf" | "web")
              }
              className="rounded-2xl border border-white/10 bg-brand-navy/60 px-4 py-2 text-sm text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-brand-navy"
            >
              <option value="all">All sources</option>
              <option value="pdf">PDFs</option>
              <option value="web">Websites</option>
            </select>
            <Button type="submit" variant="outline">
              Refresh
            </Button>
          </form>
        </CardHeader>

        <CardContent className="space-y-4">
          {historyError && <ErrorBanner message={historyError} />}
          {historyLoading ? (
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-brand-navy/60 px-4 py-3 text-sm text-brand-gray">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading recent records…
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-brand-navy/50 px-4 py-6 text-sm text-brand-gray">
              No records yet. Ingest a PDF or website to start building your
              history.
            </div>
          ) : (
            <div className="grid gap-3">
              {history.map((item) => {
                const badgeMeta = SOURCE_BADGES[item.sourceType];
                const isActive = selectedRecord?.id === item.id;
                const label =
                  item.programName || item.pageTitle || item.sourceUrl || "Untitled";
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectRecord(item.id)}
                    className={`w-full rounded-2xl border px-5 py-4 text-left transition ${
                      isActive
                        ? "border-brand-blue/60 bg-brand-blue/15"
                        : "border-white/5 bg-brand-navy/40 hover:border-brand-blue/40 hover:bg-brand-navy/60"
                    }`}
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-brand-white">
                            {label}
                          </p>
                          <Badge
                            variant="slate"
                            className={`${badgeMeta.className} border-transparent`}
                          >
                            {badgeMeta.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-brand-gray">{item.preview}</p>
                      </div>
                      <p className="text-xs text-brand-gray">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <footer className="flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-brand-gray md:flex-row md:items-center">
        <p>© {new Date().getFullYear()} Eligibility Finder. All rights reserved.</p>
        <div className="flex items-center gap-3">
          <Link
            href="/docs/brand"
            className="underline decoration-dotted underline-offset-4 hover:text-brand-white"
          >
            Brand guide
          </Link>
          <span className="text-brand-gray/60">•</span>
          <Link
            href="mailto:support@eligibilityfinder.org"
            className="underline decoration-dotted underline-offset-4 hover:text-brand-white"
          >
            Contact support
          </Link>
        </div>
      </footer>
    </div>
  );
}

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

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString();
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-brand-orange/40 bg-brand-orange/15 px-4 py-3 text-xs text-brand-orange">
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      {message}
    </div>
  );
}
