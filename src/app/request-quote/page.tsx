import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/ui/Section";
import { QuoteForm } from "@/components/forms/QuoteForm";
import { TickList } from "@/components/ui/Cards";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { contact, home } from "@/content/pages";

export const metadata: Metadata = {
  title: contact.quoteSeo.title,
  description: contact.quoteSeo.description,
  alternates: { canonical: "/request-quote" },
};

type Props = { searchParams: Promise<{ service?: string }> };

export default async function RequestQuotePage({ searchParams }: Props) {
  const { service } = await searchParams;

  return (
    <>
      <BreadcrumbJsonLd trail={[{ name: "طلب عرض سعر", href: "/request-quote" }]} />
      <PageHero
        eyebrow="REQUEST A QUOTE"
        title="طلب عرض سعر"
        body="أرسل نطاق العمل أو وصف الاحتياج، ثم يتواصل الفريق المختص لاستكمال المعلومات وتقديم التصور الفني والمالي المناسب."
        trail={[{ name: "طلب عرض سعر", href: "/request-quote" }]}
      />

      <Section tone="paper">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_0.65fr]">
          <div>
            <h2 className="mb-2 font-display text-[22px] font-bold text-ink">
              نموذج طلب عرض السعر
            </h2>
            <p className="mb-8 text-[13.5px] leading-[1.9] text-ink-muted">
              الحقول المعلَّمة بعلامة <span className="text-danger">*</span> مطلوبة.
            </p>
            <QuoteForm defaultService={service ?? ""} />
          </div>

          <aside className="h-fit rounded-xl border b-gold bg-paper-dim p-7">
            <h2 className="mb-5 font-display text-[18px] font-bold text-ink">
              ماذا يحدث بعد الإرسال؟
            </h2>
            <TickList
              items={[
                "يراجع الفريق المختص الطلب ونطاق العمل.",
                "نتواصل معك لاستكمال أي معلومات ناقصة.",
                "نقدم تصوراً فنياً ومالياً مناسباً لمشروعك.",
                "تخضع الطلبات للمراجعة الفنية والمالية، ولا يعد إرسال النموذج التزاماً بتقديم الخدمة.",
              ]}
            />

            <div className="mt-7 rule-ink pt-6">
              <h3 className="mb-4 text-[14px] font-bold text-ink">
                {home.whyTitle}
              </h3>
              <TickList items={home.why.slice(0, 3)} />
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
