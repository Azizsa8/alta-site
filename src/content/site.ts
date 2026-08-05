/**
 * Brand, navigation, contact and microcopy.
 *
 * Every Arabic string in `src/content` is transcribed from the approved
 * document `ALTA-APPROVED-CONTENT.pdf` (إصدار 2026). Do not paraphrase:
 * the client approved this wording. Placeholders the document itself marks
 * as pending ("يُضاف") are kept as `null` so the UI can hide them rather
 * than invent a value.
 */

export const company = {
  nameAr: "شركة التا للاستثمار",
  nameEn: "ALTA Investment Company",
  shortAr: "التا",
  mark: "ALTA",
  tagline: "من الفكرة إلى الإنجاز",
  promise: "حلول متكاملة… وقيمة مستدامة",
  cityAr: "الرياض – المملكة العربية السعودية",
  website: "www.alta.sa",
  origin: "https://www.alta.sa",
  /** Marked "يُضاف" in the approved document — pending pre-launch data. */
  phone: null as string | null,
  email: null as string | null,
  workingHours: null as string | null,
  year: 2026,
  /**
   * Short description, approved for search engines, maps and platforms
   * (document section 24 — SEO & MICROCOPY).
   */
  descriptionAr:
    "شركة التا للاستثمار شركة سعودية تقدم حلولاً متكاملة في هندسة الذكاء الاصطناعي، والتشغيل والصيانة والنظافة، والضيافة والإعاشة، والاستشارات الإدارية وتأهيل المنشآت، والتوريدات، والدعاية والإعلام، والفعاليات، والبحوث واستطلاع الرأي.",
  descriptionShortAr:
    "حلول متكاملة للمنشآت تشمل الذكاء الاصطناعي، التشغيل والصيانة، الضيافة والإعاشة، الاستشارات، التوريدات، الإعلام، الفعاليات، والبحوث.",
} as const;

export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

/** Main menu — document section 02, خريطة الموقع والقائمة الرئيسية. */
export const mainNav: NavItem[] = [
  { label: "الرئيسية", href: "/" },
  { label: "من نحن", href: "/about" },
  {
    label: "خدماتنا",
    href: "/services",
    children: [
      { label: "هندسة الذكاء الاصطناعي", href: "/services/ai-engineering" },
      { label: "التشغيل والصيانة والنظافة", href: "/services/facilities-management" },
      { label: "الضيافة وخدمات الإعاشة", href: "/services/hospitality-catering" },
      { label: "الاستشارات الإدارية وتأهيل المنشآت", href: "/services/management-consulting" },
      { label: "التوريدات", href: "/services/procurement-supplies" },
      { label: "الدعاية والإعلام وإدارة المنصات", href: "/services/media-social" },
      { label: "الفعاليات والمعارض والمؤتمرات", href: "/services/events-exhibitions" },
      { label: "البحوث واستطلاع الرأي", href: "/services/research-surveys" },
    ],
  },
  { label: "القطاعات", href: "/sectors" },
  { label: "مشاريعنا", href: "/projects" },
  { label: "المركز الإعلامي", href: "/media-center" },
  { label: "تواصل معنا", href: "/contact" },
];

export const footerNav = [
  {
    title: "عن الشركة",
    links: [
      { label: "من نحن", href: "/about" },
      { label: "رؤيتنا ورسالتنا", href: "/about#vision" },
      { label: "قيمنا", href: "/about#values" },
      { label: "منهجية العمل", href: "/about#methodology" },
      { label: "الجودة والحوكمة", href: "/about#governance" },
    ],
  },
  {
    title: "خدماتنا",
    links: [
      { label: "هندسة الذكاء الاصطناعي", href: "/services/ai-engineering" },
      { label: "التشغيل والصيانة والنظافة", href: "/services/facilities-management" },
      { label: "الضيافة وخدمات الإعاشة", href: "/services/hospitality-catering" },
      { label: "الاستشارات وتأهيل المنشآت", href: "/services/management-consulting" },
      { label: "التوريدات", href: "/services/procurement-supplies" },
      { label: "الدعاية والإعلام", href: "/services/media-social" },
    ],
  },
  {
    title: "معلومات",
    links: [
      { label: "القطاعات التي نخدمها", href: "/sectors" },
      { label: "مشاريعنا وسابقة الأعمال", href: "/projects" },
      { label: "المركز الإعلامي", href: "/media-center" },
      { label: "الوظائف", href: "/careers" },
      { label: "الأسئلة الشائعة", href: "/faq" },
      { label: "سياسة الخصوصية", href: "/privacy-policy" },
      { label: "الشروط والأحكام", href: "/terms" },
    ],
  },
];

