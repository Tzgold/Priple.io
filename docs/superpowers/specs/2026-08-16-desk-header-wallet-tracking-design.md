# Desk header + wallet chart tracking

**Date:** 2026-08-16  
**Status:** Approved for implementation  
**Later:** TradingView Advanced Charts after public deploy + license

## Goal

Ship a production desk that matches a real research terminal: dense MarsCoin-style header (stats, socials, favorite), best available chart coverage (Dex / TV widget), and reliable wallet profile avatars on buy/sell points — including multiple tracked wallets on the same coin.

## Product rules

1. **Header is source-agnostic.** Prefer DexScreener enrichment for MCap / Price / 24H / Vol / Liq / socials / image when on-chain. CoinGecko / GeckoTerminal fill gaps. Never leave the header sparse when Dex has data.
2. **Charts until Advanced Charts license:** Dex embed for DEX tokens, TradingView widget when mapped, Priple (Lightweight Charts) when wallet tracking is active — overlays only work on Priple.
3. **Tracking is multi-wallet.** Opening a coin with a focus wallet still loads marks for **all saved tracked wallets** that have activity on that token; avatars stack on the candle.
4. **Avatars are real profile images** (deterministic from wallet address), not empty initials-only placeholders. Buy = teal ring, sell = rose ring.
5. **No “good enough for now” shortcuts** that hide empty tracking: if the user clicked a known activity row (`at` + `side`), that trade must appear as a mark even when Alchemy returns nothing else.
6. **TradingView Advanced Charts** is out of scope until the app is deployed and the license form is submitted with a live URL.

## Non-goals

- Rebuilding DexScreener or TradingView
- Drawing avatars on Dex/TV iframes
- Full multi-chain Alchemy marks in this slice (ETH Alchemy remains the live marks backend; focused dossier marks still show for the clicked trade)

## Acceptance

- Desk header shows MCap, Price, 24H, Vol, Liq; icon row for website / X / explorer / Dex / ★ favorite
- With `?wallet=` on screener, chart is Priple and shows avatar markers
- Two+ tracked wallets that traded the same token show stacked distinct avatars
- Clicking an activity row with time always places at least that wallet’s avatar near that candle
