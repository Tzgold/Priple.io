# Alerts & Settings Finish Pass — Design

**Date:** 2026-08-20  
**Product:** Priple research terminal  
**Status:** Approved for planning (implementation after plan)  
**Approach:** 2 — polish existing loop + empty-state coaching  
**Goal:** Make Alerts + Settings feel like a finished personal product loop (rule → pulse → inbox → dismiss / email), not a demo with fake events and half-channels.

---

## 0. Decisions locked

| Decision | Choice |
|----------|--------|
| Optimize for | Finish existing loop (not new alert types / delivery) |
| Telegram | Hide from Settings UI this pass |
| Empty inbox | Coaching empty states (not silent dead space) |
| Soft realtime | Out of scope |
| New engines (social / score) | Later |

---

## 1. Goal & scope

### In scope

1. **Real inbox only** — product surfaces use `savedAlerts` from `GET /api/alerts`. Stop merging `mockAlerts` into the personal inbox / Overview.
2. **Bell badge** — unread = count of undismissed saved alerts; hide badge when 0 (no decorative always-on dot).
3. **Settings channels** — in-app (always on) + email toggle only; remove Telegram UI.
4. **Empty-state coaching** — Alerts (rules + inbox) and Overview alerts strip explain the loop: track wallet → optional rule → pulse refresh → event lands; link to Settings for email.
5. **Light clarity** — copy / reading order only; no full Alerts redesign.

### Out of scope (later)

- Telegram bot delivery
- New alert types / engines (`social`, `score` production firing)
- Soft realtime / websockets / aggressive polling
- Changing default pulse threshold logic or Resend email engine behavior
- Redesigning the New rule form layout

---

## 2. Data & shell behavior

### Inbox source of truth

- Desk store `alerts` = `savedAlerts` only (API-backed events).
- Remove product merge of `mockAlerts` in `src/lib/app-store.tsx`.
- `mockAlerts` may remain in `src/lib/mock/data.ts` for marketing mocks only; never feed Alerts page, Overview inbox, Settings desk count, or the bell.
- Dismiss path unchanged: `DELETE /api/alerts/[id]` (soft-dismiss) → refresh.
- Prefer removing `dismissedMockAlertIds` from desk prefs once mocks leave the product path (dead localStorage key unused is acceptable only if cleanup is riskier; prefer clean removal).

### Bell (`DashboardShell`)

- Keep link to `/app/alerts`.
- Badge count = `savedAlerts.length` (undismissed list from API).
- Render badge only when count > 0.

### Settings persistence

- Email + chart default continue via `GET/PATCH /api/settings`.
- UI does not load/edit `telegramHandle` this pass.
- API may still store `telegramHandle` if present; no UI surface.

### Overview

- Alerts strip uses `savedAlerts` only (drop fallback to merged `alerts` that included mocks).
- Empty strip uses the same coaching story as Alerts empty inbox (compact).

### Engine (unchanged)

- Pulse sync / `pulse-alerts.ts` still creates events (default large transfers + custom rules).
- Email via Resend when `email_alerts` is on — no engine changes in this pass.

---

## 3. UX

### Alerts page (`/app/alerts`)

Keep structure: **New rule** → **Active rules** → **Inbox**.

**Empty rules** — coach:

1. Track a wallet (link toward wallets / add flow).
2. Create a size rule (New rule CTA).
3. Pulse evaluates on refresh; note that default large transfers (≥ $25k) still land without a custom rule.

**Empty inbox** — same loop in one short block + CTA New rule + link to Settings for email. Not a blank “nothing yet.”

### Overview alerts strip

- Real events only (slice of `savedAlerts`).
- Empty: compact coach + Manage → `/app/alerts`.

### Settings page (`/app/settings`)

- Remove Telegram block (copy + input + save).
- Description: profile, email channel, chart default, host — no plural “channels” implying Telegram.
- Profile desk line: `savedAlerts.length` for inbox count.
- In-app toggle remains disabled/always-on informational control.

---

## 4. Files likely touched

| Area | Files |
|------|--------|
| Store | `src/lib/app-store.tsx` |
| Shell | `src/components/app/DashboardShell.tsx` |
| Alerts UI | `src/app/(app)/app/alerts/page.tsx` |
| Settings UI | `src/app/(app)/app/settings/page.tsx` |
| Overview | `src/components/app/OverviewBoard.tsx` |
| Mocks | `src/lib/mock/data.ts` (leave fixtures; stop product imports if unused) |

No new API routes required for this pass.

---

## 5. Success criteria

- With zero real events, Alerts + Overview never show demo titles from `mockAlerts`.
- Bell shows a numeric badge only when there is at least one undismissed saved alert.
- Settings has no Telegram field.
- Empty Alerts inbox / empty Overview strip tell the user how to get the first event.
- Creating a rule, dismissing an alert, and toggling email still work as today.

---

## 6. Testing (implementation must cover)

- Store: `alerts` equals `savedAlerts`; no mock ids in the list when `savedAlerts` is empty.
- Shell: badge hidden at 0; visible at N ≥ 1.
- Manual smoke: dismiss alert → count drops; email toggle still PATCHes settings; New rule still POSTs.

---

## 7. Explicit non-goals reminder

Telegram, social/score engines, soft realtime, and threshold redesign stay parked for a later pass.
