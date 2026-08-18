# Grounded LLM Narrative + Ask More — Design

**Date:** 2026-08-18  
**Product:** Priple research terminal  
**Status:** Draft for review (no implementation until this spec is approved)  
**Approach:** B — fact packet is source of truth; LLM writes the briefing; chat answers only from that packet  
**Out of scope:** Telegram bot, global sidebar chat, tool-calling live lookups, TradingView Charting Library, LLM inventing extra on-chain facts

---

## 0. Product principle

Priple’s north star is **the right fact on the desk at the right moment**. The LLM is a writer and a tutor for facts we already gathered. It is not a second data vendor and not a trade advisor.

| Always true | Never true |
|-------------|------------|
| Every number, wallet, ticker, and “live vs demo” flag in the briefing exists in the packet | The model invents a transfer, USD size, headline, or overlap |
| Quiet windows stay quiet | Empty pulse is padded with demo tape described as the user’s desks |
| Chat can refuse: “not in this window” | Chat answers market trivia, price targets, or “should I buy” |
| Template narrative remains the fallback | The desk goes blank if the model is down |

Telegram delivery stays parked. This spec does not build a bot.

---

## 1. What we are building

Two surfaces, **one engine**:

1. **Briefing** — a better “Priple Narrative” (headline, short paragraphs, highlight, facts row, sources).
2. **Ask more** — a short thread under that card so the user can question *this* briefing.

**Ship order (same spec, two waves):**

- **Wave 1 (this plan’s first implementation):** wallets — Home compact card + `/app/wallets` full card.
- **Wave 2:** token desk — same card + Ask more, packet built from `CoinAnalysis` + intel + score + flows on that coin.

Wave 2 does not get a different prompt personality. Only the packet shape changes.

---

## 2. Where we are today

| Piece | Today |
|--------|--------|
| Wallet narrative | `buildWalletNarrative()` template copy from dossier + flow clusters |
| UI | `WalletNarrativeCard` on Home (compact) and `/app/wallets` |
| Coin brief | `buildCoinAnalysis()` template summary + intel tape; no LLM |
| AI stack | None (`ai` / AI Gateway not in the app) |
| Auth | Better Auth session on all desk APIs |
| Rate limits | Postgres `limitUserRoute` per user + route |

Keep `buildWalletNarrative` (and the coin template) as **deterministic fallback** and as a checksum: the LLM briefing must not contradict the facts row.

---

## 3. Architecture

Four units, each with one job:

```
Client (WalletNarrativeCard)
    → POST /api/narrative/brief   { subject: wallet | coin, id }
    ← { briefing, threadId, origin: "llm" | "template" }

    → POST /api/narrative/chat    { threadId, message }
    ← UI message stream (Ask more)
         │
         ▼
Server
  PacketBuilder   — rebuild facts for this user + subject (never trust client packet)
  BriefingWriter  — structured LLM output in WalletNarrative shape
  ChatTutor       — stream answers grounded in the stored packet
  ThreadStore     — Postgres thread + messages
```

### 3.1 PacketBuilder

**Input:** session `userId` + subject.

**Wallet subject:** `{ type: "wallet", walletId }`  
- Wallet row must belong to this user (`listWallets`).
- Dossier from existing wallet dossier loader (same window as the page).
- Flow clusters from existing flows builder on that user’s pulse.
- Pulse items for that address only; `live` is true only if those items are `source: "personal"` (never demo).

**Coin subject (Wave 2):** `{ type: "coin", network, address }`  
- Packet from `buildCoinAnalysis` + flows for that symbol + why-here if present.
- No other user’s wallets in the packet.

**Packet contents (wallet, Wave 1):**

- `subject`: label, address, chain
- `window`: `{ live: boolean, generatedAt, note }` — `note` is `"demo"` or `"empty"` or `"alchemy"`
- `counts`: buys, sells, assets touched, networks
- `activity`: capped list (max 24) of `{ side, asset, amount, usd, time, date, hash?, network }`
- `holdings`: capped list (max 12) of `{ symbol, network }`
- `flows`: related clusters (symbol, walletCount, leader label, whether this wallet led)
- `sources`: string list (same honesty rules as today)
- `template`: the fallback `WalletNarrative` (for UI fallback and model “do not contradict”)

