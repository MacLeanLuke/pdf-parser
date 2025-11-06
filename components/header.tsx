import Link from "next/link";
import { FileText, HelpCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-navy/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue/20 text-brand-blue ring-1 ring-brand-blue/30 transition group-hover:bg-brand-blue/30">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="font-serif text-lg font-semibold leading-tight text-brand-white">
              Eligibility Finder
            </p>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand-gray">
              Clarity from complexity
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-brand-gray transition hover:text-brand-white"
          >
            Home
          </Link>
          <Link
            href="/records"
            className="text-sm font-medium text-brand-gray transition hover:text-brand-white"
          >
            Records
          </Link>
          <Link
            href="/docs/brand"
            className="text-sm font-medium text-brand-gray transition hover:text-brand-white"
          >
            Brand Guide
          </Link>
        </nav>

        <nav className="flex items-center gap-2">
          <Link
            href="/records"
            className={cn(
              "hidden items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-brand-white transition hover:border-brand-blue/60 hover:bg-brand-blue/10 md:inline-flex",
            )}
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            Records
          </Link>
          <Link
            href="mailto:support@eligibilityfinder.org"
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-brand-gray transition hover:text-brand-white"
          >
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
            Help
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
