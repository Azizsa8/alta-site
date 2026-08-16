"use client";

import { useState } from "react";
import Link from "next/link";
import { type SiteSettings, type ThemeOverrides } from "@/lib/settings";

type Props = {
  initialSettings: SiteSettings;
  initialRevisions: SiteSettings[];
  backend: string;
};

const THEME_PRESETS = [
  {
    id: "gold",
    name: "الذهبي والأزرق الكحلي الملكي (الأصلي)",
    desc: "الهوية الرسمية المعتمدة لشركة التا للاستثمار",
    theme: {
      primary: "#d9a84e",
      primaryContainer: "#b88732",
      goldInk: "#f3c77c",
      surface: "#091420",
      surfacePanel: "#0e1e30",
      paper: "#13253a",
    },
  },
  {
    id: "emerald",
    name: "الزمردي الملكي الفاخر (Vision 2030)",
    desc: "طابع استثماري أخضر مستوحى من الاستدامة ورؤية المملكة",
    theme: {
      primary: "#10b981",
      primaryContainer: "#059669",
      goldInk: "#6ee7b7",
      surface: "#061a14",
      surfacePanel: "#0b2920",
      paper: "#12382d",
    },
  },
  {
    id: "ruby",
    name: "الياقوتي الفخم والرمادي الداكن",
    desc: "طابع فاخر وجريء للمؤتمرات والفعاليات الكبرى",
    theme: {
      primary: "#e11d48",
      primaryContainer: "#be123c",
      goldInk: "#fda4af",
      surface: "#180c11",
      surfacePanel: "#28151e",
      paper: "#381f2b",
    },
  },
  {
    id: "cyan",
    name: "السياني والبلاتيني العصري",
    desc: "طابع رقمي تقني متقدم يناسب حلول الذكاء الاصطناعي",
    theme: {
      primary: "#06b6d4",
      primaryContainer: "#0891b2",
      goldInk: "#67e8f9",
      surface: "#08161e",
      surfacePanel: "#0f232e",
      paper: "#163140",
    },
  },
];

