import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/header";
import Footer from "@/components/footer";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  "https://pdf-parser-git-main-macleanlukes-projects.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Mercy Networks — Where Help Finds You",
  description:
    "Mercy Networks connects people experiencing homelessness with nearby shelters, meals, medical care, and long-term support — and helps caseworkers share resources with ease.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Mercy Networks",
    description: "Where help finds you.",
    url: "https://pdf-parser-git-main-macleanlukes-projects.vercel.app/",
    siteName: "Mercy Networks",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Mercy Networks — Where help finds you.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mercy Networks",
    description: "Where help finds you.",
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
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
