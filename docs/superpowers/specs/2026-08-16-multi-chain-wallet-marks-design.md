# Multi-chain wallet marks & dossiers

**Date:** 2026-08-16  
**Status:** Approved — implementing

## Goal

Tracked wallets work on every chain Priple supports as a trading desk: live activity, holdings, and chart marks — not ETH-only.

## Chains

`ETH`, `BASE`, `ARB`, `OP`, `POLYGON`, `BNB`, `AVAX` (Alchemy EVM) · `SOL` (Alchemy Solana / RPC)

## Rules

1. Marks API accepts `network` (token network) and resolves Alchemy host from it.
2. Dossier live path uses wallet `chain`, not ETH hard-code.
3. Seed marks from dossier clicks still work on all chains.
4. Add-wallet UI lists all supported chains.
5. Deploy/polish remain later.

## Acceptance

- Track BASE/SOL/BNB/… wallet → live dossier (or clear note if key/network missing)
- Open coin on that chain with `?wallet=` → marks load for that network
- Multi-wallet overlay still works across same-chain desks
