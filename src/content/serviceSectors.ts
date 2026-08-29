/**
 * ALTA's five lines of business — "قطاعاتنا" in the main nav.
 *
 * These group the eight approved services (`services.ts`) under a smaller,
 * scannable structure without touching the services themselves: nothing in
 * `services.ts` is deleted or renamed, each service just gains a sector
 * label here. Adding a ninth service later only means appending its slug to
 * the right group's `serviceSlugs`.
 */

import type { IconName } from "./services";

export type ServiceSector = {
  id: string;
  title: string;
  titleEn: string;
  blurb: string;
  icon: IconName;
  serviceSlugs: string[];
};

export const serviceSectors: ServiceSector[] = [
  {
    id: "tech-ai",
    title: "التقنية والذكاء الاصطناعي",
    titleEn: "TECHNOLOGY & AI",
    blurb: "حلول ذكية تساعد المنشآت على الأتمتة ورفع الكفاءة واتخاذ قرارات أفضل.",
    icon: "ai",
    serviceSlugs: ["ai-engineering"],
  },
  {
    id: "operations-facilities",
    title: "التشغيل وإدارة المرافق",
    titleEn: "OPERATIONS & FACILITIES",
    blurb: "تشغيل وصيانة وإدارة مرافق تضمن استمرارية الأعمال ورفع جودة الأصول.",
    icon: "facilities",
    serviceSlugs: ["facilities-management"],
  },
  {
    id: "hospitality-catering",
    title: "الضيافة والإعاشة",
    titleEn: "HOSPITALITY & CATERING",
    blurb: "حلول إعاشة وضيافة متكاملة للجهات والمشاريع والمناسبات.",
    icon: "hospitality",
    serviceSlugs: ["hospitality-catering"],
  },
  {
    id: "business-solutions",
    title: "حلول الأعمال",
    titleEn: "BUSINESS SOLUTIONS",
    blurb: "استشارات وبحوث وتوريدات وحلول تساعد المنشآت على النمو وتحسين الأداء.",
    icon: "consulting",
    serviceSlugs: ["management-consulting", "procurement-supplies", "research-surveys"],
  },
  {
    id: "media-events",
    title: "الإعلام والفعاليات",
    titleEn: "MEDIA & EVENTS",
    blurb: "من صناعة المحتوى والهوية إلى تنظيم الفعاليات والمعارض والمؤتمرات.",
    icon: "media",
    serviceSlugs: ["media-social", "events-exhibitions"],
  },
];

export const serviceSectorById = (id: string) =>
  serviceSectors.find((s) => s.id === id);
