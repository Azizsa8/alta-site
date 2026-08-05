import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { privacy } from "@/content/pages";

export const metadata: Metadata = {
  title: privacy.seo.title,
  description: privacy.seo.description,
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow={privacy.titleEn}
      title={privacy.title}
      intro={privacy.intro}
      clauses={privacy.clauses}
      href="/privacy-policy"
    />
  );
}
