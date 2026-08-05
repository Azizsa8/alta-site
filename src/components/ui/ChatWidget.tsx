"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

type Msg = { role: "user" | "assistant"; text: string };

const GREETING =
  "أهلاً بك في شركة التا للاستثمار. كيف يمكنني مساعدتك؟ يمكنك سؤالي عن خدماتنا أو طلب عرض سعر.";

const SUGGESTIONS = [
  "ما الخدمات التي تقدمونها؟",
  "كيف أحصل على عرض سعر؟",
  "أخبرني عن حلول الذكاء الاصطناعي",
];

const SESSION_KEY = "alta_chat_session";

/**
 * One conversation identity per tab, so the daily analysis can group turns
 * without any cross-site tracking.
 *
 * Deliberately at module scope and called only from event handlers: it touches
 * `sessionStorage` and generates randomness, neither of which may happen during
 * render. sessionStorage is itself the cache, so no React state is involved and
 * the component never re-renders because of it.
 */
function sessionId(): string {
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = `s_${crypto.randomUUID()}`;
  sessionStorage.setItem(SESSION_KEY, id);
  return id;
}

/**
 * Public AI assistant.
 *
 * Beyond answering visitors, this is one of the two behaviour-analysis inputs
 * the backend runs on: every turn is written to the analytics store server-side
 * (see `/api/chat`), and the thumbs control posts an explicit satisfaction
 * signal so the daily report has both inferred and stated sentiment.
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", text: GREETING }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [rated, setRated] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: clean }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: clean,
          sessionId: sessionId(),
          history: msgs.slice(-6),
          path: window.location.pathname,
        }),
      });
      const data = await res.json();
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          text:
            data?.reply ??
            "تعذر الرد في الوقت الحالي. يمكنك التواصل معنا عبر نموذج التواصل وسيصلك الرد من الفريق المختص.",
        },
      ]);
    } catch {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          text: "تعذر الاتصال حالياً. يرجى المحاولة مرة أخرى أو استخدام نموذج التواصل.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function rate(score: 1 | -1) {
    setRated(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId(), score, source: "chat" }),
      });
    } catch {
      /* A failed rating must never surface as an error to the visitor. */
    }
  }

  const assistantTurns = msgs.filter((m) => m.role === "assistant").length;

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="المساعد الذكي"
          className="fixed bottom-24 end-5 z-50 flex h-[min(560px,calc(100dvh-8rem))] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-xl border b-gold bg-surface shadow-panel"
        >
          <div className="flex items-center justify-between gap-3 border-b b-soft bg-surface-elevated px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-full bg-primary/15 text-primary">
                <Icon name="spark" className="size-4" />
              </span>
              <div>
                <p className="text-[13px] font-bold text-text-primary">المساعد الذكي</p>
                <p className="text-[11px] text-text-muted">شركة التا للاستثمار</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="إغلاق المحادثة"
              className="grid size-8 place-items-center rounded-md text-text-muted hover:text-primary"
            >
              <Icon name="close" className="size-4" strokeWidth={2} />
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-[13px] leading-[1.8] ${
                  m.role === "user"
                    ? "ms-auto bg-primary text-on-primary"
                    : "me-auto border b-soft bg-surface-panel text-text-primary"
                }`}
              >
                {m.text}
              </div>
            ))}

            {busy && (
              <div className="me-auto flex gap-1.5 rounded-lg border b-soft bg-surface-panel px-3.5 py-3">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-1.5 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </div>
            )}

            {msgs.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border b-gold px-3 py-1.5 text-[11.5px] text-primary hover:bg-primary/10"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {assistantTurns > 2 && !rated && (
              <div className="flex items-center justify-center gap-3 rounded-lg border b-soft bg-surface-panel px-3 py-2.5">
                <span className="text-[11.5px] text-text-muted">هل كانت الإجابات مفيدة؟</span>
                <button
                  type="button"
                  onClick={() => rate(1)}
                  className="rounded-md px-2 py-1 text-[13px] text-success hover:bg-success/10"
                >
                  نعم
                </button>
                <button
                  type="button"
                  onClick={() => rate(-1)}
                  className="rounded-md px-2 py-1 text-[13px] text-text-muted hover:bg-white/5"
                >
                  لا
                </button>
              </div>
            )}
            {rated && (
              <p className="text-center text-[11.5px] text-text-muted">شكراً لتقييمك.</p>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t b-soft bg-surface-elevated px-3 py-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب رسالتك…"
              aria-label="رسالتك"
              className="min-w-0 flex-1 rounded-md border b-soft bg-surface px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted focus:border-[color:var(--color-primary-container)] focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="إرسال"
              className="grid size-10 shrink-0 place-items-center rounded-md bg-primary text-on-primary disabled:opacity-50"
            >
              <Icon name="arrow" className="size-4" strokeWidth={2.2} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "إغلاق المساعد الذكي" : "افتح المساعد الذكي"}
        className="fixed bottom-5 end-5 z-50 grid size-14 place-items-center rounded-full bg-primary text-on-primary shadow-gold transition-transform hover:-translate-y-0.5"
      >
        <Icon name={open ? "close" : "spark"} className="size-6" strokeWidth={2} />
      </button>
    </>
  );
}
