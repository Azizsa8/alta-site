import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { ContactForm } from "@/components/forms/ContactForm";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { contact } from "@/content/pages";
import { company } from "@/content/site";

export const metadata: Metadata = {
  title: contact.seo.title,
  description: contact.seo.description,
  alternates: { canonical: "/contact" },
};

type Props = { searchParams: Promise<{ topic?: string }> };

export default async function ContactPage({ searchParams }: Props) {
  const { topic } = await searchParams;

  return (
    <>
      <BreadcrumbJsonLd trail={[{ name: "تواصل معنا", href: "/contact" }]} />
      <PageHero
        eyebrow={contact.titleEn}
        title={contact.headline}
        body={contact.intro}
        trail={[{ name: "تواصل معنا", href: "/contact" }]}
      />

      <Section tone="paper">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_0.65fr]">
          <div>
            <h2 className="mb-2 font-display text-[22px] font-bold text-ink">
              نموذج التواصل
            </h2>
            <p className="mb-8 text-[13.5px] leading-[1.9] text-ink-muted">
              الحقول المعلَّمة بعلامة <span className="text-danger">*</span> مطلوبة.
            </p>
            <ContactForm defaultTopic={topic ?? ""} />
          </div>

          <aside className="h-fit rounded-xl border b-gold bg-paper-dim p-7">
            <h2 className="mb-6 font-display text-[18px] font-bold text-ink">
              بيانات التواصل
            </h2>
            <ul className="space-y-5 text-[13.5px] leading-[1.85] text-ink-muted">
              <li className="flex items-start gap-3">
                <Icon name="pin" className="mt-0.5 size-4 shrink-0 text-gold-ink" />
                <span>
                  <span className="block font-semibold text-ink">
                    {company.nameAr}
                  </span>
                  {company.cityAr}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="mail" className="mt-0.5 size-4 shrink-0 text-gold-ink" />
                <span>
                  <span className="block font-semibold text-ink">
                    البريد الإلكتروني
                  </span>
                  {company.email ?? "يُستقبل عبر النموذج إلى حين اعتماد البريد الرسمي"}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="phone" className="mt-0.5 size-4 shrink-0 text-gold-ink" />
                <span>
                  <span className="block font-semibold text-ink">الهاتف</span>
                  {company.phone ?? "يُضاف قبل الإطلاق"}
                </span>
              </li>
            </ul>

            <div className="mt-7 rule-ink pt-6">
              <a
                href={`https://${company.website}`}
                className="text-[13px] font-bold text-gold-ink hover:underline"
              >
                {company.website}
              </a>
            </div>

            <Link
              href="/request-quote"
              className="mt-6 flex items-center justify-between rounded-lg border b-ink bg-paper p-4 transition-colors hover:border-[color:var(--color-primary-container)]"
            >
              <span className="text-[13.5px] font-bold text-ink">
                تبحث عن عرض سعر؟
              </span>
              <Icon name="arrow" className="size-4 text-gold-ink" strokeWidth={2.2} />
            </Link>
          </aside>
        </div>
      </Section>
    </>
  );
}
