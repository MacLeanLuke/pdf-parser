import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/header";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  "https://pdf-parser-git-main-macleanlukes-projects.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Eligibility Finder",
  description: "Clarity from complexity — faster eligibility for everyone.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Eligibility Finder",
    description:
      "Clarity from complexity — faster eligibility for everyone.",
    url: "https://pdf-parser-git-main-macleanlukes-projects.vercel.app/",
    siteName: "Eligibility Finder",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Eligibility Finder — Clarity from complexity",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eligibility Finder",
    description:
      "Clarity from complexity — faster eligibility for everyone.",
    images: ["/og-image.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-brand-background text-brand-body">
        <Header />
        <main className="mx-auto w-full max-w-4xl px-4 pb-16 pt-10">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
