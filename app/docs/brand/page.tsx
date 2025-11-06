import Link from "next/link";
import { ArrowLeft, Palette, Type, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function BrandPage() {
  return (
    <div className="space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-full border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted transition hover:bg-brand-background hover:text-brand-heading"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to workspace
      </Link>

      <Card>
        <CardHeader className="space-y-4">
          <Badge className="w-fit">Brand System</Badge>
          <CardTitle className="text-3xl font-semibold text-brand-heading">
            Eligibility Finder Design Language
          </CardTitle>
          <p className="text-sm text-brand-muted">
            This guide summarizes the colors, fonts, and components that keep the
            Eligibility Finder experience cohesive. For the exhaustive reference,
            see <code className="rounded-full bg-brand-background px-3 py-1 text-xs">
              docs/BRAND_GUIDE.md
            </code>
            .
          </p>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div className="space-y-3 rounded-2xl border border-brand-border bg-brand-background p-5">
            <Palette className="h-5 w-5 text-brand-blue" aria-hidden="true" />
            <h3 className="font-serif text-lg font-semibold text-brand-heading">
              Palette
            </h3>
            <p className="text-sm text-brand-muted">
              Primary Blue (`brand.blue`) drives action, Midnight Navy (`brand.navy`)
              grounds surfaces, and accent greens/oranges communicate status.
            </p>
          </div>
          <div className="space-y-3 rounded-2xl border border-brand-border bg-brand-background p-5">
            <Type className="h-5 w-5 text-brand-blue" aria-hidden="true" />
            <h3 className="font-serif text-lg font-semibold text-brand-heading">
              Typography
            </h3>
            <p className="text-sm text-brand-muted">
              IBM Plex Serif for headings, Inter for UI and body text. Base size 16px,
              headings emphasize empathy and clarity.
            </p>
          </div>
          <div className="space-y-3 rounded-2xl border border-brand-border bg-brand-background p-5">
            <Layers className="h-5 w-5 text-brand-blue" aria-hidden="true" />
            <h3 className="font-serif text-lg font-semibold text-brand-heading">
              Components
            </h3>
            <p className="text-sm text-brand-muted">
              Use cards with `rounded-2xl`, tabs for ingestion modes, badges for status,
              and focus rings with `brand.blue` for accessibility.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
