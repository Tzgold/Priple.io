# Priple Six-Pillar Landing Page Design

## Goal

Turn the marketing site into one cohesive, responsive landing page that explains Priple as a complete crypto intelligence product rather than a single wallet-alert feature.

## Product Positioning

Primary promise:

> Track smart money, understand what it is doing, and connect wallet activity to token, market, social, and news context.

Priple is research software, not investment advice. Marketing copy must not imply guaranteed returns, automatic copying, or live production data where the current UI uses mocks.

## One-Page Information Architecture

The persistent navigation scrolls to these sections:

1. **Overview** — Hero, concise product promise, and a realistic terminal preview.
2. **Smart Money** — Favorite wallets, labeled entities, performance context, and buy/sell activity.
3. **Alerts** — Buy/sell notifications plus an advanced rule builder.
4. **Opportunity Score** — Transparent on-chain, social, and market score breakdown.
5. **Flows** — Wallet-pair correlation and cross-chain tracing.
6. **Intelligence** — AI wallet narratives, social/news overlays, and coin analysis.
7. **FAQ** — Direct answers and the research/not-advice boundary.

The separate `/track` page is removed from the primary story. Its useful content is absorbed into the Smart Money and Alerts sections so the landing page is the complete product narrative.

## Visual Direction

- Retain the near-black Remocn/Resend-inspired system, Geist typography, thin single borders, subtle dotted atmosphere, and restrained motion.
- Replace generic Lucide icons where a crypto brand is intended with tree-shakeable branded components from `@web3icons/react`.
- Use real token, network, wallet, and exchange marks only where they represent actual entities: ETH, BTC, SOL, LINK, Ethereum, Base, Arbitrum, BNB Chain, Solana, MetaMask, Phantom, WalletConnect, Binance, and Coinbase.
- Keep Lucide for generic actions such as alerts, search, filters, graphs, and arrows.
- Product cards must be large editorial scenes, not repeated small icon tiles.
- Generated imagery may be used only as subtle atmospheric support. Product functionality is shown with crisp coded UI mocks so labels and data stay readable.

## Six Product Scenes

### 1. Smart-Money Wallet Tracking

A wide wallet intelligence scene shows labeled traders, chain/token icons, realized P&L context, recent buy/sell action, follow state, and delivery channels. The copy explains tracking any address, favorite traders, and curated cohorts.

### 2. Buy/Sell and Custom Alerts

A rule-builder scene combines entity, transaction direction, value threshold, token category, Opportunity Score, and sentiment change. A notification preview shows the resulting alert and links into analysis.

### 3. Opportunity Score

A large score card breaks the composite into on-chain flows, social momentum, market structure, and risk. Each dimension is visible so the score is interpretable rather than opaque.

### 4. Wallet Correlation and Cross-Chain Tracing

A relationship graph connects multiple labeled wallets to a shared token, then traces a bridge path across Ethereum, Base, Arbitrum, BNB Chain, and Solana. The scene emphasizes correlated moves and leader/follower behavior.

### 5. AI Wallet Narratives

A briefing panel summarizes a wallet’s recent behavior, profitable patterns, protocol usage, and overlap with other tracked traders. Supporting facts are visible beside the narrative.

### 6. Social/News Overlay and Coin Analysis

A token chart overlays wallet buys/sells, social-volume spikes, and a news/regulatory event timeline. A side panel provides liquidity, holder concentration, risk, and recent smart-money netflow.

## Copy Rules

- Lead with the complete intelligence loop: track → detect → correlate → understand.
- Mention trader tracking as one capability, not the entire company.
- Use the terminology from the product report: Smart Money, Opportunity Score, wallet correlation, cross-chain flows, AI narratives, custom alerts, social/news overlays, and coin analysis.
- Avoid vague phrases such as “one intelligence layer” unless immediately supported by concrete capabilities.
- Avoid claims about current chain counts, latency, users, or performance until backed by live data.

## Responsive Behavior

- Desktop: alternating full-width and two-column editorial product scenes.
- Tablet: two-column layouts collapse selectively while preserving charts and tables.
- Mobile: every scene becomes a single column; tables use purpose-built compact rows rather than horizontal overflow where possible.
- Navigation uses anchors and a mobile menu; active state is derived from the current hash/section.
- Motion respects `prefers-reduced-motion`.

## Technical Structure

- `src/components/marketing/CryptoIcons.tsx` — stable wrappers around branded Web3 icons.
- `src/components/marketing/ProductSection.tsx` — shared section heading and scene shell.
- `src/components/marketing/scenes/*` — one focused component per product pillar.
- `src/components/marketing/Hero.tsx` — revised complete-product positioning.
- `src/components/marketing/SiteNav.tsx` — anchor navigation for the six pillars.
- `src/components/marketing/Faq.tsx` — report-aligned FAQ.
- `src/app/(marketing)/page.tsx` — assembles the one-page sequence.
- Remove redundant one-feature landing content after its useful parts are migrated.

## Verification

- Production build and TypeScript must pass.
- No missing icon exports or client/server boundary errors.
- All navigation links land on real sections.
- Verify 360px, 768px, 1024px, and 1440px layouts.
- Ensure no horizontal overflow and all product scenes remain readable.
- Confirm copy covers all six pillars and contains the research/not-advice disclaimer.

