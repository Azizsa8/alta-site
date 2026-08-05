# شركة التا للاستثمار — ALTA Investment Company

Arabic-first (RTL) corporate site for ALTA Investment Company, Riyadh, plus the
behaviour-analytics backend and the WhatsApp agent system.

Next.js 16 · React 19 · Tailwind v4 · Netlify.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
npm run build
npm run verify       # boots the production server, runs 655 assertions × 5 passes
```

Copy `.env.example` to `.env.local` and fill in what you need. Everything runs
without any secret — the AI degrades to deterministic behaviour and the store
falls back to `.data/` on disk.

## Content is the source of truth

Every Arabic string lives in `src/content/` and is transcribed verbatim from
`stitch_vision_into_reality/ALTA-APPROVED-CONTENT.pdf` (إصدار 2026). Pages are
pure functions of that data — to change copy, change the content module.

The approved document forbids publishing unverified figures, licences or
achievements. `npm run verify` asserts this, so the mockup's statistics band
cannot be reintroduced by accident.

## Structure

```
src/
  content/          approved copy — site.ts, services.ts, pages.ts
  components/       ui/ layout/ forms/ seo/ theme/
  lib/
    store.ts        Netlify Blobs, falling back to .data/ off-platform
    analytics.ts    event capture + daily analysis (deterministic + AI layers)
    ai.ts           Gemini client with a pinned model chain
    settings.ts     live theme/content overrides written by the agents
    validation.ts   one schema, shared by the forms and the API routes
    agents/         registry · proposals · transport-agnostic core
  app/
    (pages)         / about services[+8] sectors projects media-center
                    careers faq contact request-quote privacy-policy terms
    api/            contact quote chat feedback analytics/run
                    admin/analytics agent/message agent/readiness
                    whatsapp/webhook
netlify/functions/daily-analysis.mts    scheduled 05:00 UTC = 08:00 Riyadh
scripts/verify.mjs                      the 5-pass verification suite
docs/WHATSAPP-AGENTS.md                 agent operations guide
```

## Admin dashboard

`/admin` — the 08:00 report, interest scoring, satisfaction, the chat→form funnel,
visitor questions, incoming submissions, pending WhatsApp proposals and the agent
audit trail. Login at `/admin/login`.

```bash
node scripts/hash-password.mjs "your-password"   # prints the hash + session secret
# then set ADMIN_USERNAME, ADMIN_PASSWORD_HASH, ADMIN_SESSION_SECRET
```

Two credentials, because they serve different callers: the dashboard uses a signed
HttpOnly session cookie (a browser cannot send a bearer header by navigating to a
URL), while `ADMIN_TOKEN` stays available for scripts and curl. Both are accepted by
`/api/admin/analytics`. With the login vars unset, `/admin` shows a setup notice
locally and redirects in production — it never opens up.

## Behaviour analytics

Form submissions, AI-chat turns and explicit satisfaction ratings are captured
to one key per event (`events/<riyadh-day>/<id>`) — Blobs has no atomic append,
so a shared array would drop concurrent writes.

The daily job computes interest scores, a satisfaction index, the chat→form
funnel and form-completion times in plain TypeScript, then asks the AI only for
the narrative. If the AI is unavailable the report is marked `degraded` with a
machine-readable reason and keeps every number.

```bash
# run on demand
curl -X POST "localhost:3000/api/analytics/run?day=2026-08-05" -H "x-cron-secret: $CRON_SECRET"
# read a report
curl "localhost:3000/api/admin/analytics?day=2026-08-05" -H "authorization: Bearer $ADMIN_TOKEN"
# today's raw numbers, without writing a report
curl "localhost:3000/api/admin/analytics?live=1" -H "authorization: Bearer $ADMIN_TOKEN"
```

## WhatsApp agents

See [docs/WHATSAPP-AGENTS.md](docs/WHATSAPP-AGENTS.md). Two properties that must
survive any refactor: nothing is applied without an explicit `موافقة <id>`, and
an empty sender allow-list trusts nobody.

## Deploying

Push to the connected branch; Netlify builds from `netlify.toml`. After a deploy,
check the deploy's **function count is not 0** — a green build with zero
functions means the Next runtime plugin did not run and every API route is a 404.
