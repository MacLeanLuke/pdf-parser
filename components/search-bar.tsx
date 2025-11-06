import { FormEvent } from "react";
import { Search, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type SearchBarProps = {
  query: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  isLoading?: boolean;
  showAdvanced?: boolean;
};

export function SearchBar({
  query,
  onChange,
  onSubmit,
  isLoading = false,
  showAdvanced = false,
}: SearchBarProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(query.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-brand-border bg-white p-5 shadow-sm"
    >
      <div className="relative flex items-center">
        <Search
          className="pointer-events-none absolute left-4 h-5 w-5 text-brand-muted"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search for a shelter, program, or describe what you need…"
          aria-label="Search for shelter, food, or other support services"
          className="h-14 rounded-2xl border-brand-border bg-brand-background pl-12 text-base font-medium text-brand-heading placeholder:text-brand-muted"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-brand-muted">
          Try “bed tonight near Plano”, “family shelter that accepts teen boys”, or
          “Section 8 housing voucher help”.
        </div>
        <div className="flex items-center gap-2">
          {showAdvanced && (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium text-brand-muted transition hover:bg-brand-background hover:text-brand-heading"
            >
              <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
              Advanced filters
            </button>
          )}
          <Button type="submit" size="md" disabled={isLoading} className="gap-2">
            {isLoading ? (
              <>
                <span className="h-2 w-2 animate-ping rounded-full bg-white" />
                Searching…
              </>
            ) : (
              <>
                <Search className="h-4 w-4" aria-hidden="true" />
                Search for help
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default SearchBar;