**Hard rules:**

- Client cannot POST a packet. Client only POSTs subject ids.
- Truncate strings (labels 64, amounts 32). No raw HTML.
- If dossier is empty and not live: packet `window.note = "empty"` (personal) or `"demo"` only when the *page* is in market demo mode **and** the subject is a curated/demo desk, not a tracked user wallet.

Tracked user wallets never receive demo rows in the packet (matches pulse truth pass).

### 3.2 BriefingWriter

- Model via **Vercel AI Gateway** (no provider API keys in app code unless Gateway is unavailable; then document the env in implementation, still no keys in git).
- Model id is chosen at implementation from the live Gateway list (do not freeze a stale id in this spec). Prefer a fast, cheap chat model for both briefing and Ask more.
- Structured output matching `WalletNarrative`: `headline`, `paragraphs` (max 4), `highlight` or null, `facts` (same four labels as template: Buys/sells, Assets touched, Networks, Wallet overlap), `sources` (copy from packet; model may not add sources).
- System instructions (normative):
  - Research only, not advice. No buy/sell/hold recommendations.
  - Use only packet fields. If a detail is missing, omit it.
  - If `live` is false, the prose must say the window is not a live personal feed (quiet or market/demo as the packet states).
  - Do not mention wallets, tokens, or USD sizes that are not in the packet.
  - Tone: terminal, specific, short. No hype (“smart money is loading”, “this will run”).
- On any model/schema failure: return template briefing, `origin: "template"`, Ask more still allowed if a thread was created with the packet (chat can explain the template). If packet build fails, no thread.

### 3.3 ChatTutor (Ask more)

- Bound to `threadId`. The stored packet is the only extra context besides last messages.
- Max **10 user messages** per thread. Next message returns 400 with a clear “start a new briefing” note (refreshing the card creates a new thread).
- Max **400 characters** per user message.
- Stream the assistant reply (AI SDK UI message stream).
- Same system rules as BriefingWriter, plus: answer the question; if not in the packet, say it is not in this window; do not browse or fetch.
- No tool calls in Wave 1–2.

### 3.4 ThreadStore

Postgres, created with the same “ensure table” pattern as `user_settings` / rate limits (no separate migration runner required).

`narrative_threads`

- `id` uuid pk  
- `user_id` text not null  
- `subject_type` text (`wallet` | `coin`)  
- `subject_key` text (wallet id or `network:address`)  
- `packet_json` jsonb not null  
- `briefing_json` jsonb not null  
- `origin` text (`llm` | `template`)  
- `created_at` timestamptz  
- `expires_at` timestamptz (created_at + **24 hours**)

`narrative_messages`

- `id` uuid pk  
- `thread_id` uuid fk  
- `role` text (`user` | `assistant`)  
- `content` text  
- `created_at` timestamptz  

Access: every read/write filters `user_id = session.user.id`. Expired threads are ignored (lazy: skip if `expires_at < now()`).

One **active** thread per user+subject: a new brief replaces the previous thread for that subject (old row can remain until expiry; the card uses the latest non-expired).

---

## 4. API

All routes: session required; 401 otherwise. All use `limitUserRoute`.

| Route | Limit | Body | Success |
|-------|--------|------|---------|
| `POST /api/narrative/brief` | 8 / min | `{ type, walletId? }` Wave 1; Wave 2 adds `{ type:"coin", network, address }` | `{ threadId, briefing, origin }` |
| `POST /api/narrative/chat` | 20 / min | `{ threadId, message }` | UI message stream |
| `GET /api/narrative/thread?id=` | 30 / min | — | `{ briefing, origin, messages }` for resume on refresh |

Generic 4xx/5xx messages. Do not return model stack traces or raw provider errors.

Clip `walletId` / `network` / `address` / `message` the same way intel/settings clip inputs.

---

## 5. UI

Stay inside `WalletNarrativeCard` (rename only if the card also serves coins; display title stays **Priple Narrative**).

