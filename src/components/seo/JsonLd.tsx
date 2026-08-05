import { company } from "@/content/site";
import { services } from "@/content/services";
import { faq } from "@/content/pages";

function Ld({ data }: { data: Record<string, unknown> }) {
  // Structured data must reach the DOM as a raw JSON string — React would
  // otherwise HTML-escape the quotes and break the parser. The input is
  // build-time content only, but `<` is still escaped so a stray "</script>"
  // in future copy can never close the tag early.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
  );
}

export function OrganizationJsonLd() {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: company.nameAr,
        alternateName: company.nameEn,
        url: company.origin,
        logo: `${company.origin}/brand/alta-mark.png`,
        description: company.descriptionAr,
        address: {
          "@type": "PostalAddress",
          addressLocality: "الرياض",
          addressCountry: "SA",
        },
        makesOffer: services.map((s) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: s.title, description: s.short },
        })),
      }}
    />
  );
}

export function ServiceJsonLd({
  name,
  description,
  slug,
}: {
  name: string;
  description: string;
  slug: string;
}) {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "Service",
        name,
        description,
        url: `${company.origin}/services/${slug}`,
        provider: { "@type": "Organization", name: company.nameAr },
        areaServed: { "@type": "Country", name: "المملكة العربية السعودية" },
      }}
    />
  );
}

export function FaqJsonLd() {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      }}
    />
  );
}

export function BreadcrumbJsonLd({
  trail,
}: {
  trail: { name: string; href: string }[];
}) {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: trail.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: t.name,
          item: `${company.origin}${t.href}`,
        })),
      }}
    />
  );
}
