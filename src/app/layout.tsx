import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/ui/ChatWidget";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { ThemeVars } from "@/components/theme/ThemeVars";
import { OrganizationJsonLd } from "@/components/seo/JsonLd";
import { company } from "@/content/site";
import { home } from "@/content/pages";

/** Latin display face specified in DESIGN.md. */
const grotesk = Hanken_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

/**
 * DESIGN.md calls for "robust character support for Arabic numerals and
 * glyphs". Hanken Grotesk has no Arabic coverage, so the Arabic face leads the
 * stack and the grotesque only ever resolves Latin runs inside it.
 */
const arabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(company.origin),
  title: {
    default: home.seo.title,
    template: "%s",
  },
  description: home.seo.description,
  applicationName: company.nameAr,
  authors: [{ name: company.nameAr }],
  keywords: [
    "شركة التا للاستثمار",
    "ALTA Investment",
    "هندسة الذكاء الاصطناعي",
    "التشغيل والصيانة",
    "الضيافة والإعاشة",
    "الاستشارات الإدارية",
    "التوريدات",
    "الفعاليات والمعارض",
    "البحوث واستطلاع الرأي",
    "الرياض",
  ],
  openGraph: {
    type: "website",
    locale: "ar_SA",
    siteName: company.nameAr,
    title: home.seo.title,
    description: home.seo.description,
    url: company.origin,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#091420",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${grotesk.variable} ${arabic.variable} h-full antialiased`}
    >
      <head>
        {/* Live overrides written by the WhatsApp agents; no rebuild needed. */}
        <ThemeVars />
      </head>
      <body className="flex min-h-full flex-col">
        {/* Background stack, behind everything (z -2 and -1). Both are fixed,
            so they paint once and stay on the compositor while the page
            scrolls. aria-hidden: they carry no meaning to read out. */}
        <div aria-hidden className="aurora-field" />
        <div aria-hidden className="grain-field" />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:start-3 focus:z-[100] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-text-primary"
        >
          تخطَّ إلى المحتوى
        </a>
        <OrganizationJsonLd />
        <ScrollReveal />
        <SiteChrome>
          <Header />
        </SiteChrome>
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteChrome>
          <Footer />
          <ChatWidget />
          {/* Sits on the start corner; the chat launcher owns the end corner,
              so the two never overlap in either direction. */}
          <WhatsAppButton />
        </SiteChrome>
      </body>
    </html>
  );
}
