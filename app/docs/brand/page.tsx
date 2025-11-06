import Link from "next/link";
import { ArrowLeft, Palette, Type, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function BrandPage() {
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
        <CardHeader className="space-y-4">
          <Badge className="w-fit bg-brand-blue/15 text-brand-blue">
            Brand System
          </Badge>
          <CardTitle className="text-3xl font-semibold text-brand-white">
            Eligibility Finder Design Language
          </CardTitle>
          <p className="text-sm text-brand-gray">
            This guide summarizes the colors, fonts, and components that keep the
            Eligibility Finder experience cohesive. For the exhaustive reference,
            see <code className="rounded-full bg-white/10 px-3 py-1 text-xs">
              docs/BRAND_GUIDE.md
            </code>
            .
          </p>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div className="space-y-3 rounded-2xl border border-white/10 bg-brand-navy/50 p-5">
            <Palette className="h-5 w-5 text-brand-blue" aria-hidden="true" />
            <h3 className="font-serif text-lg font-semibold text-brand-white">
              Palette
            </h3>
            <p className="text-sm text-brand-gray">
              Primary Blue (`brand.blue`) drives action, Midnight Navy (`brand.navy`)
              grounds surfaces, and accent greens/oranges communicate status.
            </p>
          </div>
          <div className="space-y-3 rounded-2xl border border-white/10 bg-brand-navy/50 p-5">
            <Type className="h-5 w-5 text-brand-blue" aria-hidden="true" />
            <h3 className="font-serif text-lg font-semibold text-brand-white">
              Typography
            </h3>
            <p className="text-sm text-brand-gray">
              IBM Plex Serif for headings, Inter for UI and body text. Base size 16px,
              headings emphasize empathy and clarity.
            </p>
          </div>
          <div className="space-y-3 rounded-2xl border border-white/10 bg-brand-navy/50 p-5">
            <Layers className="h-5 w-5 text-brand-blue" aria-hidden="true" />
            <h3 className="font-serif text-lg font-semibold text-brand-white">
              Components
            </h3>
            <p className="text-sm text-brand-gray">
              Use cards with `rounded-2xl`, tabs for ingestion modes, badges for status,
              and focus rings with `brand.blue` for accessibility.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
