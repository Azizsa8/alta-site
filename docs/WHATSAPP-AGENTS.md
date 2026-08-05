# WhatsApp Agent System — Operations Guide

The "24/7 employee": a client texts a project keyword to one WhatsApp number,
and the agent for that project changes their live site — after they approve it.

## Architecture

```
WhatsApp ──► /api/whatsapp/webhook ──┐
                                     ├──► handleInboundMessage()  ──► proposal
Simulator ─► /api/agent/message ─────┘         (src/lib/agents/core.ts)      │
                                                                             │
                                          client texts "موافقة <ID>" ────────┘
                                                        │
                                                        ▼
                                            writeSettings()  ──► Netlify Blobs
                                                        │
                                                        ▼
                                        <ThemeVars> + page reads settings
                                            (live, no rebuild, no deploy)
```

**The brain is transport-agnostic.** `handleInboundMessage(sender, text, audio)`
returns a reply string and knows nothing about WhatsApp. That is why the whole
system is testable today, with no WhatsApp account — through
`POST /api/agent/message`. Adding Telegram or SMS later means writing one more
transport file, not touching the brain.

## Two safety properties — do not remove

1. **Nothing is applied without approval.** Every mutating instruction creates
   a *proposal* with a 5-character id and a 24-hour TTL. The site changes only
   when the client texts `موافقة <ID>`.
2. **Authorisation is by allow-listed sender, never by keyword.** A project
   keyword is not a secret — it gets forwarded, screenshotted and read aloud.
   An empty `AGENT_ALLOWED_SENDERS_<ID>` therefore trusts **nobody**, which is
   the intended default. Denied attempts are written to the audit log.

Colour values are validated as plain hex (`#rrggbb`) at write time *and* again
at render time. An agent cannot inject arbitrary CSS.

## Commands

Start every message with the project keyword (`alta`, `التا`, `hospitality`, `ضيافة`).

| Intent | Example |
| --- | --- |
| Menu | `alta` |
| Primary colour | `alta لون رئيسي #d9a84e` |
| Named colour | `alta غيّر اللون إلى ذهبي` |
| Background | `alta لون الخلفية كحلي` |
| Headline | `alta نص العنوان: حلول متكاملة تقود أعمالك` |
| Paragraph | `alta نص الوصف: نحن شركة سعودية…` |
| Announcement bar | `alta شريط إعلان: نستقبل طلبات الربع الأول` |
| Image | `alta صورة الرئيسية: https://…/hero.jpg` |
| Suggestions | `alta معاينة` |
| Behaviour report | `alta تقرير` |
| Current state | `alta حالة` |
| Pending requests | `alta قائمة` |
| Approve | `موافقة A7K2M` |
| Reject | `رفض A7K2M` |
| Roll back | `alta استرجاع 4` |

**Voice notes work.** The webhook downloads the audio from Meta, transcribes it
with Gemini, and feeds the text through the identical command path — there is
no separate voice pipeline to keep in sync.

## Going live — the one step that needs a human

Everything above is built and testable now. Connecting a real WhatsApp number
is **not something an automated agent can complete**, because Meta sends a
verification code to a physical device (SMS or voice call). That step needs a
person holding the SIM.

1. Meta Business Manager → add the business number.
2. WhatsApp → API Setup → enter the code Meta sends to the device.
3. Create a **System User** and generate a permanent access token
   (`whatsapp_business_messaging` + `whatsapp_business_management`).
4. Set the environment variables from `.env.example`.
5. Webhook URL: `https://<site>/api/whatsapp/webhook`, verify token =
   `WHATSAPP_VERIFY_TOKEN`. Subscribe to the `messages` field.
6. Add the client's number to `AGENT_ALLOWED_SENDERS_<ID>` and redeploy.
7. Confirm with `GET /api/agent/readiness` — `blocking` should be empty.

### Do not use Baileys or whatsapp-web.js

They drive a real WhatsApp Web session, violate WhatsApp's terms, and get the
number **permanently banned**. For a product whose selling point is a 24/7
employee, one ban takes every client's agent offline simultaneously. The
official Cloud API is the only viable transport here.

## Testing without WhatsApp

```bash
curl -X POST http://localhost:3000/api/agent/message \
  -H 'content-type: application/json' \
  -H "authorization: Bearer $ADMIN_TOKEN" \
  -d '{"sender":"966500000000","text":"alta لون رئيسي #d9a84e"}'
# → returns a proposal id

curl -X POST http://localhost:3000/api/agent/message \
  -H 'content-type: application/json' \
  -H "authorization: Bearer $ADMIN_TOKEN" \
  -d '{"sender":"966500000000","text":"موافقة A7K2M"}'
# → applied; the homepage renders the new colour on next request
```

`npm run verify` runs the full suite (pages, APIs, agent flow) five times.

## Audit and rollback

- Every action is appended to `audit/<date>/<id>` in the `alta-agent` store.
- Every applied change snapshots settings to `history/<revision>`.
- `alta استرجاع <n>` restores revision *n* — and is itself a new revision, so
  the history is never rewritten.
