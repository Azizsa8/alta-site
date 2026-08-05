# Backend Access — ALTA

Everything you need to get into the backend, read the data, and check it is healthy.

**Site:** https://iridescent-nougat-9d80f9.netlify.app
**Netlify project:** `iridescent-nougat-9d80f9` (team HEADSUP)

---

## 1. Admin dashboard (the normal way in)

**https://iridescent-nougat-9d80f9.netlify.app/admin/login**

| | |
|---|---|
| Username | `alta-admin` |
| Password | `Pn7Qimag1LPCZ5yx` |

> Change this. It has been shared in chat.
> `node scripts/hash-password.mjs "new-password"` → paste the printed
> `ADMIN_PASSWORD_HASH` into Netlify env → redeploy.

The dashboard shows: the 08:00 executive summary, quote/contact/chat/satisfaction
totals, interest scoring, the chat→form funnel, median form-completion time,
visitor questions verbatim, top pages, incoming submissions, pending WhatsApp
agent proposals, and the agent audit log. A day picker walks back through
previous reports.

Today has no report until 08:00 runs, so the dashboard computes today's numbers
live and labels them as such.

---

## 2. API access (scripts, curl, integrations)

A browser cannot send an `Authorization` header by navigating, which is why the
dashboard uses a session cookie. For scripts, use the bearer token:

```
ADMIN_TOKEN   b57c6d2f738ac743241c6cb0fd74656aedc4f001a412b0d3
CRON_SECRET   10b3e080d58257e8a024269b92ca4bea7155089296f57aa8
```

```bash
BASE=https://iridescent-nougat-9d80f9.netlify.app

# Yesterday's report
curl "$BASE/api/admin/analytics" -H "authorization: Bearer $ADMIN_TOKEN"

# A specific day
curl "$BASE/api/admin/analytics?day=2026-08-05" -H "authorization: Bearer $ADMIN_TOKEN"

# Today's numbers, computed live (no report written)
curl "$BASE/api/admin/analytics?live=1" -H "authorization: Bearer $ADMIN_TOKEN"

# Include the raw submissions for that day
curl "$BASE/api/admin/analytics?day=2026-08-05&submissions=1" -H "authorization: Bearer $ADMIN_TOKEN"

# Run the daily analysis on demand (don't wait for 08:00)
curl -X POST "$BASE/api/analytics/run" -H "x-cron-secret: $CRON_SECRET"

# Is the agent system ready? (safe to run in front of a client — no secrets)
curl "$BASE/api/agent/readiness"
```

---

## 3. Endpoint map

| Route | Auth | Purpose |
|---|---|---|
| `/admin` | session cookie | dashboard |
| `/admin/login` | — | login |
| `/api/admin/analytics` | cookie **or** bearer | reports, live metrics, submissions |
| `/api/admin/login` · `/logout` | — | session |
| `/api/analytics/run` | `x-cron-secret` | the 08:00 job, on demand |
| `/api/agent/readiness` | — | deployment readiness, no secrets |
| `/api/agent/message` | bearer | WhatsApp agent simulator |
| `/api/whatsapp/webhook` | Meta HMAC signature | live WhatsApp transport |
| `/api/contact` · `/api/quote` | public | forms |
| `/api/chat` · `/api/feedback` | public | assistant + satisfaction |

---

## 4. The 08:00 job

`netlify/functions/daily-analysis.mts`, cron `0 5 * * *`.

05:00 UTC **= 08:00 Asia/Riyadh**. Saudi is UTC+3 year-round with no daylight
saving, so this one expression is correct every day. (`0 4` would be Gulf
Standard Time / Dubai — an hour early.)

It analyses **yesterday**, because at 08:00 that is the most recent complete
day. Logs: Netlify → Logs → Functions → `daily-analysis`.

---

## 5. Where the data lives

Netlify Blobs, one key per record — Blobs has no atomic append, so writing
events into a shared array would lose writes whenever two visitors act at once.

```
alta-analytics    events/<riyadh-day>/<id>     every form + chat + rating event
                  reports/<riyadh-day>         the daily report
alta-submissions  contact/<day>/<id>           contact form records
                  quote/<day>/<id>             quote requests (incl. attachment)
alta-agent        proposals/<id>               pending WhatsApp changes
                  audit/<day>/<id>             every agent action
alta-site-settings site-settings               live theme/content overrides
                  history/<revision>           every past revision, for rollback
```

Off Netlify (local dev, CI) the same code writes to `.data/` on disk, which is
what makes all of this testable without deploying.

---

## 6. Health checks

```bash
npm run verify                                  # 970 assertions x 5 passes, local
node scripts/smoke-live.mjs $BASE               # 35 checks against production
node scripts/stress.mjs $BASE $ADMIN_TOKEN $CRON_SECRET   # concurrency + write integrity
```

**After any deploy, confirm the function count is not 0.** A Netlify Next
deploy can go green while publishing `.next` as raw static files — every page
returns 200 and every API route silently 404s. `smoke-live.mjs` checks this
explicitly by calling a real function.

**Never pipe `netlify deploy` into `tail`/`grep`** — you get the pipe's exit
code, so a failed build reports success. Redirect to a file and check `$?`.

---

## 7. Environment variables

Netlify → Project configuration → Environment variables.

| Variable | Purpose | Set? |
|---|---|---|
| `ADMIN_USERNAME` · `ADMIN_PASSWORD_HASH` · `ADMIN_SESSION_SECRET` | dashboard login | yes |
| `ADMIN_TOKEN` | API/script access | yes |
| `CRON_SECRET` | protects the 08:00 job | yes |
| `GEMINI_API_KEY` | AI chat, report narrative, voice notes | yes |
| `WHATSAPP_VERIFY_TOKEN` · `WHATSAPP_APP_SECRET` · `WHATSAPP_TOKEN` · `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp transport | **no** |
| `AGENT_ALLOWED_SENDERS_ALTA` · `_HOSPITALITY` | who may drive each agent | **no** |

**Env changes need a redeploy.** The running function does not pick up a new
variable on its own.

Anything unset **fails closed** — the agents currently accept nothing from
anyone, which is intended until numbers are allow-listed.

---

## 8. Rolling back

Netlify → Deploys → pick a known-good deploy → *Publish deploy*. Takes seconds.

For site content/theme changed by a WhatsApp agent, every applied change is
snapshotted, so `alta استرجاع <revision>` restores any earlier revision — and
the restore is itself a new revision, so history is never rewritten.
