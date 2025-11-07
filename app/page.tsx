"use client";

import { useState, type ChangeEvent, type ReactNode } from "react";
import {
  ArrowRight,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import SearchBar from "@/components/search-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EligibilityResult from "@/components/eligibility-result";
import type { SearchFilter } from "@/lib/search-filter";
import type { Eligibility } from "@/lib/eligibility-schema";

type ServiceSummary = {
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
  results: ServiceSummary[];
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

type WebResult = {
  id: string;
  title: string;
  url: string;
  snippet: string;
  displayUrl: string;
};

type SearchStatus = "idle" | "loading" | "success" | "error";

type IngestPayload = {
  record: EligibilityRecordDetail;
  summary: ServiceSummary;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle");
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilter | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] =
    useState<EligibilityRecordDetail | null>(null);
  const [loadingRecordId, setLoadingRecordId] = useState<string | null>(null);
  const [highlightedServiceId, setHighlightedServiceId] = useState<string | null>(
    null,
  );

  const [webSearchQuery, setWebSearchQuery] = useState("");
  const [webResults, setWebResults] = useState<WebResult[]>([]);
  const [webSearchStatus, setWebSearchStatus] =
    useState<SearchStatus>("idle");
  const [webSearchError, setWebSearchError] = useState<string | null>(null);
  const [selectedWebResult, setSelectedWebResult] =
    useState<WebResult | null>(null);

  const [scanStatus, setScanStatus] = useState<SearchStatus>("idle");
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanRecord, setScanRecord] = useState<EligibilityRecordDetail | null>(
    null,
  );

  const [manualWebsiteUrl, setManualWebsiteUrl] = useState("");
  const [manualWebsiteError, setManualWebsiteError] = useState<string | null>(
    null,
  );
  const [manualWebsiteLoading, setManualWebsiteLoading] = useState(false);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const [filterDraft, setFilterDraft] = useState<SearchFilter | null>(null);

  const hasSearched = searchStatus !== "idle";
  const noServices = searchStatus === "success" && services.length === 0;

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (searchStatus === "error") {
      setSearchStatus("idle");
    }
    setSearchError(null);
  };

  const executeSearch = async (
    input: string,
    filtersOverride?: SearchFilter,
  ) => {
    const trimmed = input.trim();
    if (!trimmed) {
      setSearchError("Please enter a search query.");
      setSearchStatus("error");
      return;
    }

    setQuery(trimmed);
    setSearchStatus("loading");
    setSearchError(null);
    setHighlightedServiceId(null);

    try {
      const response = await fetch("/api/search-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          limit: 20,
          filtersOverride,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Search failed.");
      }

      const payload = (await response.json()) as SearchResponse;
      setServices(payload.results);
      setSearchFilters(payload.filters);
      setSearchStatus("success");
      setSelectedRecord(null);
      setWebResults([]);
      setSelectedWebResult(null);
      setScanRecord(null);
      setScanError(null);
      setWebSearchError(null);
      setWebSearchStatus("idle");
      setWebSearchQuery(`${payload.query} homeless services`);

      if (payload.results.length === 0) {
        void executeWebSearch(`${payload.query} homeless services`, true);
      }
    } catch (error) {
      console.error("Search failed", error);
      setSearchStatus("error");
      setSearchError(
        error instanceof Error ? error.message : "Search failed. Try again.",
      );
    }
  };

  const handleSearch = (value: string) => {
    void executeSearch(value);
  };

  const viewRecordDetails = async (id: string) => {
    setLoadingRecordId(id);
    try {
      const response = await fetch(`/api/eligibility-records/${id}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to load record.");
      }
      const payload = (await response.json()) as EligibilityRecordDetail & {
        createdAt?: string | null;
      };
      setSelectedRecord({
        ...payload,
        createdAt: payload.createdAt ?? new Date().toISOString(),
      });
      setScanRecord(null);
    } catch (error) {
      console.error("Failed to load record", error);
      setSearchError(
        error instanceof Error ? error.message : "Unable to load record.",
      );
    } finally {
      setLoadingRecordId(null);
    }
  };

  const executeWebSearch = async (
    overrideQuery?: string,
    suppressErrorMessage = false,
  ) => {
    const term = (overrideQuery ?? webSearchQuery ?? query).trim();
    if (!term) {
      if (!suppressErrorMessage) {
        setWebSearchError("Enter words to explore the web.");
      }
      return;
    }

    setWebSearchQuery(term);
    setWebSearchStatus("loading");
    setWebSearchError(null);
    setSelectedWebResult(null);
    setScanRecord(null);
    setScanError(null);

    try {
      const response = await fetch("/api/web-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: term }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Web search failed.");
      }

      const payload = (await response.json()) as { results: WebResult[] };
      setWebResults(payload.results);
      setWebSearchStatus("success");
    } catch (error) {
      console.error("Web search failed", error);
      setWebSearchStatus("error");
      const message =
        error instanceof Error
          ? error.message
          : "Unable to contact the web search service.";
      if (!suppressErrorMessage) {
        setWebSearchError(message);
      }
    }
  };

  const handleFiltersChange = (nextFilters: SearchFilter) => {
    void executeSearch(nextFilters.textQuery || query, nextFilters);
  };

  const handleBroadenSearch = () => {
    if (!searchFilters) return;
    const next: SearchFilter = {
      ...searchFilters,
      populations: [],
      locations: [],
      requirementsInclude: [],
      genderRestriction: null,
    };
    handleFiltersChange(next);
  };

  const openFilterEditor = () => {
    if (searchFilters) {
      setFilterDraft(cloneFilters(searchFilters));
    }
  };

  const closeFilterEditor = () => {
    setFilterDraft(null);
  };

  const applyFilterDraft = () => {
    if (!filterDraft) return;
    handleFiltersChange(filterDraft);
    setFilterDraft(null);
  };

  const handleSelectWebResult = (result: WebResult) => {
    setSelectedWebResult(result);
    setScanRecord(null);
    setScanError(null);
    setScanStatus("idle");
  };

  const ingestFromUrl = async (url: string, options?: { preview?: boolean }) => {
    const response = await fetch("/api/parse-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "Failed to analyze website.");
    }

    const payload = await response.json();
    const { record, summary } = normalizeIngestPayload(payload);

    setServices((prev) => {
      const filtered = prev.filter((service) => service.id !== summary.id);
      return [summary, ...filtered];
    });
    setHighlightedServiceId(summary.id);
    setSelectedRecord(record);

    if (options?.preview) {
      setScanRecord(record);
    }

    setSearchStatus("success");

    return record;
  };

  const handleScanSelectedWebsite = async () => {
    if (!selectedWebResult) return;
    setScanStatus("loading");
    setScanError(null);
    try {
      await ingestFromUrl(selectedWebResult.url, { preview: true });
      setScanStatus("success");
    } catch (error) {
      console.error("Website ingest failed", error);
      setScanStatus("error");
      setScanError(
        error instanceof Error
          ? error.message
          : "Unable to analyze the selected website.",
      );
    }
  };

  const handleManualWebsiteIngest = async () => {
    const trimmed = manualWebsiteUrl.trim();
    if (!trimmed) {
      setManualWebsiteError("Please paste a program page URL.");
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      setManualWebsiteError("Enter a valid URL including https://");
      return;
    }

    setManualWebsiteLoading(true);
    setManualWebsiteError(null);
    try {
      await ingestFromUrl(trimmed);
      setManualWebsiteUrl("");
    } catch (error) {
      console.error("Manual website ingest failed", error);
      setManualWebsiteError(
        error instanceof Error
          ? error.message
          : "Unable to analyze the provided URL.",
      );
    } finally {
      setManualWebsiteLoading(false);
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

      const payload = await response.json();
      const { record, summary } = normalizeIngestPayload(payload);

      setPdfFile(null);
      setServices((prev) => {
        const filtered = prev.filter((service) => service.id !== summary.id);
        return [summary, ...filtered];
      });
      setHighlightedServiceId(summary.id);
      setSelectedRecord(record);
      setScanRecord(null);
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

  const heroInfoVisible = !hasSearched;

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

      {heroInfoVisible && (
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

      {searchFilters && hasSearched && (
        <SearchUnderstandingPanel
          filters={searchFilters}
          isUpdating={searchStatus === "loading"}
          onFiltersChange={handleFiltersChange}
          onBroaden={handleBroadenSearch}
          onEditRequest={openFilterEditor}
        />
      )}

      {filterDraft && (
        <FilterEditor
          draft={filterDraft}
          onChange={setFilterDraft}
          onApply={applyFilterDraft}
          onCancel={closeFilterEditor}
        />
      )}

      {hasSearched && (
        <MatchingServicesList
          services={services}
          loadingRecordId={loadingRecordId}
          highlightedId={highlightedServiceId}
          onViewDetails={viewRecordDetails}
        />
      )}

      <WebSearchPanel
        query={webSearchQuery}
        onQueryChange={setWebSearchQuery}
        onSearch={() => {
          void executeWebSearch();
        }}
        results={webResults}
        status={webSearchStatus}
        error={webSearchError}
        onSelectResult={handleSelectWebResult}
        selectedResultId={selectedWebResult?.id ?? null}
        showPrompt={noServices}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ManualWebsiteCard
          url={manualWebsiteUrl}
          onUrlChange={(value) => {
            setManualWebsiteUrl(value);
            setManualWebsiteError(null);
          }}
          onSubmit={handleManualWebsiteIngest}
          isLoading={manualWebsiteLoading}
          error={manualWebsiteError}
        />
        <PdfIngestCard
          fileName={pdfFile?.name ?? ""}
          onFileChange={(event) =>
            handlePdfChange(event.target.files?.[0] ?? null)
          }
          onUpload={handlePdfUpload}
          isLoading={pdfLoading}
          error={pdfError}
        />
      </div>

      <WebPreviewPanel
        result={selectedWebResult}
        onClose={() => {
          setSelectedWebResult(null);
          setScanRecord(null);
          setScanError(null);
          setScanStatus("idle");
        }}
        onScan={handleScanSelectedWebsite}
        isScanning={scanStatus === "loading"}
        scanError={scanError}
        record={scanRecord}
      />

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

function SearchUnderstandingPanel({
  filters,
  onFiltersChange,
  onBroaden,
  onEditRequest,
  isUpdating,
}: {
  filters: SearchFilter;
  onFiltersChange: (filters: SearchFilter) => void;
  onBroaden: () => void;
  onEditRequest: () => void;
  isUpdating: boolean;
}) {
  const hasSpecificFilters =
    filters.populations.length > 0 ||
    filters.locations.length > 0 ||
    filters.requirementsInclude.length > 0 ||
    (filters.genderRestriction && filters.genderRestriction !== "any");

  const removeChip = (
    type:
      | "locations"
      | "populations"
      | "requirementsInclude"
      | "genderRestriction",
    value: string | null,
  ) => {
    if (type === "genderRestriction") {
      onFiltersChange({
        ...filters,
        genderRestriction: null,
      });
      return;
    }

    const list = filters[type];
    if (!Array.isArray(list)) return;
    onFiltersChange({
      ...filters,
      [type]: list.filter((item: string) => item !== value),
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="text-lg font-semibold text-brand-heading">
            Here’s how we understood your search
          </CardTitle>
          <p className="text-sm text-brand-muted">
            Adjust these chips to broaden or refine what you’re looking for.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBroaden}
            disabled={isUpdating}
          >
            Clear extra filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onEditRequest}
            disabled={isUpdating}
            className="gap-2"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Refine filters
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 text-sm">
        {filters.textQuery && (
          <Badge variant="default">Need: {filters.textQuery}</Badge>
        )}
        {filters.locations.map((location) => (
          <FilterChip
            key={location}
            label={`Location: ${location}`}
            onRemove={() => removeChip("locations", location)}
          />
        ))}
        {filters.populations.map((population) => (
          <FilterChip
            key={population}
            label={`Helps: ${population}`}
            onRemove={() => removeChip("populations", population)}
          />
        ))}
        {filters.requirementsInclude.map((requirement) => (
          <FilterChip
            key={requirement}
            label={`Needs: ${requirement}`}
            onRemove={() => removeChip("requirementsInclude", requirement)}
          />
        ))}
        {filters.genderRestriction && filters.genderRestriction !== "any" && (
          <FilterChip
            label={`Gender focus: ${filters.genderRestriction.replace(/_/g, " ")}`}
            onRemove={() => removeChip("genderRestriction", null)}
          />
        )}
        {!hasSpecificFilters && (
          <span className="text-sm text-brand-muted">
            We didn’t pick out specific filters, so we’re showing the closest matches
            to your words.
          </span>
        )}
      </CardContent>
    </Card>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-background px-3 py-1 text-xs font-medium text-brand-heading">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="text-brand-muted transition hover:text-brand-heading"
        aria-label={`Remove ${label}`}
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </span>
  );
}

function FilterEditor({
  draft,
  onChange,
  onApply,
  onCancel,
}: {
  draft: SearchFilter;
  onChange: (filters: SearchFilter) => void;
  onApply: () => void;
  onCancel: () => void;
}) {
  const update = (patch: Partial<SearchFilter>) => {
    onChange({
      ...draft,
      ...patch,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-brand-heading">Fine-tune this search</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <LabeledField label="Need / keywords">
            <Input
              value={draft.textQuery}
              onChange={(event) => update({ textQuery: event.target.value })}
              placeholder="Emergency shelter, day center, housing voucher"
            />
          </LabeledField>
          <LabeledField label="Locations">
            <Input
              value={draft.locations.join(", ")}
              onChange={(event) =>
                update({ locations: splitList(event.target.value) })
              }
              placeholder="Plano, Dallas County, North Texas"
            />
          </LabeledField>
          <LabeledField label="Populations">
            <Input
              value={draft.populations.join(", ")}
              onChange={(event) =>
                update({ populations: splitList(event.target.value) })
              }
              placeholder="families, single adults, veterans"
            />
          </LabeledField>
          <LabeledField label="Requirements or notes">
            <Input
              value={draft.requirementsInclude.join(", ")}
              onChange={(event) =>
                update({ requirementsInclude: splitList(event.target.value) })
              }
              placeholder="ID required, sober, background check"
            />
          </LabeledField>
          <LabeledField label="Gender focus">
            <select
              className="w-full rounded-xl border border-brand-border bg-white px-3 py-2 text-sm"
              value={draft.genderRestriction ?? "any"}
              onChange={(event) =>
                update({
                  genderRestriction:
                    event.target.value === "any" ? null : event.target.value,
                })
              }
            >
              <option value="any">Any / not specified</option>
              <option value="women_only">Women only</option>
              <option value="men_only">Men only</option>
              <option value="non_male">People who are not male</option>
              <option value="non_female">People who are not female</option>
            </select>
          </LabeledField>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onApply} className="gap-2">
            Apply filters
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LabeledField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="block text-xs font-medium uppercase tracking-wide text-brand-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function MatchingServicesList({
  services,
  loadingRecordId,
  highlightedId,
  onViewDetails,
}: {
  services: ServiceSummary[];
  loadingRecordId: string | null;
  highlightedId: string | null;
  onViewDetails: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-lg text-brand-heading">
          Services that may fit
        </CardTitle>
        <p className="text-sm text-brand-muted">
          Saved by your team across PDFs and websites
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {services.length === 0 && (
          <p className="text-sm text-brand-muted">
            We don’t see a matching service yet. Use the web explorer below or add a
            PDF to keep growing this list.
          </p>
        )}
        {services.map((service) => (
          <div
            key={service.id}
            className={`rounded-2xl border bg-white p-4 shadow-sm ${service.id === highlightedId ? "border-brand-green" : "border-brand-border"}`}
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-base font-semibold text-brand-heading">
                  {service.programName || service.pageTitle || "Service name coming soon"}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-brand-muted">
                  <Badge variant="default">
                    {service.sourceType === "pdf" ? (
                      <FileText className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Globe className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {service.sourceType === "pdf" ? "Added from PDF" : "Added from website"}
                  </Badge>
                  {service.sourceUrl && (
                    <a
                      href={service.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-brand-blue underline decoration-dotted underline-offset-4 hover:text-brand-heading"
                    >
                      Open source page
                    </a>
                  )}
                  {service.createdAt && (
                    <span>
                      Updated {new Date(service.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 md:mt-0"
                onClick={() => onViewDetails(service.id)}
                disabled={loadingRecordId === service.id}
              >
                {loadingRecordId === service.id ? (
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
              {service.previewEligibilityText.trim().length
                ? service.previewEligibilityText
                : "We’re still gathering details for this service."}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function WebSearchPanel({
  query,
  onQueryChange,
  onSearch,
  results,
  status,
  error,
  onSelectResult,
  selectedResultId,
  showPrompt,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  results: WebResult[];
  status: SearchStatus;
  error: string | null;
  onSelectResult: (result: WebResult) => void;
  selectedResultId: string | null;
  showPrompt: boolean;
}) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="text-brand-heading">
          {showPrompt ? "Didn’t find what you need? Explore the web" : "Explore the web"}
        </CardTitle>
        <p className="text-sm text-brand-muted">
          We’ll show official program pages right here so you can preview them and
          save anything useful without leaving the site.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search the web for this need…"
            className="md:flex-1"
          />
          <Button onClick={onSearch} disabled={status === "loading"} className="gap-2">
            {status === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Searching…
              </>
            ) : (
              <>
                <Search className="h-4 w-4" aria-hidden="true" />
                Search the web from here
              </>
            )}
          </Button>
        </div>
        {error && <p className="text-sm text-brand-orange">{error}</p>}
        <div className="space-y-3">
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => onSelectResult(result)}
              className={`w-full text-left transition ${result.id === selectedResultId ? "rounded-2xl border border-brand-heading/40 bg-white p-4 shadow" : "rounded-2xl border border-brand-border bg-white p-4 hover:border-brand-heading/40"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-base font-semibold text-brand-heading">
                  {result.title}
                </p>
                <span className="text-xs text-brand-muted">{result.displayUrl}</span>
              </div>
              <p className="mt-2 text-sm text-brand-muted">{result.snippet}</p>
              <div className="mt-3 inline-flex items-center gap-1 text-sm text-brand-blue">
                Preview this site
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </div>
            </button>
          ))}
          {status === "success" && results.length === 0 && (
            <p className="text-sm text-brand-muted">
              No public results yet. Try another phrase or add a site manually below.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function WebPreviewPanel({
  result,
  onClose,
  onScan,
  isScanning,
  scanError,
  record,
}: {
  result: WebResult | null;
  onClose: () => void;
  onScan: () => void;
  isScanning: boolean;
  scanError: string | null;
  record: EligibilityRecordDetail | null;
}) {
  if (!result) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="text-brand-heading">{result.title}</CardTitle>
          <p className="text-sm text-brand-muted">{result.displayUrl}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => window.open(result.url, "_blank", "noopener,noreferrer")}
          >
            Open site
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[400px] w-full overflow-hidden rounded-2xl border border-brand-border bg-brand-background">
          <iframe
            src={result.url}
            title={result.title}
            className="h-full w-full"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
        <div className="space-y-2">
          <Button onClick={onScan} disabled={isScanning} className="w-full gap-2">
            {isScanning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Scanning this website…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Scan this page for service details
              </>
            )}
          </Button>
          <p className="text-xs text-brand-muted">
            We’ll read the page, pull out who the service helps, and store it so it
            appears in future searches.
          </p>
          {scanError && <p className="text-sm text-brand-orange">{scanError}</p>}
        </div>
        {record && <EligibilityResult record={record} />}
      </CardContent>
    </Card>
  );
}

