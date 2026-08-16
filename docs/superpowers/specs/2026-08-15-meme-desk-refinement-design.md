# Meme Desk Refinement — Design & Analysis

**Date:** 2026-08-15  
**Product:** Priple research terminal  
**Status:** Draft for review (no implementation until approved)  
**Scope:** Majors already open **TradingView and feel complete** — keep that. For coins that fall onto our DIY chart, the experience is too weak. Goal: **same watch visibility for all coins** (metrics + a serious chart), matching the reference desk (Market Cap, Price, 24H, Vol, Liquidity, Price/MCap, volume, readable candles) — not “give up on chart quality for memes.”

---

## 0. Product principle (corrected)

### What already works (keep)
When a coin maps to TradingView (`TV_SYMBOL_BY_CG`), the desk is **fully functional and good**. That lane stays.

### What’s broken
When a coin has **no TV symbol**, we use our Lightweight Charts desk. That lane is **not good enough** — weaker visibility than the reference screenshot (COW-style: hero metrics + serious chart + Price/MCap + volume).

### Real goal
**Same visibility experience for all coins** — not “info-only / chart doesn’t matter.”

| Keep | Fix |
|------|-----|
| TradingView for majors / mapped symbols | Non-TV coins must not feel like a downgrade |
| Metric row: MCap, Price, 24H, Vol, Liquidity | Always filled (FDV / Est. when needed) |
| Price / MCap chart scale | Available on every coin we can supply |
| Search → open desk | Chart area must look trustworthy |

**North star:** Open *any* coin → same confidence as opening COW on the reference desk. Majors stay on TV; everyone else gets the best serious chart path we can ship (not a thin DIY stub).

### Clarification vs earlier misunderstanding
Earlier draft said “we don’t need meme charts fully functional like TradingView.” That was **wrong relative to founder intent**. Founder means: we don’t need to *rebuild* TV feature-by-feature ourselves if another path gives the **same quality experience** — but the **experience bar is the screenshot**, for **all** coins.

---

## 1. Executive summary

Priple already has a working **dual-lane desk**:

| Lane | Who | Chart | Data |
|------|-----|-------|------|
| **Majors / CEX** | BTC, ETH, SOL, LINK, … mapped in `TV_SYMBOL_BY_CG` | TradingView Advanced Chart | CEX liquidity, professional UX |
| **Memes / DEX** | Everything else (contracts, trending pools) | Lightweight Charts | GeckoTerminal (+ CoinGecko onchain info) |

Majors feel “finished.” Memes feel “researchable but fragile”: thin candle history on long TFs, missing or estimated mcap, GeckoTerminal 429s under load, search that doesn’t rank like a pair picker, and security/holder data that is fetched but mostly hidden.

**Recommended direction:** Keep TradingView wherever it already works. For everything else, **stop treating DIY Lightweight Charts as the main experience** — use a serious chart path (DexScreener embed first; later TV Charting Library if needed) and make the **metric header identical** to the reference desk for every coin.

---

## 2. Where we are today (as-built)

### 2.1 Surface area

```
/app/screener
  ├─ PairSearchBox  →  GET /api/token?query=
  ├─ TokenDeskView  →  GET /api/token | /api/token/cg | /api/token/ohlcv
  └─ Board          →  GET /api/screener (majors + trending)

/app/token/[network]/[address]   → same TokenDeskView
/app/token/cg/[id]               → CoinGecko desk
```

### 2.2 Key modules

| Layer | Path | Responsibility |
|-------|------|----------------|
| Search UI | `src/components/app/PairSearchBox.tsx` | Debounced pair dropdown |
| Desk UI | `src/components/app/TokenDeskView.tsx` | Metrics, TV/DEX toggle, intervals, Price/MCap, swaps/holders |
| DEX chart | `src/components/app/TokenCandleChart.tsx` | Lightweight Charts |
| TV chart | `src/components/app/TradingViewAdvancedChart.tsx` | Embedded TV widget |
| Candle math | `src/lib/candle-math.ts` | Aggregate TFs, est. mcap, mcap series |
| GT client | `src/lib/geckoterminal.ts` | Token desk, OHLCV, trades, search, trending |
| CG clients | `src/lib/coingecko.ts`, `src/lib/token-info.ts`, `src/app/api/token/cg/route.ts` | Majors board, onchain info, CG-only desks |
| Routes map | `src/lib/token-routes.ts` | Majors addresses + TV symbols |

