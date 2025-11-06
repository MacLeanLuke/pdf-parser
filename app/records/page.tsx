"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Globe, Loader2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type RecordListItem = {
  id: string;
  programName: string | null;
  sourceType: "pdf" | "web";
  sourceUrl: string | null;
  pageTitle: string | null;
  createdAt: string | null;
  previewEligibilityText: string;
};

type EligibilityRecordsResponse = {
  items: Array<{
    id: string;
    programName: string | null;
    sourceType: "pdf" | "web";
    sourceUrl: string | null;
    pageTitle: string | null;
    createdAt: string | null;
    preview: string;
  }>;
};

type SearchFilters = {
  textQuery: string;
};

type SearchResponse = {
  query: string;
  filters: SearchFilters;
  results: RecordListItem[];
};

export default function RecordsPage() {
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<RecordListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadInitialRecords();
  }, []);

  const loadInitialRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/eligibility-records?limit=25");
      if (!response.ok) {
        throw new Error("Failed to load records.");
      }
      const payload = (await response.json()) as EligibilityRecordsResponse;
      setRecords(
        (payload.items ?? []).map((item) => ({
          id: item.id,
          programName: item.programName,
          sourceType: item.sourceType,
          sourceUrl: item.sourceUrl,
          pageTitle: item.pageTitle,
          createdAt: item.createdAt,
          previewEligibilityText: item.preview,
        })),
      );
    } catch (error) {
      console.error("Records load failed", error);
      setError("Unable to load records. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      await loadInitialRecords();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/search-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, limit: 25 }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Search failed.");
      }
      const payload = (await response.json()) as SearchResponse;
      setRecords(payload.results);
    } catch (error) {
      console.error("Record search failed", error);
      setError(
        error instanceof Error ? error.message : "Search failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-serif font-semibold text-brand-heading">
          Saved services
        </h1>
        <p className="text-sm text-brand-muted">
          A list of shelters, programs, and local resources your team has added. Open
          any service to see who it helps, how to qualify, and what to do next.
        </p>
      </header>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-lg text-brand-heading">Search saved services</CardTitle>
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-brand-muted"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by program name, location, or keyword"
                className="h-12 rounded-full border-brand-border bg-brand-background pl-11"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="primary"
                className="h-12 rounded-full"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Searching…
                  </>
                ) : (
                  <>
                    Search saved services
                    <Search className="ml-2 h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-full"
                onClick={() => {
                  setQuery("");
                  void loadInitialRecords();
                }}
                disabled={loading}
              >
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-brand-orange">{error}</p>}
          {loading && !records.length ? (
            <div className="flex items-center gap-2 rounded-2xl border border-brand-border bg-white px-4 py-3 text-sm text-brand-muted">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading records…
            </div>
          ) : records.length === 0 ? (
            <div className="rounded-2xl border border-brand-border bg-white px-4 py-6 text-sm text-brand-muted">
              No services saved yet. Try a new search or add a shelter, program, or
              resource from the home page so others can find it next time.
            </div>
          ) : (
            <div className="grid gap-3">
              {records.map((record) => (
                <Link
                  key={record.id}
                  href={`/records/${record.id}`}
                  className="rounded-2xl border border-brand-border bg-white p-4 shadow-sm transition hover:border-brand-blue/60 hover:shadow-md"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-brand-heading">
                          {record.programName || record.pageTitle || "Service name coming soon"}
                        </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-brand-muted">
                        <Badge variant="default">
                          {record.sourceType === "pdf" ? (
                            <FileText className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <Globe className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          {record.sourceType === "pdf" ? "PDF" : "Website"}
                        </Badge>
                        {record.createdAt && (
                          <span>
                            Last updated {new Date(record.createdAt).toLocaleDateString()}
                          </span>
                        )}
                        {record.sourceUrl && (
                          <span className="truncate text-xs">
                            {new URL(record.sourceUrl).hostname}
                          </span>
                        )}
                      </div>
                    </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2 inline-flex items-center gap-2 text-brand-muted md:mt-0"
                      >
                        See service details
                        <Search className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-brand-muted">
                      Who it helps:{" "}
                      {record.previewEligibilityText.trim().length
                        ? record.previewEligibilityText
                        : "Details coming soon."}
                    </p>
                  </Link>
                ))}
              </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
