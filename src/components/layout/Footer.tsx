import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { SocialBar } from "@/components/ui/WhatsAppButton";
import { company, footerNav, whatsapp, whatsappHref } from "@/content/site";

export function Footer() {
  return (
    <footer className="band-midnight-deep relative overflow-hidden text-text-primary">
      {/* Blueprint diagonals, echoing the approved footer treatment. */}
      <div className="blueprint pointer-events-none absolute inset-0 opacity-60" />

      <div className="alta-container relative py-[52px] md:py-[72px]">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo onDark />
            <p className="mt-5 max-w-sm text-[13.5px] leading-[1.9] text-text-muted">
              {company.descriptionShortAr}
            </p>
            <p className="mt-5 text-[13px] font-semibold text-primary">
              {company.promise}
            </p>
          </div>

          {footerNav.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="mb-4 text-[13px] font-bold text-text-primary">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-text-muted transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 grid gap-6 rule-soft pt-8 md:grid-cols-2">
          <ul className="space-y-2.5 text-[13px] text-text-muted">
            <li className="flex items-center gap-2.5">
              <Icon name="pin" className="size-4 shrink-0 text-primary" />
              <span>{company.cityAr}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Icon name="mail" className="size-4 shrink-0 text-primary" />
              {/* Approved document marks the address as pending; link to the form
                  rather than publish a placeholder. */}
              {company.email ? (
                <a href={`mailto:${company.email}`} className="hover:text-primary">
                  {company.email}
                </a>
              ) : (
                <Link href="/contact" className="hover:text-primary">
                  نموذج التواصل
                </Link>
              )}
            </li>
            <li className="flex items-center gap-2.5">
              <Icon name="phone" className="size-4 shrink-0 text-primary" />
              {company.phone ? (
                <a href={`tel:${company.phone}`} className="hover:text-primary">
                  {company.phone}
                </a>
              ) : (
                <Link href="/request-quote" className="hover:text-primary">
                  اطلب عرض سعر
                </Link>
              )}
            </li>
            <li className="flex items-center gap-2.5">
              <Icon name="whatsapp" className="size-4 shrink-0 text-primary" />
              <a
                href={whatsappHref("من تذييل الموقع")}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                {/* dir=ltr keeps the leading + and the digit grouping in place
                    inside the surrounding RTL block. */}
                <span dir="ltr" className="tnum">
                  {whatsapp.display}
                </span>
              </a>
            </li>
          </ul>

          <div className="flex flex-col justify-end gap-3 md:items-end">
            <a
              href={`https://${company.website}`}
              className="text-[13px] font-semibold tracking-wide text-primary hover:underline"
            >
              {company.website}
            </a>
            {/* Renders nothing until real profile URLs exist — see socialLinks. */}
            <SocialBar className="md:justify-end" />
            <div className="flex gap-3 text-[12px] text-text-muted">
              <Link href="/privacy-policy" className="hover:text-primary">
                سياسة الخصوصية
              </Link>
              <span aria-hidden>•</span>
              <Link href="/terms" className="hover:text-primary">
                الشروط والأحكام
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[12px] text-text-muted">
          جميع الحقوق محفوظة © {company.year} {company.nameAr}
        </p>
      </div>
    </footer>
  );
}