### 2.3 Data flow (memecoin path)

1. User types → `searchTokens` (address resolution across chains **or** CG search + GT pool search).
2. Click hit → `/app/screener?network=&address=`.
3. Desk loads once: GT token + best pool + **1m OHLCV (limit ~1000)** + trades.
4. Soft second call: **1h OHLCV** for longer TFs.
5. Interval buttons **re-aggregate locally** (no per-click GT call) — this fixed the timer/429 UX.
6. Mcap metric uses: reported mcap → FDV → `price × supply` (labeled Est. mcap).
7. Chart can switch Price ↔ MCap when supply (or mcap/price) is known.

### 2.4 Providers & secrets

| Provider | Role today | Env | In git? |
|----------|------------|-----|---------|
| GeckoTerminal | DEX tokens, pools, OHLCV, trades, search | none (public) | n/a |
| CoinGecko | Majors, search, onchain info, CG desk | `COINGECKO_API_KEY` | `.env.local` only |
| TradingView | Majors chart widget | none | n/a |
| Alchemy | Wallet pulse (not charts) | `ALCHEMY_*` | `.env.local` only |
| QuickNode | Present in env, **unused** by desk | `QUICKNODE_RPC_URL` | `.env.local` only |

**Safety:** `.env*` is gitignored; APIs read `process.env` only. Do not commit `.env.local`.

### 2.5 What already works

- TV-style search dropdown (pairs + TV/DEX badge).
- Contract paste across ETH / Base / Arb / BSC / OP / Polygon / Solana.
- Majors: TV chart quality.
- Memes: real DEX candles + swaps; local TF switching; FDV/est. mcap labels; Price/MCap toggle.
- Socials + coarse holders when CoinGecko onchain `/info` has data.
- Soft 429 messages instead of hard crashes on interval spam (mostly solved by local aggregate).

---

## 3. Problem analysis (why memes still feel bad)

### 3.1 Chart quality gap vs TradingView

| Dimension | Majors (TV) | Memes (DEX today) | Impact |
|-----------|-------------|-------------------|--------|
| Candle fidelity | Exchange OHLC | Pool OHLCV; history capped (~1000×1m ≈ ~16h of fine data; hours help longer TF) | 1D/4H feel short or sparse |
| Volume pane | Yes | Volume fetched, **not plotted** | Hard to read conviction |
| Indicators | Built-in | None | Power users bounce |
| Live updates | Streaming | One-shot load | Stale desk |
| Wrong pool | N/A (symbol) | Single “top” pool | Chart can look “dead” or wrong quote |

### 3.2 Market-cap gap

- GT often returns `market_cap_usd: null` for new/micro caps.
- FDV may exist; circulating supply may be wrong if decimals/normalization fail.
- Board table uses `marketCapUsd ?? fdvUsd` only — **no** price×supply fallback (desk does).
- Trending board can multiply price × raw `total_supply` without decimal safety → risk of absurd numbers.
- Users compare meme desks to CASHCAT/DexScreener where **mcap is always a hero metric**.

### 3.3 Rate-limit / reliability gap

- GT: in-process 45s cache + retry; **no shared cache** across serverless instances → duplicate load.
- Search pools use `noStore` → burns quota.
- Hour OHLCV still a second call; soft-fails into amber note → higher TFs degrade silently.
- CoinGecko: no 429 retry; onchain info → `null` → empty socials/holders look “broken.”

### 3.4 Search UX gap vs TradingView

Today: symbol/name/contract → flat list with network + DEX/TV badge.

Missing vs TV mental model:

- Rank by liquidity / 24h volume  
- Show pair quote (`TOKEN / SOL`, `TOKEN / WETH`) and venue  
- Chain filters  
- “Best pool” default with alternate pools  
- Recents / favorites  

### 3.5 Research desk gap (data we already fetch but underuse)

From `token-info.ts` / depth helpers:

- GT score, honeypot / mint / freeze flags — **fetched, not shown**
- Depth ratio — **computed, not shown**
- Top holders — coarse buckets only; no address list / labels

This is a high leverage UX win without new vendors.

### 3.6 Structural limit (must accept)

**TradingView will not chart arbitrary DEX memecoins** unless we build a custom datafeed or use a third-party DEX chart product. Priple’s job is to make the **DEX lane** feel intentional and trustworthy, not to fake a CEX symbol.

