/**
 * شركاء النجاح — the approved partner logos.
 *
 * Sliced from `ALTA-SITE/approveed partners logos.jpeg`, the approved sheet.
 * Only these eighteen may be shown; do not add a logo that is not on that sheet.
 */

export type Partner = { name: string; file: string };

export const partners: Partner[] = [
  { name: "الهيئة الملكية", file: "saudi-heritage" },
  { name: "المركز الوطني للمعلومات", file: "nic" },
  { name: "شركة الاتصالات السعودية stc", file: "stc" },
  { name: "جامعة الملك سعود", file: "king-saud-university" },
  { name: "InterContinental", file: "intercontinental" },
  { name: "الشؤون الصحية بوزارة الحرس الوطني", file: "national-guard-health" },
  { name: "Petlas", file: "petlas" },
  { name: "شركة اليمامة", file: "alyamama" },
  { name: "جامعة الأميرة نورة بنت عبدالرحمن", file: "princess-nourah-university" },
  { name: "عاصفة الحزم", file: "asifat-alhazm" },
  { name: "معهد التربية الفكرية", file: "iie" },
  { name: "اللجنة الوطنية لمكافحة المخدرات", file: "anti-narcotics" },
  { name: "رئاسة أمن الدولة", file: "state-security" },
  { name: "الاتحاد السعودي للهجن", file: "saudi-camel-sports" },
  { name: "جاهز", file: "jahez" },
  { name: "الهيئة السعودية للمحاسبين القانونيين", file: "socpa" },
  { name: "Lilly", file: "lilly" },
  { name: "شركة نباتات للمقاولات", file: "nabatat" },
];

/** Split into two rows so the carousel can scroll them in opposite directions. */
export const partnerRows: Partner[][] = [
  partners.filter((_, i) => i % 2 === 0),
  partners.filter((_, i) => i % 2 === 1),
];