/** Approved button labels — document section 24, رسائل الأزرار. */
export const cta = {
  exploreServices: "استكشف خدماتنا",
  requestQuote: "اطلب عرض سعر",
  talkToTeam: "تحدث مع فريقنا",
  discoverMore: "اكتشف المزيد",
  allProjects: "عرض جميع المشاريع",
  readArticle: "اقرأ المقال",
  downloadProfile: "تحميل الملف التعريفي",
  registerSupplier: "سجل كمورد",
  joinTeam: "انضم إلى فريقنا",
  submit: "إرسال الطلب",
  initialConsultation: "اطلب استشارة أولية",
  discussNeed: "ناقش احتياجك معنا",
  moreAbout: "المزيد عن الشركة",
  more: "المزيد",
} as const;

/** Approved form + state messages — document section 24, رسائل النماذج. */
export const microcopy = {
  requiredField: "يرجى تعبئة هذا الحقل.",
  invalidEmail: "يرجى إدخال بريد إلكتروني صحيح.",
  fileTooLarge: "يتجاوز الملف الحجم المسموح. يرجى إرفاق ملف أصغر.",
  sent: "تم استلام طلبك بنجاح.",
  sendFailed: "تعذر إكمال الإرسال. يرجى المحاولة مرة أخرى.",
  noResults: "لا توجد نتائج مطابقة لبحثك.",
  updating: "نعمل على تحديث هذا القسم، وسيتم نشر المحتوى قريباً.",
  contactSuccess:
    "شكراً لتواصلكم مع شركة التا للاستثمار. تم استلام طلبكم بنجاح، وسيقوم الفريق المختص بمراجعته والتواصل معكم لاستكمال المتطلبات.",
  contactError:
    "تعذر إرسال الطلب في الوقت الحالي. يرجى التحقق من الحقول المطلوبة والمحاولة مرة أخرى، أو التواصل عبر بيانات الاتصال الموضحة في الصفحة.",
  supplierSuccess:
    "شكراً لاهتمامكم بالتعاون مع شركة التا للاستثمار. تم استلام بياناتكم، وستتم مراجعتها وفق احتياجات المشاريع ومتطلبات التأهيل. التسجيل لا يعني التزاماً بالتعاقد.",
  careersSuccess:
    "شكراً لاهتمامك بالانضمام إلى شركة التا للاستثمار. تم استلام طلبك، وسيتم التواصل عند توفر فرصة تتناسب مع خبراتك واحتياجاتنا.",
  privacyConsent: "أوافق على سياسة الخصوصية",
} as const;

/** 404 copy — document section 24, صفحة الخطأ 404. */
export const notFoundCopy = {
  title: "يبدو أن الصفحة غير موجودة",
  body: "قد يكون الرابط قد تغير أو تمت إزالة الصفحة. يمكنك العودة إلى الصفحة الرئيسية أو استكشاف خدماتنا.",
  primary: "العودة للرئيسية",
  secondary: "استكشف الخدمات",
} as const;

/** Marketing lines — document section 24, عبارات تسويقية. */
export const slogans = [
  "حلول متكاملة… وقيمة مستدامة.",
  "نصمم الحل، ندير التنفيذ، ونقيس الأثر.",
  "من الجودة يبدأ الأثر.",
  "التا للاستثمار… نصنع الفارق.",
  "شريكك في الكفاءة والتطوير.",
  "خبرات متعددة لهدف واحد: نجاح أعمالك.",
  "تقنية وتشغيل واستشارة تحت مظلة واحدة.",
  "حضور يليق بالأعمال.",
];
