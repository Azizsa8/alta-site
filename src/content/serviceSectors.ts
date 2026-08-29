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
  /** Short line used in nav dropdowns and the homepage cards. */
  blurb: string;
  /** Longer paragraph for the sector's own page hero. */
  intro: string;
  icon: IconName;
  serviceSlugs: string[];
  /** "التحديات التي نحلها" — framed as the problem, not a claimed metric. */
  challenges: string[];
  /** Subset of `industries.items` (pages.ts) most relevant to this sector. */
  audienceIndustries: string[];
};

export const serviceSectors: ServiceSector[] = [
  {
    id: "tech-ai",
    title: "التقنية والذكاء الاصطناعي",
    titleEn: "TECHNOLOGY & AI",
    blurb: "حلول ذكية تساعد المنشآت على الأتمتة ورفع الكفاءة واتخاذ قرارات أفضل.",
    intro:
      "نساعد المنشآت على تصميم وتطبيق حلول ذكاء اصطناعي وأتمتة مرتبطة بأهداف العمل، من تحديد فرص الاستخدام إلى بناء الوكلاء والمنصات وربطها بالأنظمة القائمة.",
    icon: "ai",
    serviceSlugs: ["ai-engineering"],
    challenges: [
      "عمليات يدوية متكررة تستهلك وقت الفرق دون أن تضيف قيمة.",
      "بيانات متفرقة يصعب تحويلها إلى مؤشرات وقرارات واضحة.",
      "أنظمة قائمة تحتاج إلى طبقة ذكاء تربطها ببعضها دون استبدالها.",
    ],
    audienceIndustries: [
      "الجهات الحكومية وشبه الحكومية",
      "الفنادق والضيافة",
      "الشركات والمنشآت التجارية",
      "الرعاية الصحية",
    ],
  },
  {
    id: "operations-facilities",
    title: "التشغيل وإدارة المرافق",
    titleEn: "OPERATIONS & FACILITIES",
    blurb: "تشغيل وصيانة وإدارة مرافق تضمن استمرارية الأعمال ورفع جودة الأصول.",
    intro:
      "ندير تشغيل وصيانة المرافق والأصول بمنهجية وقائية ودورية، بما يقلل الأعطال ويحافظ على استمرارية التشغيل وجودة البيئة للمستفيدين.",
    icon: "facilities",
    serviceSlugs: ["facilities-management"],
    challenges: [
      "أعطال متكررة تعطل التشغيل وتزيد التكلفة على المدى الطويل.",
      "غياب برنامج صيانة وقائية واضح المسؤوليات والجدولة.",
      "صعوبة متابعة حالة الأصول والمرافق عبر مواقع متعددة.",
    ],
    audienceIndustries: [
      "المصانع والمستودعات",
      "المجمعات الإدارية والسكنية",
      "الجهات الحكومية وشبه الحكومية",
      "الرعاية الصحية",
    ],
  },
  {
    id: "hospitality-catering",
    title: "الضيافة والإعاشة",
    titleEn: "HOSPITALITY & CATERING",
    blurb: "حلول إعاشة وضيافة متكاملة للجهات والمشاريع والمناسبات.",
    intro:
      "نقدم خدمات إعاشة وضيافة متكاملة للمنشآت والمشاريع والمناسبات، من تجهيز الوجبات وتوريد المواد الغذائية إلى إدارة تجربة الضيافة بالكامل.",
    icon: "hospitality",
    serviceSlugs: ["hospitality-catering"],
    challenges: [
      "جودة إعاشة غير ثابتة تؤثر على رضا النزلاء والموظفين.",
      "صعوبة تنسيق الإعاشة والضيافة لمناسبات ومشاريع كبيرة الحجم.",
      "الحاجة إلى مورد واحد موثوق للوجبات والمواد الغذائية.",
    ],
    audienceIndustries: [
      "الفنادق والضيافة",
      "الفعاليات والمؤتمرات",
      "الجهات الحكومية وشبه الحكومية",
      "التعليم",
    ],
  },
  {
    id: "business-solutions",
    title: "حلول الأعمال",
    titleEn: "BUSINESS SOLUTIONS",
    blurb: "استشارات وبحوث وتوريدات وحلول تساعد المنشآت على النمو وتحسين الأداء.",
    intro:
      "نجمع الاستشارات الإدارية والبحوث والتوريدات في مسار واحد يساعد المنشآت على تطوير هياكلها وإجراءاتها، وفهم السوق والمستفيدين، وتأمين احتياجاتها التشغيلية.",
    icon: "consulting",
    serviceSlugs: ["management-consulting", "procurement-supplies", "research-surveys"],
    challenges: [
      "هياكل وإجراءات لم تعد تواكب حجم المنشأة أو أهدافها الحالية.",
      "قرارات تُتخذ دون بيانات كافية عن السوق أو رضا المستفيدين.",
      "تعدد الموردين وصعوبة ضبط الجودة والتوقيت في التوريدات.",
    ],
    audienceIndustries: [
      "الجهات الحكومية وشبه الحكومية",
      "الشركات والمنشآت التجارية",
      "القطاع غير الربحي",
      "المقاولون ومتعهدو الخدمات",
    ],
  },
  {
    id: "media-events",
    title: "الإعلام والفعاليات",
    titleEn: "MEDIA & EVENTS",
    blurb: "من صناعة المحتوى والهوية إلى تنظيم الفعاليات والمعارض والمؤتمرات.",
    intro:
      "نبني الحضور المؤسسي عبر المحتوى وإدارة منصات التواصل، وننظم الفعاليات والمعارض والمؤتمرات من الفكرة إلى التنفيذ الكامل على الأرض.",
    icon: "media",
    serviceSlugs: ["media-social", "events-exhibitions"],
    challenges: [
      "حضور رقمي غير منتظم لا يعكس مستوى المنشأة الفعلي.",
      "فعاليات تحتاج إلى تنسيق دقيق بين عدة أطراف وموردين.",
      "غياب هوية ومحتوى موحّد عبر منصات التواصل المختلفة.",
    ],
    audienceIndustries: [
      "الفعاليات والمؤتمرات",
      "الشركات والمنشآت التجارية",
      "القطاع غير الربحي",
      "الفنادق والضيافة",
    ],
  },
];

export const serviceSectorById = (id: string) =>
  serviceSectors.find((s) => s.id === id);
