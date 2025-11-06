"use client";

import { useState } from "react";
import { ArrowRight, FileText, Globe, Loader2, Search } from "lucide-react";
import SearchBar from "@/components/search-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EligibilityResult from "@/components/eligibility-result";
import type { SearchFilter } from "@/lib/search-filter";
import type { Eligibility } from "@/lib/eligibility-schema";

type SearchResult = {
  id: string;
  programName: string | null;
  sourceType: "pdf" | "web";
  sourceUrl: string | null;
  pageTitle: string | null;
  createdAt: string | null;
  previewEligibilityText: string;
};

type SearchResponse = {
  query: string;
  filters: SearchFilter;
  results: SearchResult[];
};

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

type SearchStatus = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [query, setQuery] = useState("");
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilter | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] =
    useState<EligibilityRecordDetail | null>(null);
  const [loadingRecordId, setLoadingRecordId] = useState<string | null>(null);
  const [showIngestion, setShowIngestion] = useState(false);

  const [websiteUrl, setWebsiteUrl] = useState("");
  const [websiteLoading, setWebsiteLoading] = useState(false);
  const [websiteError, setWebsiteError] = useState<string | null>(null);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const hasSearched = searchStatus === "success" || searchStatus === "error";
  const noResults =
    searchStatus === "success" && searchResults.length === 0;

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (searchStatus === "error") {
      setSearchStatus("idle");
    }
    setSearchError(null);
  };

  const handleSearch = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setSearchError("Please enter a search query.");
      setSearchStatus("error");
      return;
    }

    setQuery(trimmed);
    setSearchStatus("loading");
    setSearchError(null);
    setShowIngestion(false);
    setSelectedRecord(null);

    try {
      const response = await fetch("/api/search-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, limit: 20 }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Search failed.");
      }

      const payload = (await response.json()) as SearchResponse;
      setSearchResults(payload.results);
      setSearchFilters(payload.filters);
      setSearchStatus("success");

      if (payload.results.length === 0) {
        setShowIngestion(true);
      }
    } catch (error) {
      console.error("Search failed", error);
      setSearchStatus("error");
      setSearchError(
        error instanceof Error ? error.message : "Search failed. Try again.",
      );
    }
  };

  const viewRecordDetails = async (id: string) => {
    setLoadingRecordId(id);
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
      setSearchError(
        error instanceof Error ? error.message : "Unable to load record.",
      );
    } finally {
      setLoadingRecordId(null);
    }
  };

  const handleWebsiteIngest = async () => {
    const trimmed = websiteUrl.trim();
    if (!trimmed) {
      setWebsiteError("Please paste a program page URL.");
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      setWebsiteError("Please enter a valid URL (including https://).");
      return;
    }

    setWebsiteLoading(true);
    setWebsiteError(null);
    try {
      const response = await fetch("/api/parse-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to analyze website.");
      }

      const payload = (await response.json()) as EligibilityRecordDetail;
      setSelectedRecord(payload);
      setWebsiteUrl("");
      setSearchResults((prev) => [
        {
          id: payload.id,
          programName: payload.programName,
          sourceType: payload.sourceType,
          sourceUrl: payload.sourceUrl,
          pageTitle: payload.pageTitle,
          createdAt: payload.createdAt,
          previewEligibilityText: payload.rawEligibilityText.slice(0, 200),
        },
        ...prev,
      ]);
    } catch (error) {
      console.error("Website ingest failed", error);
      setWebsiteError(
        error instanceof Error
          ? error.message
          : "Unable to analyze the provided URL.",
      );
    } finally {
      setWebsiteLoading(false);
    }
  };

  const handleWebsiteUrlChange = (value: string) => {
    setWebsiteUrl(value);
    if (websiteError) {
      setWebsiteError(null);
    }
  };

  const handlePdfChange = (file: File | null) => {
    setPdfFile(file);
    setPdfError(null);
  };

  const handlePdfUpload = async () => {
    if (!pdfFile) {
      setPdfError("Please select a PDF to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", pdfFile);

    setPdfLoading(true);
    setPdfError(null);
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
      setPdfFile(null);
      setSearchResults((prev) => [
        {
          id: payload.id,
          programName: payload.programName,
          sourceType: payload.sourceType,
          sourceUrl: payload.sourceUrl,
          pageTitle: payload.pageTitle,
          createdAt: payload.createdAt,
          previewEligibilityText: payload.rawEligibilityText.slice(0, 200),
        },
        ...prev,
      ]);
    } catch (error) {
      console.error("PDF ingest failed", error);
      setPdfError(
        error instanceof Error
          ? error.message
          : "Unable to analyze the uploaded PDF.",
      );
    } finally {
      setPdfLoading(false);
    }
  };

  const googleSearchUrl =
    query.length > 0
      ? `https://www.google.com/search?q=${encodeURIComponent(
          `${query} homeless services support`,
        )}`
      : null;

  return (
    <div className="space-y-8">
      <section className="space-y-3 text-center">
        <Badge variant="slate" className="mx-auto w-fit">
          Mercy Networks
        </Badge>
        <h1 className="text-4xl font-serif font-semibold text-brand-heading">
          Find help, simply.
        </h1>
        <p className="mx-auto max-w-2xl text-base text-brand-muted">
          Mercy Networks helps people and caseworkers find the right support—from
          shelter and meals to housing programs—with one simple search. If we don’t
          have it yet, we’ll help you add it so everyone can discover it next time.
        </p>
      </section>

      <SearchBar
        query={query}
        onChange={handleQueryChange}
        onSubmit={handleSearch}
        isLoading={searchStatus === "loading"}
        showAdvanced={false}
      />

      {searchStatus === "error" && searchError && (
        <Card>
          <CardContent className="flex items-center gap-2 text-sm text-brand-orange">
            <Search className="h-4 w-4" aria-hidden="true" />
            {searchError}
          </CardContent>
        </Card>
      )}

      {searchStatus === "idle" && (
        <Card>
          <CardHeader>
            <CardTitle>How Mercy Networks works</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <InfoItem
              title="Ask for help"
              description="Tell us what you or someone you’re supporting needs. We understand plain language—no forms, no jargon."
            />
            <InfoItem
              title="See what’s available"
              description="Explore shelters, meals, medical care, and programs your team has already connected through Mercy Networks."
            />
            <InfoItem
              title="Add new connections"
              description="Found a new service? Add it from a website or PDF so others can find it next time."
            />
          </CardContent>
        </Card>
      )}

      {searchStatus === "success" && searchFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-brand-heading">
              Here’s how we understood your search
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-sm">
            {searchFilters.textQuery && (
              <Badge variant="default">Need: {searchFilters.textQuery}</Badge>
            )}
            {searchFilters.locations.map((location) => (
              <Badge key={location} variant="slate">
                Location: {location}
              </Badge>
            ))}
            {searchFilters.populations.map((population) => (
              <Badge key={population} variant="slate">
                Helps: {population}
              </Badge>
            ))}
            {searchFilters.genderRestriction &&
              searchFilters.genderRestriction !== "any" && (
                <Badge variant="slate">
                  Gender focus: {searchFilters.genderRestriction.replace(/_/g, " ")}
                </Badge>
              )}
            {searchFilters.requirementsInclude.map((req) => (
              <Badge key={req} variant="slate">
                Needs: {req}
              </Badge>
            ))}
            {searchFilters.populations.length === 0 &&
              searchFilters.locations.length === 0 &&
              searchFilters.requirementsInclude.length === 0 &&
              (!searchFilters.genderRestriction ||
                searchFilters.genderRestriction === "any") && (
                <span className="text-sm text-brand-muted">
                  We didn’t pick out any specific filters, so we’re showing the closest
                  matches to your words.
                </span>
              )}
          </CardContent>
        </Card>
      )}

      {searchStatus === "success" && searchResults.length > 0 && (
        <ResultsSection
          results={searchResults}
          loadingRecordId={loadingRecordId}
          onViewDetails={viewRecordDetails}
          onAddNew={() => setShowIngestion(true)}
        />
      )}

      {noResults && (
        <Card>
          <CardHeader>
            <CardTitle className="text-brand-heading">
              We don’t see a matching service yet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-brand-muted">
            <p>
              Try adjusting your words, or use the options below to search the web and
              add a new shelter or program from a website or PDF.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => googleSearchUrl && window.open(googleSearchUrl, "_blank")}
                disabled={!googleSearchUrl}
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                Search the web for this
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showIngestion && (
        <IngestionSection
          websiteUrl={websiteUrl}
          onWebsiteUrlChange={handleWebsiteUrlChange}
          onIngestWebsite={handleWebsiteIngest}
          websiteLoading={websiteLoading}
          websiteError={websiteError}
          pdfFile={pdfFile}
          onPdfChange={handlePdfChange}
          onUploadPdf={handlePdfUpload}
          pdfLoading={pdfLoading}
          pdfError={pdfError}
        />
      )}

      {selectedRecord && (
        <div className="space-y-3">
          <h2 className="text-xl font-serif font-semibold text-brand-heading">
            Service details
          </h2>
          <EligibilityResult record={selectedRecord} />
        </div>
      )}
    </div>
  );
}

