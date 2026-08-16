# Desk header + multi-wallet chart marks — Implementation Plan

> **For agentic workers:** Implement task-by-task. Spec: `docs/superpowers/specs/2026-08-16-desk-header-wallet-tracking-design.md`

**Goal:** Production MarsCoin-style desk header + working multi-wallet buy/sell avatars on Priple chart.

**Architecture:** DexScreener enrichment feeds header stats/socials. Marks API accepts multiple wallets. Desk merges focused dossier trade + Alchemy marks. Tracking forces Priple chart.

**Tech Stack:** Next.js App Router, Lightweight Charts, DexScreener public API, Alchemy transfers, DiceBear avatars

## Global Constraints

- No TradingView Advanced Charts in this slice
- Do not commit `.env.local`
- Prefer Dex data when GT/CG sparse

---

### Task 1: Dex enrichment + socials

Modify `src/lib/dexscreener.ts` to return imageUrl, websites, twitter, telegram, discord, pairUrl from pair `info`.

### Task 2: Wallet avatar + marks quality

- Add `walletAvatarUrl(address)` helper
- Extend `WalletChartMark` with `walletAddress`
- Deduplicate by `time|side|wallet|hash`, not time alone
- Set `avatarUrl` from helper

### Task 3: Multi-wallet marks API

`GET /api/wallets/marks` accepts `wallets` (comma addresses) + optional `labels` JSON + focus `wallet` + optional seed `at`/`side`/`label`.

### Task 4: TokenDeskView header + tracking

- MarsCoin header layout
- Merge Dex socials into token
- Load marks for focus + all `trackedWallets`
- Force Priple while tracking; hide other chart modes
- Seed mark from `trackFocusTime` when provided

### Task 5: Verify

`npx tsc --noEmit`
