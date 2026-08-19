# Grounded LLM Narrative Wave 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline; founder asked to start immediately). Wave 2 (coin desk) is a separate later plan.

**Goal:** Replace the wallet Priple Narrative with a Gateway LLM briefing grounded in a server fact packet, plus Ask more chat on that packet.

**Architecture:** Client posts only `walletId`. Server rebuilds a packet from live dossier + personal flows (never demo rows on tracked wallets), writes structured briefing or falls back to `buildWalletNarrative`, stores a 24h thread, and streams Ask more from the stored packet.

**Tech Stack:** Next.js 16 App Router, Vercel AI SDK (`ai`) via AI Gateway model `google/gemini-3.5-flash-lite`, Postgres `ensure table` like `user_settings`, existing Better Auth + `limitUserRoute`.

## Global Constraints

- Packet is rebuilt on the server; client never posts facts.
- Tracked wallets never include demo pulse rows in the packet (`window.note` is `alchemy` or `empty`).
- LLM briefing discarded if it names tickers not in the packet (plus wallet label).
- Template fallback on any model/schema failure; Ask more still works if a thread exists.
- Research only — no buy/sell/hold advice.
- Rate limits: `narrative:brief` 8/min, `narrative:chat` 20/min, `narrative:thread` 30/min.
- Reuse a non-expired thread per user+wallet; Home must not POST brief on the 60s pulse timer.
- No Telegram, no coin-desk packet, no tool calls, no `/app/chat` route.
- Model string: `google/gemini-3.5-flash-lite` (live Gateway list, 2026-08-18).

## Files

| Path | Responsibility |
|------|----------------|
| `src/lib/narrative-packet.ts` | Types, `buildWalletPacketFromDossier`, `briefingDriftedFromPacket` |
| `src/lib/narrative-packet.test.ts` | Guard + empty/demo packet tests |
| `src/lib/narrative-store.ts` | Postgres threads/messages |
| `src/lib/narrative-llm.ts` | Prompts, `writeBriefing`, `streamAskMore` |
| `src/app/api/narrative/brief/route.ts` | POST brief |
| `src/app/api/narrative/chat/route.ts` | POST chat stream |
| `src/app/api/narrative/thread/route.ts` | GET thread |
| `src/components/app/WalletNarrativeCard.tsx` | LLM badge, fetch once, Ask more |
| `src/components/app/OverviewBoard.tsx` | Pass `walletId`, compact Ask more |
| `src/app/(app)/app/wallets/page.tsx` | Pass `walletId` |
| `src/lib/wallet-narrative.ts` | Export `clustersForWallet` |
| `package.json` | Add `ai`, `zod` |

### Task 1: Packet + drift guard

### Task 2: Thread store

### Task 3: LLM writer + chat stream

### Task 4: API routes

### Task 5: Card + Home/Wallets wiring

### Task 6: `npx tsc --noEmit` + packet tests