function ResultsSection({
  results,
  loadingRecordId,
  onViewDetails,
  onAddNew,
}: {
  results: SearchResult[];
  loadingRecordId: string | null;
  onViewDetails: (id: string) => void;
  onAddNew: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-lg text-brand-heading">
          Services that may fit
          </CardTitle>
        <Button variant="ghost" className="gap-2 text-brand-muted" onClick={onAddNew}>
          Add a new connection
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.map((result) => (
          <div
            key={result.id}
            className="rounded-2xl border border-brand-border bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-base font-semibold text-brand-heading">
                  {result.programName || result.pageTitle || "Service name coming soon"}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-brand-muted">
                  <Badge variant="default">
                    {result.sourceType === "pdf" ? <FileText className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> : <Globe className="mr-1 h-3.5 w-3.5" aria-hidden="true" />}
                    {result.sourceType === "pdf" ? "Added from PDF" : "Added from website"}
                  </Badge>
                  {result.sourceUrl && (
                    <a
                      href={result.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-brand-blue underline decoration-dotted underline-offset-4 hover:text-brand-heading"
                    >
                      Open source page
                    </a>
                  )}
                  {result.createdAt && (
                    <span>Updated {new Date(result.createdAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 md:mt-0"
                onClick={() => onViewDetails(result.id)}
                disabled={loadingRecordId === result.id}
              >
                {loadingRecordId === result.id ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Loading…
                  </>
                ) : (
                  <>
                    See service details
                    <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
                  </>
                )}
              </Button>
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-brand-muted">
              Who it helps:{" "}
              {result.previewEligibilityText.trim().length
                ? result.previewEligibilityText
                : "We’re still gathering details for this service."}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function IngestionSection({
  websiteUrl,
  onWebsiteUrlChange,
  onIngestWebsite,
  websiteLoading,
  websiteError,
  pdfFile,
  onPdfChange,
  onUploadPdf,
  pdfLoading,
  pdfError,
}: {
  websiteUrl: string;
  onWebsiteUrlChange: (value: string) => void;
  onIngestWebsite: () => void;
  websiteLoading: boolean;
  websiteError: string | null;
  pdfFile: File | null;
  onPdfChange: (file: File | null) => void;
  onUploadPdf: () => void;
  pdfLoading: boolean;
  pdfError: string | null;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-brand-heading">
            <Globe className="h-5 w-5" aria-hidden="true" />
            Add a service from a website
          </CardTitle>
          <p className="text-sm text-brand-muted">
            Paste a public webpage that describes a shelter, program, or resource. We
            pull out who it helps, where it is, and what someone needs to get in.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={websiteUrl}
            onChange={(event) => {
              onWebsiteUrlChange(event.target.value);
            }}
            placeholder="https://example.org/program/intake"
            type="url"
          />
          {websiteError && (
            <p className="text-xs text-brand-orange">{websiteError}</p>
          )}
          <Button
            onClick={onIngestWebsite}
            disabled={websiteLoading}
            className="w-full gap-2"
          >
            {websiteLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Scanning website…
              </>
            ) : (
              <>
                Scan this website for service details
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-brand-heading">
            <FileText className="h-5 w-5" aria-hidden="true" />
            Add a service from a PDF
          </CardTitle>
          <p className="text-sm text-brand-muted">
            Upload a flyer, intake packet, or program overview as a PDF. We’ll scan it
            for who the service helps and what’s required, then save it for future
            searches.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="file"
            accept="application/pdf"
            onChange={(event) => onPdfChange(event.target.files?.[0] ?? null)}
          />
          {pdfFile && (
            <p className="text-xs text-brand-muted">
              Selected file:{" "}
              <span className="font-medium text-brand-heading">{pdfFile.name}</span>
            </p>
          )}
          {pdfError && <p className="text-xs text-brand-orange">{pdfError}</p>}
          <Button
            onClick={onUploadPdf}
            disabled={pdfLoading}
            className="w-full gap-2"
          >
            {pdfLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Scanning PDF…
              </>
            ) : (
              <>
                Scan this PDF for service details
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-background p-4">
      <h3 className="text-base font-semibold text-brand-heading">{title}</h3>
      <p className="mt-2 text-sm text-brand-muted">{description}</p>
    </div>
  );
}
