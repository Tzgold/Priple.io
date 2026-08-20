# Alerts & Settings Finish Pass — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the personal Alerts + Settings loop: real inbox only, unread bell badge, hide Telegram, coaching empty states.

**Architecture:** Desk store stops merging `mockAlerts`; shell reads `savedAlerts.length` for the bell; Alerts/Overview/Settings copy and empty states coach the rule → pulse → inbox path. No new APIs or engines.

**Tech Stack:** Next.js App Router, React client components, existing `/api/alerts` + `/api/settings`, desk context in `app-store.tsx`.

**Spec:** `docs/superpowers/specs/2026-08-20-alerts-settings-finish-design.md`

## Global Constraints

- Product surfaces never show `mockAlerts`.
- Telegram UI removed; API may still store `telegramHandle`.
- No soft realtime, no new alert types, no pulse threshold changes.
- Prefer small commits per task.

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/app-store.tsx` | `alerts === savedAlerts`; drop mock merge + `dismissedMockAlertIds` |
| `src/components/app/DashboardShell.tsx` | Bell badge from `useDesk().savedAlerts.length` |
| `src/app/(app)/app/alerts/page.tsx` | Coaching empty rules + inbox |
| `src/app/(app)/app/settings/page.tsx` | Remove Telegram; fix copy/counts |
| `src/components/app/OverviewBoard.tsx` | Real inbox only + empty coach |
| `src/lib/alert-inbox.test.ts` | Pure helper test for “real inbox only” if extracted; otherwise assert via store invariants documented in smoke |

---

### Task 1: Real inbox in desk store

**Files:**
- Modify: `src/lib/app-store.tsx`
- Test: manual / typecheck (`npx tsc --noEmit`)

**Interfaces:**
- Produces: `alerts` is the same list as `savedAlerts` (API events only)
- Produces: `dismissAlert(id)` only hits API for saved ids (no mock dismiss prefs)

- [ ] **Step 1: Remove mock merge**

In `src/lib/app-store.tsx`:
- Drop `mockAlerts` import.
- Remove `dismissedMockAlertIds` from `DeskPrefs` and `defaultPrefs`.
- Replace alerts memo with: `const alerts = savedAlerts;` (or `useMemo(() => savedAlerts, [savedAlerts])`).
- In `dismissAlert`, delete the `setPrefs` mock-dismiss branch; only API dismiss for saved alerts.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/app-store.tsx
git commit -m "fix: stop merging mock alerts into the personal inbox"
```

---

### Task 2: Bell unread badge

**Files:**
- Modify: `src/components/app/DashboardShell.tsx`

**Interfaces:**
- Consumes: `useDesk().savedAlerts` (DashboardTopBar is inside `DeskProvider`)

- [ ] **Step 1: Wire badge**

In `DashboardTopBar`:
- `import { useDesk } from "@/lib/app-store"`
- `const { savedAlerts } = useDesk()`
- Replace always-on rose dot with conditional badge when `savedAlerts.length > 0`, showing the count (cap display at `9+` if count > 9).

Example badge markup:

```tsx
{savedAlerts.length > 0 ? (
  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 font-mono text-[9px] font-semibold text-white">
    {savedAlerts.length > 9 ? "9+" : savedAlerts.length}
  </span>
) : null}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/app/DashboardShell.tsx
git commit -m "feat: show unread alert count on the shell bell"
```

---

### Task 3: Settings — hide Telegram + real counts

**Files:**
- Modify: `src/app/(app)/app/settings/page.tsx`

- [ ] **Step 1: Remove Telegram UI**

- Delete `telegramHandle` state, settings fetch that only loads telegram, and the Telegram form block.
- Narrow `save()` partial type to `{ emailAlerts?: boolean; defaultChart?: ChartPref }`.
- Update PageHeader description to: profile, email alerts, chart default, and host.
- Profile desk line: `{wallets.length} wallets · {savedAlerts.length} inbox alerts`
- Drop unused `alerts` from `useDesk()` if no longer needed.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/app/settings/page.tsx
git commit -m "feat: hide Telegram from settings until delivery ships"
```

---

### Task 4: Alerts page coaching empty states

**Files:**
- Modify: `src/app/(app)/app/alerts/page.tsx`

- [ ] **Step 1: Empty rules coach**

Replace empty rules `<li>` with coaching that includes:
- Link or button path to track a wallet (`/app/wallets` and/or `useAddWallet().openAddWallet`)
- Mention New rule CTA
- Note default ≥ $25k transfers still land without a custom rule

- [ ] **Step 2: Empty inbox coach**

Replace empty inbox text with a short block:
- Loop: track → rule (optional) → pulse → event
- Button: open New rule (`setOpen(true)`)
- Link: `/app/settings` for email

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/app/alerts/page.tsx
git commit -m "feat: coach empty alerts rules and inbox toward the real loop"
```

---

### Task 5: Overview inbox — real only + empty coach

**Files:**
- Modify: `src/components/app/OverviewBoard.tsx`

- [ ] **Step 1: Real slice only**

Change inbox memo to:

```tsx
const inbox = useMemo(() => savedAlerts.slice(0, 4), [savedAlerts]);
```

Remove fallback to `alerts` (mocks).

- [ ] **Step 2: Empty coach**

When `inbox.length === 0`, render a compact dashed empty state under the strip header:
- One sentence: pulse + rules fill this when tracked desks move
- Link Manage already exists; add secondary line linking to `/app/alerts` for New rule if needed

- [ ] **Step 3: Typecheck + commit**

Run: `npx tsc --noEmit`  
Expected: PASS

```bash
git add src/components/app/OverviewBoard.tsx
git commit -m "feat: show real Overview alerts with coaching empty state"
```

---

### Task 6: Smoke verify

- [ ] **Step 1: Confirm**

- `npx tsc --noEmit` passes
- Grep product code: no `mockAlerts` imports outside `src/lib/mock/data.ts` and marketing
- Manual: Alerts empty shows coach; Settings has no Telegram; bell has no badge when inbox empty

- [ ] **Step 2: Final status commit only if leftover**

If any polish leftovers, commit; else done.

---

## Spec coverage check

| Spec item | Task |
|-----------|------|
| Real inbox only | 1, 5 |
| Bell unread badge | 2 |
| Hide Telegram | 3 |
| Empty coaching Alerts | 4 |
| Empty coaching Overview | 5 |
| Settings count / copy | 3 |
| No new APIs / engines | — (global) |