function ManualWebsiteCard({
  url,
  onUrlChange,
  onSubmit,
  isLoading,
  error,
}: {
  url: string;
  onUrlChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-brand-heading">
          <Globe className="h-5 w-5" aria-hidden="true" />
          Already have a link?
        </CardTitle>
        <p className="text-sm text-brand-muted">
          Paste a public webpage that describes a shelter, program, or resource. We’ll
          scan it for who it helps, where it is, and what someone needs to get in.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
          placeholder="https://example.org/program/intake"
          type="url"
        />
        {error && <p className="text-xs text-brand-orange">{error}</p>}
        <Button onClick={onSubmit} disabled={isLoading} className="w-full gap-2">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Scanning website…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Scan this website for service details
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function PdfIngestCard({
  fileName,
  onFileChange,
  onUpload,
  isLoading,
  error,
}: {
  fileName: string;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  isLoading: boolean;
  error: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-brand-heading">
          <FileText className="h-5 w-5" aria-hidden="true" />
          Have a flyer or packet?
        </CardTitle>
        <p className="text-sm text-brand-muted">
          Upload a PDF and we’ll pull out who the service helps and what’s required,
          then save it for future searches.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input type="file" accept="application/pdf" onChange={onFileChange} />
        {fileName && (
          <p className="text-xs text-brand-muted">
            Selected file: <span className="font-medium text-brand-heading">{fileName}</span>
          </p>
        )}
        {error && <p className="text-xs text-brand-orange">{error}</p>}
        <Button onClick={onUpload} disabled={isLoading} className="w-full gap-2">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Scanning PDF…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Scan this PDF for service details
            </>
          )}
        </Button>
      </CardContent>
    </Card>
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

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function cloneFilters(filters: SearchFilter): SearchFilter {
  return {
    textQuery: filters.textQuery,
    populations: [...filters.populations],
    genderRestriction: filters.genderRestriction,
    locations: [...filters.locations],
    requirementsInclude: [...filters.requirementsInclude],
  };
}

function normalizeIngestPayload(payload: any): IngestPayload {
  const base = payload?.record ?? payload;
  const eligibility: Eligibility | undefined = base?.eligibility;

  if (!eligibility) {
    throw new Error("Missing eligibility details in ingest response.");
  }

  const record: EligibilityRecordDetail = {
    id: String(base.id),
    programName: base.programName ?? null,
    sourceType: base.sourceType === "web" ? "web" : "pdf",
    sourceUrl: base.sourceUrl ?? null,
    pageTitle: base.pageTitle ?? null,
    rawEligibilityText: base.rawEligibilityText ?? "",
    rawTextSnippet: base.rawTextSnippet ?? base.rawEligibilityText ?? "",
    eligibility,
    createdAt:
      typeof base.createdAt === "string"
        ? base.createdAt
        : base.createdAt
            ? new Date(base.createdAt).toISOString()
            : new Date().toISOString(),
  };

  const summary: ServiceSummary = payload?.service ?? {
    id: record.id,
    programName: record.programName,
    sourceType: record.sourceType,
    sourceUrl: record.sourceUrl,
    pageTitle: record.pageTitle,
    createdAt: record.createdAt,
    previewEligibilityText: snippet(record.rawEligibilityText, 220),
  };

  return { record, summary };
}

function snippet(text: string, length: number) {
  const cleaned = (text ?? "").replace(/\s+/g, " ").trim();
  if (cleaned.length <= length) {
    return cleaned;
  }
  return `${cleaned.slice(0, length)}…`;
}
