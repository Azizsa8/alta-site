/**
 * Programs, applications and platforms — the layer beneath
 * "الذكاء الاصطناعي وتقنية المعلومات".
 *
 * Route shape requested by the client:
 *   /services/ai-engineering                          the service
 *     └ /platforms                                    our programs & platforms
 *         └ /alta-hospitality                         a specific product
 *
 * ALTA Hospitality content is transcribed from the platform's own published
 * site (`alta_hospitality_actual_website.html` in the approved assets folder).
 */

export const platformsIndex = {
  titleEn: "PROGRAMS, APPS & PLATFORMS",
  title: "برامجنا وتطبيقاتنا ومنصاتنا",
  headline: "منتجات رقمية جاهزة للتشغيل",
  intro:
    "إلى جانب الحلول المصممة حسب الطلب، نطور منصات ومنتجات رقمية جاهزة تعالج احتياجات تشغيلية متكررة في قطاعات محددة. تُبنى هذه المنصات على وكلاء ذكاء اصطناعي متخصصين، وتتكامل مع الأنظمة القائمة، وتُدار ضمن ضوابط صلاحيات ومراجعة بشرية واضحة.",
  pillars: [
    {
      title: "وكلاء متخصصون",
      body: "لكل وظيفة تشغيلية وكيل مدرّب على نطاقها وإجراءاتها ومؤشرات أدائها.",
    },
    {
      title: "لوحة تحكم موحدة",
      body: "مؤشرات لحظية للإشغال والإيرادات والطلبات والرضا في مكان واحد.",
    },
    {
      title: "تكامل مع أنظمتك",
      body: "ربط بالأنظمة القائمة وقنوات التواصل دون استبدال بنيتك الحالية.",
    },
    {
      title: "حوكمة وصلاحيات",
      body: "مراجعة بشرية للمخرجات الحساسة وتحكم كامل في من يرى ومن يعتمد.",
    },
  ],
  seo: {
    title: "برامجنا وتطبيقاتنا ومنصاتنا | شركة التا للاستثمار",
    description:
      "منصات ومنتجات رقمية من شركة التا للاستثمار مبنية على وكلاء الذكاء الاصطناعي، بلوحات تحكم موحدة وتكامل مع الأنظمة القائمة.",
  },
};

export type Platform = {
  slug: string;
  name: string;
  nameAr: string;
  eyebrow: string;
  headline: string;
  headlineAccent: string;
  summary: string;
  sector: string;
  status: string;
  agents: { title: string; body: string }[];
  dashboard: { label: string; value: string; delta?: string }[];
  why: { title: string; body: string }[];
  integrations: { title: string; body: string }[];
  metrics: { value: string; label: string }[];
  cta: { title: string; body: string; button: string };
  seo: { title: string; description: string };
};

export const platforms: Platform[] = [
  {
    slug: "alta-hospitality",
    name: "ALTA Hospitality AI",
    nameAr: "منصة التا للضيافة الذكية",
    eyebrow: "منصة سعودية ذكية للضيافة",
    headline: "الجيل الجديد من تشغيل الفنادق",
    headlineAccent: "بالذكاء الاصطناعي",
    summary:
      "منصة متكاملة تعتمد على وكلاء ذكاء اصطناعي لإدارة التشغيل، وتجربة النزيل، والصيانة، والمبيعات والتسويق من لوحة تحكم واحدة.",
    sector: "الفنادق والمنتجعات والضيافة",
    status: "منتج تشغيلي",
    agents: [
      { title: "موظف الاستقبال", body: "إدارة الحجوزات والمكالمات وتسجيل الوصول والمغادرة." },
      { title: "خدمة النزيل", body: "الرد على الطلبات والشكاوى عبر جميع القنوات." },
      { title: "الصيانة", body: "إدارة البلاغات والصيانة والجولات الدورية." },
      { title: "التسويق", body: "إنشاء الحملات وتحليل الأداء وزيادة الحجوزات." },
      { title: "المبيعات", body: "إدارة العملاء والعروض وتحسين الإيرادات." },
      { title: "المدير التنفيذي", body: "تحليلات وتقارير ذكية لاتخاذ قرارات أفضل." },
    ],
    dashboard: [
      { label: "نسبة الإشغال", value: "75%", delta: "+12%" },
      { label: "الإيرادات", value: "1.25M", delta: "+8.2%" },
      { label: "الشكاوى", value: "24", delta: "-15%" },
      { label: "رضا النزلاء", value: "4.8/5", delta: "+0.6" },
      { label: "البلاغات المفتوحة", value: "18" },
      { label: "سرعة الاستجابة", value: "65%" },
    ],
    why: [
      { title: "تشغيل أسرع", body: "أتمتة المهام والعمليات لتقليل الوقت والجهد." },
      { title: "تقليل التكاليف", body: "تحسين المصروفات التشغيلية وزيادة الكفاءة." },
      { title: "رفع رضا النزيل", body: "تجربة استثنائية تزيد من الولاء والتقييمات." },
      { title: "ذكاء يعمل 24/7", body: "وكلاء ذكيون لا يتوقفون عن العمل." },
    ],
    integrations: [
      { title: "تكامل PMS", body: "أنظمة إدارة الفنادق" },
      { title: "واتساب", body: "تواصل تلقائي وذكي" },
      { title: "Google Reviews", body: "إدارة التقييمات" },
      { title: "ذكاء تنبؤي", body: "توقع الطلب والإيرادات" },
      { title: "تحليلات فورية", body: "تقارير لحظية ودقيقة" },
      { title: "تعدد الفروع", body: "إدارة مركزية مرنة" },
      { title: "صلاحيات متقدمة", body: "تحكم كامل وآمن" },
      { title: "سحابي وآمن", body: "بياناتك في أمان" },
    ],
    metrics: [
      { value: "99%", label: "رضا العملاء" },
      { value: "24/7", label: "تشغيل ذكي" },
      { value: "70%", label: "تقليل وقت الاستجابة" },
      { value: "3x", label: "زيادة كفاءة التشغيل" },
    ],
    cta: {
      title: "ابدأ اليوم في تحويل فندقك إلى فندق ذكي",
      body: "احجز عرضك التجريبي المجاني واكتشف كيف يمكن لـ ALTA أن تُحدث فرقاً في تشغيل فندقك.",
      button: "احجز العرض التجريبي",
    },
    seo: {
      title: "ALTA Hospitality AI | منصة تشغيل الفنادق بالذكاء الاصطناعي",
      description:
        "منصة سعودية ذكية لتشغيل الفنادق: وكلاء ذكاء اصطناعي لخدمة النزيل والصيانة والتسويق والمبيعات، بلوحة تحكم موحدة وتكامل PMS وواتساب.",
    },
  },
];

export const platformBySlug = (slug: string) =>
  platforms.find((p) => p.slug === slug);
