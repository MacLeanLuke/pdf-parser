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
          <Badge className="w-fit">Mercy Networks</Badge>
          <CardTitle className="text-3xl font-semibold text-brand-heading">
            Mercy Networks Design Language
          </CardTitle>
          <p className="text-sm text-brand-muted">
            This page summarizes the colors, typography, and component patterns that keep
            Mercy Networks warm, clear, and compassionate. For the full reference, see{" "}
            <code className="rounded-full bg-brand-background px-3 py-1 text-xs">
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
              Trust Blue (`brand.blue`) and Mercy Green (`brand.green`) anchor action and
              compassion, supported by soft whites and gentle grays.
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
              Rounded cards, pill badges, generous spacing, and sentence-case buttons keep
              the experience calm and human.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
