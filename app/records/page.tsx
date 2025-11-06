import Link from "next/link";
import { ArrowLeft, Clock, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RecordsIndex() {
  return (
    <div className="space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-brand-gray transition hover:border-brand-blue/60 hover:text-brand-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to workspace
      </Link>

      <Card className="bg-brand-slate/80">
        <CardHeader className="space-y-3">
          <CardTitle className="text-3xl font-semibold text-brand-white">
            Eligibility records
          </CardTitle>
          <p className="text-sm text-brand-gray">
            View and manage structured eligibility results produced from PDFs and
            public program websites. Use the workspace to ingest new records or
            reopen existing ones.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-brand-gray">
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-brand-navy/50 p-4">
            <Clock className="mt-1 h-4 w-4 text-brand-blue" aria-hidden="true" />
            <div>
              <p className="font-semibold text-brand-white">Recently ingested</p>
              <p>
                The most recent records appear first in your workspace history. Select
                any record to review the full eligibility breakdown.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-brand-navy/50 p-4">
            <Search className="mt-1 h-4 w-4 text-brand-blue" aria-hidden="true" />
            <div>
              <p className="font-semibold text-brand-white">Search &amp; filter</p>
              <p>
                Use the search bar on the home workspace to filter by program name,
                page title, or source URL. Narrow results by source type (PDF or
                Website) as needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