- Existing briefing layout unchanged (headline, paragraphs, highlight, facts, sources).
- Badge: `LLM` when `origin === "llm"`, otherwise omit (template looks as today).
- Subtitle stays: “This window’s feeds · not a prediction”.
- **Ask more** block under sources:
  - Message list (user right / assistant left, same mono 12px desk type).
  - Input placeholder: “Ask about this window…”
  - Disabled when no `threadId` (packet failed).
  - Empty state one line: “Ask about the buys, overlap, or whether this feed is live.”
- Home compact card: briefing compact (2 paragraphs) as today; Ask more **collapsed** with “Ask more” toggle so Home stays scannable.
- Wallets page: Ask more open.
- Loading: keep last briefing; show “Writing…” on first LLM brief. Do not flash empty.
- Errors: one mono line under the input (“Couldn’t reach the model — template briefing is showing”).

Do not add a new `/app/chat` route in this spec.

---

## 6. Data flow (Wave 1)

1. User opens Home or Wallets (session already required).
2. Card requests `POST /api/narrative/brief` with the focused tracked wallet id.
3. Server builds packet from dossier + flows for that wallet.
4. Writer produces structured briefing or falls back to template.
5. Thread stored; card renders briefing.
6. User asks a question → `POST /api/narrative/chat` streams into the thread.
7. Refresh: `GET` thread if `threadId` is in component state or we pass wallet id and server returns latest thread.

Home focused wallet stays the current rule: tracked wallet with the most pulse rows in this window (address match only). If none, no LLM card (same as no narrative today).

---

## 7. Error handling

| Failure | User sees |
|---------|-----------|
| No session | Existing app redirect / 401 |
| Wallet not theirs | 404 `{ error: "Wallet not found" }` |
| Rate limit | Existing rate-limit JSON |
| Gateway/model down | Template briefing, `origin: "template"`, Ask more still works on packet |
| Structured output invalid | Template |
| Chat with expired/foreign thread | 404 |
| 11th user message | 400, explain cap |
| Empty personal window | LLM or template says quiet; Ask more may only confirm quiet / no overlap |

---

## 8. Testing (implementation must cover)

- Packet for a tracked wallet with `live: false` contains **zero** demo pulse rows.
- Packet activity addresses match the wallet (no label-only mix-in when a full address exists).
- Briefing JSON rejected if a paragraph contains a `$` amount or ticker not present in the packet (server-side check: scan template facts + activity assets; if extra ticker-like tokens appear, discard LLM and use template). Keep this check simple: allow only asset symbols from the packet plus the wallet label.
- Chat route refuses another user’s `threadId`.
- Rate limit keys: `narrative:brief` and `narrative:chat`.

Automated tests can be unit tests on PacketBuilder + symbol-guard. Full Gateway calls are not required in CI.

---

## 9. Env and ops

- Vercel AI Gateway as default (OIDC on Vercel). Local dev: Gateway env as documented at implementation time in `.env.local` (gitignored).
- No new secrets committed.
- Cost control: Wave 1 limits above; briefing cached on the thread for 24h so revisiting the same wallet does not re-call the writer unless the client sends `{ refresh: true }` (Wallets page explicit “Refresh briefing” later; Wave 1 can omit refresh and always reuse a non-expired thread).

Wave 1 **reuses** a non-expired thread for the same user+wallet (no extra LLM cost on every Home poll). Home pulse polling must **not** spam `/brief`. Call brief once when the focused wallet id is set, not on the 60s pulse timer.

---

## 10. Success criteria

- On a live tracked wallet, the card reads like a briefing (specific, sourced), not a fill-in-the-blank template, and still matches the facts row.
- User can ask “is this live?” and get an answer that matches the `live` flag.
- User can ask “what did they buy?” and only hear assets in the packet.
- User can ask “will this pump?” and get a refusal (research, not advice).
- Model outage still shows today’s template narrative.
- Coin desk Wave 2 uses the same APIs and card without a second chat product.

---

## 11. Explicit non-goals (Wave 1–2)

- Telegram / email of the LLM text  
- Memory across different wallets in one thread  
- The model calling Alchemy, CoinGecko, or the web  
- Changing Opportunity Score math  
- Marketing landing copy updates (optional later: “Narratives” scene can mention Ask more once Wave 1 is on production)
