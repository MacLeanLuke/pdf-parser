import Link from "next/link";
import { FileText, HelpCircle, Home } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-border bg-white/90 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div>
            <p className="font-serif text-lg font-semibold text-brand-heading">
              Mercy Networks
            </p>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-brand-muted">
              Connecting people and programs through compassion
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 text-sm font-medium text-brand-muted">
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 transition hover:bg-brand-background hover:text-brand-heading"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Find Help
          </Link>
          <Link
            href="/records"
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 transition hover:bg-brand-background hover:text-brand-heading"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            Saved Services
          </Link>
          <Link
            href="mailto:support@mercynetworks.com"
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 transition hover:bg-brand-background hover:text-brand-heading"
          >
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
            Help & Support
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
