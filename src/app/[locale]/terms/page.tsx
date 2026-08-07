import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { terms } from "@/content/pages";

export const metadata: Metadata = {
  title: terms.seo.title,
  description: terms.seo.description,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow={terms.titleEn}
      title={terms.title}
      intro={terms.intro}
      clauses={terms.clauses}
      href="/terms"
    />
  );
}