---

## 4. Goals & non-goals

### Goals (success criteria) — “watch info complete”

1. Open a trending Solana/Base meme → **same metric row as the reference desk**: Market cap (or labeled FDV/Est.), Price, 24h, Vol, Liquidity — filled whenever any provider has data.  
2. Chart is **readable**, not pro: candles + volume + working intervals + Price/MCap; change 1m→1D without blanking.  
3. Under GT pressure, desk still shows **last good / fallback** info (not empty “—” everywhere).  
4. Search → click pair → desk opens with the right token/pool; dropdown shows enough to choose (pair + liq).  
5. When safety/holders/socials exist, they are **visible** so the watch page feels complete.

### Non-goals (explicit)

- Full TradingView / CASHCAT chart chrome (indicators menu, drawings, %/log/auto pro tools, save layouts).  
- Making meme charts “as functional” as TV majors.  
- Replacing Better Auth / Supabase security model.  
- Real-time websocket everywhere (optional soft poll later).  
- Committing any API keys or `.env.local`.

---

## 5. Options (how to make non-TV coins feel like the screenshot)

### Option 1 — Expand TradingView coverage + DexScreener chart embed for the rest *(recommended)*

**How:**
- Keep Advanced Chart widget wherever we have / can resolve a TV symbol (majors + any meme that exists on TV).
- For the rest: embed **DexScreener** (or Gecko) pair chart in the chart panel — pro candles/volume/intervals — while **Priple owns** the header metrics (MCap, Price, 24H, Vol, Liquidity, socials, swaps).
- Still fix mcap/liq truth + cache so the header matches the screenshot.

| Pros | Cons |
|------|------|
| Closest to “all coins feel serious” fast | Embed is third-party UI inside our desk |
| Majors stay fully functional TV | Price/MCap toggle may be embed-limited (we keep it on our metrics + try native where possible) |
| No TV Charting Library license | Branding less unified |

### Option 2 — TradingView Charting Library + our OHLCV datafeed *(best long-term match to screenshot)*

**How:** Same TV engine as the screenshot for every coin; we feed DEX candles (GT/DexScreener) + mcap scale.

| Pros | Cons |
|------|------|
| True “same chart for all coins” | Needs TradingView license / approval for production |
| Price/MCap, indicators, pro UX | Heavier build (weeks) |

### Option 3 — Keep DIY Lightweight Charts but heavily upgrade

**How:** Volume, mcap axis, better history, polish to look closer to the screenshot.

| Pros | Cons |
|------|------|
| Full control, no iframe | Still won’t feel as functional as TV for users who just saw majors |
| No new vendor | Hard to close the quality gap |

### Decision (proposal)

**Ship Option 1 now** (TV when possible → DexScreener chart when not) + info-header parity.  
**Evaluate Option 2** if embeds aren’t good enough after users try it.

---

## 5b. Target UX (all coins)

```
┌─────────────────────────────────────────────────────────┐
│  Token · chain · contract · socials                     │
│  Market cap | Price | 24H | Vol | Liquidity             │  ← always Priple, always filled
├─────────────────────────────────────────────────────────┤
│  Chart:                                                 │
│    IF tvSymbol     → TradingView Advanced (as today)    │
│    ELSE            → DexScreener pair embed (serious)   │
│    fallback        → Lightweight Charts (last resort)   │
└─────────────────────────────────────────────────────────┘
│  Swaps · Holders · Safety                               │
```

---

## 6. Target architecture

```
                    ┌─────────────────────┐
  PairSearchBox ───►│  /api/token?query   │──► search ranker (liq/vol)
                    └─────────┬───────────┘
                              ▼
                    ┌─────────────────────┐
  TokenDeskView ───►│ MarketDataGateway   │
                    │  getDesk(network,addr)
                    │  getOhlcv(pool, tf)
                    └─────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         GeckoTerminal   DexScreener      CoinGecko
         (primary)       (fill/fallback)  (info/majors)
              │               │
              └───────┬───────┘
                      ▼
              Cache (TTL + coalesce)
                      ▼
         candle-math (aggregate, mcap)
                      ▼
         TokenCandleChart / metrics UI
```

**Gateway rules (proposed):**