export function SettingsClient({ initialSettings, initialRevisions, backend }: Props) {
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [revisions, setRevisions] = useState<SiteSettings[]>(initialRevisions);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string; link?: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<"theme" | "content" | "media" | "whatsapp" | "history">("theme");

  const updateTheme = (key: keyof ThemeOverrides, value: string) => {
    setSettings((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        [key]: value,
      },
    }));
  };

  const updateContent = (key: string, value: unknown) => {
    setSettings((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        [key]: value,
      },
    }));
  };

  const updateImage = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      images: {
        ...prev.images,
        [key]: value,
      },
    }));
  };

  const applyAndSavePreset = async (presetTheme: ThemeOverrides, presetName: string) => {
    setSaving(true);
    setStatusMsg(null);
    const newSettings = {
      ...settings,
      theme: {
        ...settings.theme,
        ...presetTheme,
      },
    };
    setSettings(newSettings);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: newSettings.theme,
          content: newSettings.content,
          images: newSettings.images,
          updatedBy: `لوحة المالك (تطبيق ${presetName})`,
        }),
      });
      const data = await res.json();
      if (data.ok && data.settings) {
        setSettings(data.settings);
        setStatusMsg({
          type: "success",
          text: `✅ تم تطبيق وحفظ (${presetName}) وتحديث الموقع الحي فوراً (الإصدار r${data.settings.revision})!`,
          link: true,
        });
        const revRes = await fetch("/api/admin/settings");
        const revData = await revRes.json();
        if (revData.ok && revData.revisions) {
          setRevisions(revData.revisions);
        }
      } else {
        setStatusMsg({ type: "error", text: `فشل الحفظ: ${data.error || "خطأ غير متوقع"}` });
      }
    } catch {
      setStatusMsg({ type: "error", text: "حدث خطأ أثناء الاتصال بالخادم." });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: settings.theme,
          content: settings.content,
          images: settings.images,
          updatedBy: "لوحة تحكم المالك",
        }),
      });
      const data = await res.json();
      if (data.ok && data.settings) {
        setSettings(data.settings);
        setStatusMsg({
          type: "success",
          text: `✅ تم حفظ وتطبيق كافة التغييرات بنجاح على الموقع الحي (الإصدار r${data.settings.revision})!`,
          link: true,
        });
        const revRes = await fetch("/api/admin/settings");
        const revData = await revRes.json();
        if (revData.ok && revData.revisions) {
          setRevisions(revData.revisions);
        }
      } else {
        setStatusMsg({ type: "error", text: `فشل الحفظ: ${data.error || "خطأ غير متوقع"}` });
      }
    } catch {
      setStatusMsg({ type: "error", text: "حدث خطأ أثناء الاتصال بالخادم." });
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (revision: number) => {
    if (!confirm(`هل أنت متأكد من رغبتك في استرجاع الإصدار r${revision} وتطبيقه على الموقع؟`)) return;
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revision }),
      });
      const data = await res.json();
      if (data.ok && data.settings) {
        setSettings(data.settings);
        setStatusMsg({
          type: "success",
          text: `✅ تم استرجاع الإصدار r${revision} وتطبيقه كإصدار جديد r${data.settings.revision}!`,
          link: true,
        });
      } else {
        setStatusMsg({ type: "error", text: `فشل الاسترجاع: ${data.error || "خطأ غير متوقع"}` });
      }
    } catch {
      setStatusMsg({ type: "error", text: "حدث خطأ أثناء الاسترجاع." });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("هل أنت متأكد من استعادة كافة الإعدادات الأصلية الافتراضية للموقع؟")) return;
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });
      const data = await res.json();
      if (data.ok && data.settings) {
        setSettings(data.settings);
        setStatusMsg({ type: "success", text: "✅ تمت استعادة الإعدادات الأصلية الافتراضية بنجاح.", link: true });
      }
    } catch {
      setStatusMsg({ type: "error", text: "حدث خطأ أثناء استعادة الإعدادات الأصلية." });
    } finally {
      setSaving(false);
    }
  };

  const primaryColor = settings.theme?.primary || "#d9a84e";
  const containerColor = settings.theme?.primaryContainer || "#b88732";
  const surfaceColor = settings.theme?.surface || "#091420";
  const surfacePanelColor = settings.theme?.surfacePanel || "#0e1e30";
  const goldInkColor = settings.theme?.goldInk || "#f3c77c";

  return (
    <div className="min-h-screen bg-surface text-text-primary">
      <div className="alta-container py-10">
        <header className="flex flex-wrap items-start justify-between gap-4 rule-soft pb-6">
          <div>
            <p className="font-display text-[13px] font-bold tracking-[0.28em] text-primary">
              ALTA INVESTMENT
            </p>
            <h1 className="mt-2 font-display text-[26px] font-bold">إعدادات وتخصيص الموقع</h1>
            <p className="mt-1.5 text-[12.5px] text-text-muted">
              إدارة الهوية البصرية، المحتوى، وسيط واتساب (WAHA) · التخزين: {backend} · الإصدار الحالي: r
              {settings.revision}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="rounded-md border b-soft px-4 py-2.5 text-[13px] text-text-muted hover:text-primary transition-colors"
            >
              العودة للوحة الإحصائيات
            </Link>
            <Link
              href="/"
              target="_blank"
              className="rounded-md border border-[color:var(--color-primary)] bg-primary/10 px-4 py-2.5 text-[13px] font-semibold text-primary hover:bg-primary/20 transition-colors flex items-center gap-1.5"
            >
              <span>معاينة الموقع الحي</span>
              <span>↗</span>
            </Link>
          </div>
        </header>

        {statusMsg && (
          <div
            className={`mt-6 rounded-xl border p-4 text-[13.5px] font-semibold flex items-center justify-between shadow-lg ${
              statusMsg.type === "success"
                ? "border-emerald-500/50 bg-emerald-950/60 text-emerald-300"
                : "border-rose-500/50 bg-rose-950/60 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <span>{statusMsg.text}</span>
              {statusMsg.link && (
                <Link
                  href="/"
                  target="_blank"
                  className="underline font-bold text-white hover:text-emerald-200"
                >
                  اضغط هنا لفتح وتحديث الموقع الحي
                </Link>
              )}
            </div>
            <button onClick={() => setStatusMsg(null)} className="text-[12px] opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        <nav className="mt-8 flex flex-wrap items-center gap-2 border-b b-soft pb-3">
          {[
            { id: "theme", label: "🎨 الهوية البصرية والألوان" },
            { id: "content", label: "✍️ نصوص وعناوين الواجهة" },
            { id: "media", label: "🖼️ الصور والوسائط" },
            { id: "whatsapp", label: "📱 واتساب ووكيل WAHA" },
            { id: "history", label: `🕒 سجل التعديلات والنسخ (r${settings.revision})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as never)}
              className={`rounded-lg px-4 py-2 text-[13px] font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-text-muted hover:bg-surface-panel hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === "theme" && (
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl border b-soft bg-surface-panel p-6">
                <h2 className="text-[16px] font-bold text-text-primary mb-1.5">نماذج ألوان جاهزة متناسقة</h2>
                <p className="text-[13px] text-text-muted mb-4">
                  اضغط على زر <strong>تطبيق وحفظ</strong> لتفعيل الثيم مباشرة على الموقع:
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {THEME_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      className="rounded-xl border b-soft bg-surface p-4 text-start hover:border-primary/60 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[13px] font-bold text-text-primary">{preset.name}</span>
                        </div>
                        <p className="text-[11.5px] text-text-muted mb-3">{preset.desc}</p>
                        <div className="flex gap-2 mb-4">
                          <span className="size-5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: preset.theme.primary }} title="اللون الرئيسي" />
                          <span className="size-5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: preset.theme.primaryContainer }} title="لون الحاوية" />
                          <span className="size-5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: preset.theme.surface }} title="الخلفية" />
                          <span className="size-5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: preset.theme.surfacePanel }} title="الألواح" />
                        </div>
                      </div>

                      <button
                        onClick={() => applyAndSavePreset(preset.theme, preset.name)}
                        disabled={saving}
                        className="w-full rounded-lg bg-primary/20 py-2 text-[12px] font-bold text-primary hover:bg-primary hover:text-on-primary transition-all disabled:opacity-50"
                      >
                        {saving ? "جاري التطبيق..." : "⚡ تطبيق وحفظ هذا النموذج فوراً"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border b-soft bg-surface-panel p-6 space-y-5">
                <h2 className="text-[16px] font-bold text-text-primary">تخصيص الألوان الدقيقة (CSS Variables)</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[12.5px] font-semibold text-text-primary mb-1.5">
                      اللون الرئيسي للعلامة (Primary Brand)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => updateTheme("primary", e.target.value)}
                        className="size-10 rounded border border-white/20 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => updateTheme("primary", e.target.value)}
                        className="flex-1 rounded-lg border b-soft bg-surface px-3 py-2 text-[13px] text-text-primary"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12.5px] font-semibold text-text-primary mb-1.5">
                      لون الحاوية والأزرار الثانوية (Primary Container)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={containerColor}
                        onChange={(e) => updateTheme("primaryContainer", e.target.value)}
                        className="size-10 rounded border border-white/20 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={containerColor}
                        onChange={(e) => updateTheme("primaryContainer", e.target.value)}
                        className="flex-1 rounded-lg border b-soft bg-surface px-3 py-2 text-[13px] text-text-primary"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12.5px] font-semibold text-text-primary mb-1.5">
                      لون النص الذهبي والتمييز (Gold/Accent Ink)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={goldInkColor}
                        onChange={(e) => updateTheme("goldInk", e.target.value)}
                        className="size-10 rounded border border-white/20 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={goldInkColor}
                        onChange={(e) => updateTheme("goldInk", e.target.value)}
                        className="flex-1 rounded-lg border b-soft bg-surface px-3 py-2 text-[13px] text-text-primary"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12.5px] font-semibold text-text-primary mb-1.5">
                      لون خلفية الموقع العامة (Surface Background)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={surfaceColor}
                        onChange={(e) => updateTheme("surface", e.target.value)}
                        className="size-10 rounded border border-white/20 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={surfaceColor}
                        onChange={(e) => updateTheme("surface", e.target.value)}
                        className="flex-1 rounded-lg border b-soft bg-surface px-3 py-2 text-[13px] text-text-primary"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12.5px] font-semibold text-text-primary mb-1.5">
                      لون البطاقات والألواح (Surface Panel)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={surfacePanelColor}
                        onChange={(e) => updateTheme("surfacePanel", e.target.value)}
                        className="size-10 rounded border border-white/20 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={surfacePanelColor}
                        onChange={(e) => updateTheme("surfacePanel", e.target.value)}
                        className="flex-1 rounded-lg border b-soft bg-surface px-3 py-2 text-[13px] text-text-primary"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border b-gold bg-surface-panel p-6 sticky top-6">
                <h3 className="text-[14px] font-bold text-primary mb-3">معاينة تفاعلية حية</h3>
                <div
                  className="rounded-lg p-5 border transition-all"
                  style={{
                    backgroundColor: surfaceColor,
                    borderColor: containerColor,
                  }}
                >
                  <p className="text-[11px] font-bold tracking-widest uppercase mb-1" style={{ color: primaryColor }}>
                    ALTA PREVIEW
                  </p>
                  <h4 className="text-[17px] font-bold text-white mb-2">
                    حلول متكاملة تقود أعمالك نحو <span style={{ color: primaryColor }}>الريادة</span>
                  </h4>
                  <p className="text-[12px] leading-relaxed mb-4" style={{ color: "#94a3b8" }}>
                    نبتكر حلولاً نوعية في الاستثمار والذكاء الاصطناعي وإدارة المرافق.
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="rounded px-3 py-1.5 text-[11.5px] font-bold text-slate-950 transition-transform active:scale-95"
                      style={{ backgroundColor: primaryColor }}
                    >
                      زر رئيسي
                    </button>
                    <button
                      className="rounded border px-3 py-1.5 text-[11.5px] font-semibold text-white"
                      style={{ borderColor: containerColor, backgroundColor: "transparent" }}
                    >
                      زر ثانوي
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full rounded-lg bg-primary py-3 text-[14px] font-bold text-on-primary hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {saving ? "جاري الحفظ..." : "💾 حفظ وتطبيق التغييرات على الموقع"}
                  </button>
                  <button
                    onClick={handleReset}
                    className="text-[12px] text-text-muted hover:text-rose-400 text-center transition-colors"
                  >
                    استعادة الإعدادات الأصلية
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "content" && (
          <div className="mt-8 max-w-4xl space-y-6">
            <div className="rounded-xl border b-soft bg-surface-panel p-6 space-y-5">
              <h2 className="text-[16px] font-bold text-text-primary">واجهة الصفحة الرئيسية (Hero Section)</h2>

              <div>
                <label className="block text-[12.5px] font-semibold text-text-primary mb-1.5">
                  العنوان الصغير الترحيبي (Eyebrow Tag)
                </label>
                <input
                  type="text"
                  placeholder="شركة التا للاستثمار — حلول متكاملة"
                  value={settings.content?.heroEyebrow ?? ""}
                  onChange={(e) => updateContent("heroEyebrow", e.target.value)}
                  className="w-full rounded-lg border b-soft bg-surface px-4 py-2.5 text-[13px] text-text-primary"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-text-primary mb-1.5">
                  العنوان الرئيسي (Hero Title)
                </label>
                <input
                  type="text"
                  placeholder="حلول متكاملة تقود أعمالك نحو"
                  value={settings.content?.heroTitle ?? ""}
                  onChange={(e) => updateContent("heroTitle", e.target.value)}
                  className="w-full rounded-lg border b-soft bg-surface px-4 py-2.5 text-[13px] text-text-primary"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-text-primary mb-1.5">
                  الكلمة المميزة باللون الذهبي (Hero Title Accent)
                </label>
                <input
                  type="text"
                  placeholder="الريادة والتميز"
                  value={settings.content?.heroTitleAccent ?? ""}
                  onChange={(e) => updateContent("heroTitleAccent", e.target.value)}
                  className="w-full rounded-lg border b-soft bg-surface px-4 py-2.5 text-[13px] text-text-primary"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-text-primary mb-1.5">
                  فقرة الوصف التمهيدية (Hero Description)
                </label>
                <textarea
                  rows={3}
                  placeholder="نقدم منظومة متكاملة من الخدمات الاستثمارية والتقنية والتشغيلية..."
                  value={settings.content?.heroBody ?? ""}
                  onChange={(e) => updateContent("heroBody", e.target.value)}
                  className="w-full rounded-lg border b-soft bg-surface px-4 py-2.5 text-[13px] text-text-primary"
                />
              </div>
            </div>

            <div className="rounded-xl border b-soft bg-surface-panel p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-bold text-text-primary">شريط الإعلانات العلوي (Announcement Bar)</h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(settings.content?.announcementActive || settings.content?.announcement)}
                    onChange={(e) => updateContent("announcementActive", e.target.checked)}
                    className="size-4 rounded accent-primary"
                  />
                  <span className="text-[12.5px] text-text-primary">تفعيل الشريط</span>
                </label>
              </div>
              <input
                type="text"
                placeholder="مثال: نرحب بطلبات المشاريع للربع السنوي الجديد — تواصل معنا اليوم"
                value={settings.content?.announcement ?? ""}
                onChange={(e) => updateContent("announcement", e.target.value)}
                className="w-full rounded-lg border b-soft bg-surface px-4 py-2.5 text-[13px] text-text-primary"
              />
            </div>

            <div className="rounded-xl border b-soft bg-surface-panel p-6 space-y-4">
              <h2 className="text-[16px] font-bold text-text-primary">معلومات التواصل السريع</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[12px] font-semibold text-text-muted mb-1">رقم الهاتف الرسمي</label>
                  <input
                    type="text"
                    placeholder="966500000000"
                    value={settings.content?.phone ?? ""}
                    onChange={(e) => updateContent("phone", e.target.value)}
                    className="w-full rounded-lg border b-soft bg-surface px-3 py-2 text-[13px] text-text-primary"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-text-muted mb-1">رقم واتساب المباشر للعملاء</label>
                  <input
                    type="text"
                    placeholder="966500000000"
                    value={settings.content?.whatsapp ?? ""}
                    onChange={(e) => updateContent("whatsapp", e.target.value)}
                    className="w-full rounded-lg border b-soft bg-surface px-3 py-2 text-[13px] text-text-primary"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-text-muted mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    placeholder="info@alta.sa"
                    value={settings.content?.email ?? ""}
                    onChange={(e) => updateContent("email", e.target.value)}
                    className="w-full rounded-lg border b-soft bg-surface px-3 py-2 text-[13px] text-text-primary"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-text-muted mb-1">السجل التجاري</label>
                  <input
                    type="text"
                    placeholder="1010XXXXXX"
                    value={settings.content?.crNumber ?? ""}
                    onChange={(e) => updateContent("crNumber", e.target.value)}
                    className="w-full rounded-lg border b-soft bg-surface px-3 py-2 text-[13px] text-text-primary"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-primary px-6 py-3 text-[14px] font-bold text-on-primary hover:opacity-90 transition-all disabled:opacity-50"
            >
              {saving ? "جاري الحفظ..." : "💾 حفظ كافة التغييرات على الموقع الحي"}
            </button>
          </div>
        )}

        {activeTab === "media" && (
          <div className="mt-8 max-w-4xl space-y-6">
            <div className="rounded-xl border b-soft bg-surface-panel p-6 space-y-5">
              <h2 className="text-[16px] font-bold text-text-primary">إدارة صور الواجهة الرئيسية</h2>

              <div>
                <label className="block text-[12.5px] font-semibold text-text-primary mb-1.5">
                  رابط صورة الواجهة الرئيسية (Hero Cityscape Image)
                </label>
                <input
                  type="text"
                  placeholder="/hero_cityscape.png أو رابط https://..."
                  value={settings.images?.hero ?? ""}
                  onChange={(e) => updateImage("hero", e.target.value)}
                  className="w-full rounded-lg border b-soft bg-surface px-4 py-2.5 text-[13px] text-text-primary"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-text-primary mb-1.5">
                  رابط صورة قسم عن الشركة (About Office Image)
                </label>
                <input
                  type="text"
                  placeholder="/about_office.webp أو رابط https://..."
                  value={settings.images?.about ?? ""}
                  onChange={(e) => updateImage("about", e.target.value)}
                  className="w-full rounded-lg border b-soft bg-surface px-4 py-2.5 text-[13px] text-text-primary"
                  dir="ltr"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-primary px-6 py-3 text-[14px] font-bold text-on-primary hover:opacity-90 transition-all disabled:opacity-50"
            >
              {saving ? "جاري الحفظ..." : "💾 حفظ وتحديث الصور"}
            </button>
          </div>
        )}

        {activeTab === "whatsapp" && (
          <div className="mt-8 max-w-4xl space-y-6">
            <div className="rounded-xl border b-gold bg-surface-panel p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-bold text-primary">وكيل واتساب الذكي (WAHA / WhatsApp 24/7 Agent)</h2>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-950/30 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                  متصل وجاهز للعمل
                </span>
              </div>
              <p className="text-[13px] leading-relaxed text-text-muted">
                يتيح لك وكيل واتساب إدارة الموقع كاملاً وإصدار التقارير اليومية وتعديل الألوان والمحتوى عبر إرسال رسائل أو ملاحظات صوتية من هاتفك المصرح له.
              </p>

              <div>
                <label className="block text-[13px] font-bold text-text-primary mb-1.5">
                  أرقام هواتف المالك المصرح لها بقيادة الموقع (Allowed Senders)
                </label>
                <p className="text-[12px] text-text-muted mb-2">
                  أدخل أرقام الهواتف المسموح لها بالتحكم (مفصولة بفواصل بالصيغة الدولية بدون +، مثال: 966501234567, 966598765432)
                </p>
                <input
                  type="text"
                  placeholder="966500000000, 966511111111"
                  value={settings.content?.allowedSenders ?? ""}
                  onChange={(e) => updateContent("allowedSenders", e.target.value)}
                  className="w-full rounded-lg border b-soft bg-surface px-4 py-2.5 text-[13px] text-text-primary"
                  dir="ltr"
                />
              </div>

              <div className="rounded-lg border b-soft bg-surface p-4 space-y-3">
                <h3 className="text-[13px] font-bold text-text-primary">رابط الويب هوك (WAHA Webhook Endpoint)</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="https://alta.sa/api/waha/webhook"
                    className="flex-1 rounded border b-soft bg-surface-panel px-3 py-2 text-[12.5px] font-mono text-text-muted select-all"
                    dir="ltr"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("https://alta.sa/api/waha/webhook");
                      alert("تم نسخ رابط Webhook بنجاح!");
                    }}
                    className="rounded bg-primary/20 px-3 py-2 text-[12px] font-semibold text-primary hover:bg-primary/30 transition-colors"
                  >
                    نسخ الرابط
                  </button>
                </div>
                <p className="text-[11.5px] text-text-muted">
                  قم بوضع هذا الرابط في لوحة تحكم WAHA في حقل Webhooks (مع حدث <code>message</code>).
                </p>
              </div>

              <div className="rounded-lg border b-soft bg-surface p-4">
                <h3 className="text-[13px] font-bold text-text-primary mb-2">أمثلة على أوامر واتساب المتاحة للمالك:</h3>
                <div className="grid gap-2 text-[12px] text-text-muted sm:grid-cols-2">
                  <div>• <code>alta</code> — عرض قائمة الأوامر</div>
                  <div>• <code>alta تقرير</code> — توليد تقرير تحليلي فوري</div>
                  <div>• <code>alta لون رئيسي ذهبي</code> — طلب تغيير اللون</div>
                  <div>• <code>alta نص العنوان: حلول أعمالنا</code> — تغيير العنوان</div>
                  <div>• <code>موافقة XXXXX</code> — اعتماد وتطبيق التغيير فوراً</div>
                  <div>• <code>alta استرجاع 4</code> — الرجوع لإصدار سابق</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-primary px-6 py-3 text-[14px] font-bold text-on-primary hover:opacity-90 transition-all disabled:opacity-50"
            >
              {saving ? "جاري الحفظ..." : "💾 حفظ إعدادات أرقام واتساب"}
            </button>
          </div>
        )}

        {activeTab === "history" && (
          <div className="mt-8 max-w-4xl space-y-6">
            <div className="rounded-xl border b-soft bg-surface-panel p-6">
              <h2 className="text-[16px] font-bold text-text-primary mb-2">سجل الإصدارات والتراجع (Audit & Rollback)</h2>
              <p className="text-[13px] text-text-muted mb-6">
                كل تعديل يتم اعتماده (سواء من لوحة التحكم أو عبر أوامر واتساب) يحفظ كإصدار غير قابل للتعديل ويمكن استرجاعه فوراً بضغطة زر.
              </p>

              <div className="space-y-3">
                {revisions.length === 0 ? (
                  <p className="text-[13px] text-text-muted">لا توجد نسخ معدلة سابقة بعد (الإصدار الأساسي r0 نشط).</p>
                ) : (
                  revisions.map((rev) => (
                    <div
                      key={rev.revision}
                      className="rounded-lg border b-soft bg-surface p-4 flex flex-wrap items-center justify-between gap-4 hover:border-primary/50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-display font-bold text-[14px] text-primary">
                            الإصدار r{rev.revision}
                          </span>
                          {rev.revision === settings.revision && (
                            <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                              النشط حالياً
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[12px] text-text-muted">
                          بواسطة: {rev.updatedBy} · التاريخ: {new Date(rev.updatedAt).toLocaleString("ar-SA")}
                        </p>
                      </div>

                      {rev.revision !== settings.revision && (
                        <button
                          onClick={() => handleRestore(rev.revision)}
                          className="rounded-md border border-[color:var(--color-primary-container)] px-3.5 py-1.5 text-[12px] font-semibold text-primary hover:bg-primary/15 transition-colors"
                        >
                          ↩️ استرجاع هذا الإصدار
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
