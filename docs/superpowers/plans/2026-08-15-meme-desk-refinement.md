# Meme Desk Refinement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Same watch visibility for **all** coins. Keep TradingView for mapped majors. For non-TV coins, use a serious chart (DexScreener embed) + full metric header (MCap/Price/24H/Vol/Liq). DIY Lightweight Charts becomes fallback only.

**Architecture:** Keep `TokenDeskView` as the single desk UI. Introduce a small server-side `MarketDataGateway` that prefers GeckoTerminal, caches aggressively, and later fills from DexScreener. Client keeps local candle aggregation via `candle-math.ts`.

**Tech stack:** Next.js App Router, existing `/api/token*` routes, GeckoTerminal, CoinGecko, Lightweight Charts, optional DexScreener (phase 2). Secrets only via `.env.local` (never commit).

**Spec:** `docs/superpowers/specs/2026-08-15-meme-desk-refinement-design.md`

**Status:** Draft — implement **Phase 1** only after design approval. Phase 2+ listed for sequencing.

---

## File map (planned)

| File | Role |
|------|------|
| `src/lib/market-cache.ts` | TTL cache + in-flight coalesce |
| `src/lib/market-gateway.ts` | Desk/OHLCV orchestration (phase 1 GT-only; phase 2 + DexScreener) |
| `src/lib/dexscreener.ts` | Phase 2 client |
| `src/lib/candle-math.ts` | Extend tests; keep aggregate/mcap helpers |
| `src/lib/geckoterminal.ts` | Fix supply/board mcap; rank search hits |
| `src/app/api/token/route.ts` | Use gateway; return `provider` / `cached` meta |
| `src/app/api/token/ohlcv/route.ts` | Use gateway + cache |
| `src/components/app/TokenDeskView.tsx` | Security strip, depth, volume-ready props |
| `src/components/app/TokenCandleChart.tsx` | Volume histogram |
| `src/components/app/PairSearchBox.tsx` | Show liq/vol/pair; recents later |
| `src/app/(app)/app/screener/page.tsx` | Board mcap via `estimateMarketCap` |

---

## Phase 1 — Reliability & truthfulness

### Task 1: Shared market cache helper

**Files:**
- Create: `src/lib/market-cache.ts`
- Test: `src/lib/market-cache.test.ts` (or project’s existing test runner if present)

- [ ] **Step 1:** Add `getOrSet<T>(key, ttlMs, loader)` with in-flight Map so parallel callers share one promise
- [ ] **Step 2:** Add simple unit test: two parallel gets → loader runs once
- [ ] **Step 3:** Commit

```bash
git add src/lib/market-cache.ts src/lib/market-cache.test.ts
git commit -m "feat: add TTL market cache with request coalesce"
```

### Task 2: Supply / mcap correctness

**Files:**
- Modify: `src/lib/geckoterminal.ts` (`fetchTokenDesk`, `fetchTrendingBoard`)
- Modify: `src/lib/candle-math.ts` (export `normalizeSupply` if useful)
- Modify: `src/app/(app)/app/screener/page.tsx` (board column)

- [ ] **Step 1:** Centralize supply normalization (normalized OR total/10^decimals; reject nonsense)
- [ ] **Step 2:** Board rows use `estimateMarketCap` same as desk
- [ ] **Step 3:** Manual check on a meme with null mcap but FDV
- [ ] **Step 4:** Commit

```bash
git commit -m "fix: normalize meme supply and align board mcap with desk"
```

### Task 3: Wire cache into token APIs

**Files:**
- Modify: `src/app/api/token/route.ts`
- Modify: `src/app/api/token/ohlcv/route.ts`
- Create (thin): `src/lib/market-gateway.ts` wrapping GT for now

- [ ] **Step 1:** Cache desk payload ~45–90s keyed by `desk:{network}:{address}`
- [ ] **Step 2:** Cache OHLCV ~45–90s keyed by `ohlcv:{network}:{pool}:{tf}:{agg}`
- [ ] **Step 3:** JSON meta `{ provider: "geckoterminal", cached: boolean }`
- [ ] **Step 4:** Commit

```bash
git commit -m "feat: cache token desk and OHLCV responses"
```

### Task 4: Ranked pair search UX

**Files:**
- Modify: `src/lib/geckoterminal.ts` (`searchTokens`)
- Modify: `src/components/app/PairSearchBox.tsx`
- Modify API hit type to include optional `liquidityUsd`, `volume24hUsd`, `pairLabel`

- [ ] **Step 1:** Sort DEX hits by liquidity then volume
- [ ] **Step 2:** Dropdown shows pair label + compact liq
- [ ] **Step 3:** Commit

```bash
git commit -m "feat: rank pair search by liquidity like a TV picker"
```

### Task 5: Desk trust strip (security + depth)

**Files:**
- Modify: `src/components/app/TokenDeskView.tsx`
- Possibly surface fields already on `token.info`

- [ ] **Step 1:** Render chips for honeypot / mintable / freezable / GT score when known
- [ ] **Step 2:** Show depth ratio or “liq vs mcap” under Liquidity metric
- [ ] **Step 3:** Empty states stay quiet (no scary red if unknown)
- [ ] **Step 4:** Commit

```bash
git commit -m "feat: show meme security and liquidity depth on desk"
```

### Task 6: Volume under candles

**Files:**
- Modify: `src/components/app/TokenCandleChart.tsx`
- Modify: `src/components/app/TokenDeskView.tsx` if series plumbing needed

- [ ] **Step 1:** Add Lightweight Charts histogram series from `candle.volume`
- [ ] **Step 2:** Verify interval aggregate still updates volume buckets
- [ ] **Step 3:** Commit

```bash
git commit -m "feat: add volume histogram to DEX candle chart"
```

### Task 7: Phase 1 verification

- [ ] **Step 1:** `npx tsc --noEmit`
- [ ] **Step 2:** Manual fixture checklist from design §9
- [ ] **Step 3:** Confirm `.env.local` untracked: `git check-ignore -v .env.local`
- [ ] **Step 4:** Stop and report; do **not** start Phase 2 without approval

---

## Phase 2 — DexScreener fallback (after Phase 1 approval)

### Task 8: DexScreener client

- Create `src/lib/dexscreener.ts` (token/pairs lookup, OHLCV if available or trade-derived candles)
- Env: none initially; if key required later → `.env.local` only
- Commit: `feat: add DexScreener market data client`

### Task 9: Gateway merge rules

- Extend `market-gateway.ts`: GT primary → DexScreener fill for mcap/ohlcv
- Expose `provider` chain in API
- Commit: `feat: fall back to DexScreener when GeckoTerminal is thin`

### Task 10: Pool switcher UI

- Desk header lists top pools; selecting reloads OHLCV for that pool
- External “Open on DexScreener” link
- Commit: `feat: add pool switcher and DexScreener deep link`

---

## Phase 3 — Watch completeness only (optional follow-on)

- Longer day/hour prefetch, desk polling while focused, search recents, holders list
- **Do not** add indicator menus / drawings / TV chrome unless founder asks

---

## Out of scope (do not sneak in)

- Committing secrets / `.env.local`
- Replacing TradingView for majors
- Making meme charts “fully functional like TradingView”
- Full indicator IDE / drawing tools / save layouts
- Birdeye until Phase 2 measured weak on Solana

---

## Approval gate

- [ ] User approved design spec
- [ ] User chose provider sequence (default: Phase 1 then Phase 2 Option A)
- [ ] User confirmed Lightweight Charts remains primary meme chart (not iframe)