1. Prefer GT pool with highest liquidity for the token.  
2. If GT OHLCV empty or 429 after retries → DexScreener pair candles.  
3. Mcap: GT mcap → DexScreener mcap → FDV → price×normalized supply; always label source.  
4. Never block first paint on secondary provider > ~800ms (stream/soft fill).

---

## 7. Phased delivery plan

### Phase 0 — Spec lock & instrumentation (0.5 day)

- Agree Option A/B sequence.  
- Add lightweight server timing / `source` fields on API responses (`provider: "gt" | "dexscreener" | "cache"`).  
- Manual QA checklist for 5 fixture tokens (major, liquid Sol meme, dead pool, new launch, EVM meme).

### Phase 1 — Reliability & truthfulness (no new vendor) *(~2–3 days)*

1. **Request coalesce + longer desk cache** for `/api/token` and `/api/token/ohlcv`.  
2. **Supply math audit** — only use normalized supply or decimals-safe division; unit tests in `candle-math` / helpers.  
3. **Board mcap parity** with desk (`estimateMarketCap`).  
4. **Show security strip** (honeypot / mint / freeze / GT score) when present.  
5. **Show depth / liq ratio** next to liquidity.  
6. **Volume histogram** under candles.  
7. **Search ranking** by pool liquidity then volume; show pair label + liq in dropdown.  
8. Soft banner when candles are stale/cached vs live.

**Exit criteria:** Interval switching never blanks a loaded desk; mcap label never silently “—” when FDV or supply×price exists.

### Phase 2 — DexScreener fill/fallback *(~3–4 days)*

1. `src/lib/dexscreener.ts` client (no secrets usually; public API — confirm ToS / rate).  
2. Wire into gateway for: search enrichment, mcap/liq fill, OHLCV fallback.  
3. Multi-pair picker in desk header (“Pools”) when >1 liquid pool.  
4. “Open on DexScreener” external link always.  
5. Cache DexScreener responses similarly.

**Exit criteria:** For GT 429 fixture, desk still shows candles + mcap from fallback within one retry budget.

### Phase 3 — Watch completeness polish *(optional, keep thin)*

Only info-pack improvements — **not** TV feature parity:

1. Longer hour/day base load (cached) so the move is visible on 4H/1D.  
2. Recents in search.  
3. Soft poll price/trades while tab focused.  
4. Holder top-10 if available.  
5. Skip SMA/indicators unless users ask later.

**Exit criteria:** Side-by-side with a CASHCAT-style desk: same *information*, not the same chart toolbox.

### Phase 4 — Optional Solana depth (Birdeye) *(later)*

Only if Sol memes still miss mcap/candles after DexScreener. Requires `BIRDEYE_API_KEY` in `.env.local` (never commit).

---

## 8. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Provider ToS / blocking | Cache aggressively; identify as Priple server; fallback chain |
| Wrong pool chart | Rank pools; expose pool switcher |
| Estimated mcap misleading | Always label Est./FDV; tooltip “from supply × price” |
| Serverless cold cache miss | Short TTL + coalesce in-flight promises per key |
| Scope creep into full TV clone | Cap Phase 3 at volume + 2 MAs + pool switch |

---

## 9. Testing plan (manual + light automated)

**Automated**

- `aggregateCandles` / `estimateMarketCap` / supply normalization unit tests.  
- Gateway merge: GT empty + DexScreener fill → non-empty candles.

**Manual fixtures**

1. BTC / ETH — still TV by default.  
2. WETH / wrapped SOL — DEX path + optional TV if mapped.  
3. High-liq Sol meme from trending board.  
4. Fresh launch (&lt;1h) — expect Est. mcap / thin candles, not crash.  
5. Paste wrong-chain address — clear empty state.  
6. Rapid interval flipping — no blank, no 429 storm.

**Security check before any commit**

- `git status` must not include `.env.local`.  
- Grep staged files for `postgres://`, private keys, `sk_live`.

---

## 10. Open decisions (need your call)

1. **Provider sequence:** Confirm **B then A** (cache first, then DexScreener)?  
2. **Primary meme chart:** Keep Lightweight Charts (recommended) vs iframe embed?  
3. **Solana priority:** Is Sol meme quality more important than EVM for the next 2 weeks? (Affects Birdeye timing.)

---

## 11. Suggested next message from you

Approve this design (with any edits), then we turn Phase 1 into a bite-sized implementation plan under `docs/superpowers/plans/` and start coding Phase 1 only.
