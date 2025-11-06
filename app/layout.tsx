import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/header";

export const metadata: Metadata = {
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
      <body>
        <Header />
        <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 md:px-6">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
