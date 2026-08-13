# Priple Six-Pillar Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Priple’s marketing experience as one responsive landing page that clearly demonstrates all six product pillars with authentic Web3 icons and realistic coded product scenes.

**Architecture:** The marketing homepage composes six isolated scene components through a shared `ProductSection` shell. A small `CryptoIcons` boundary owns third-party Web3 icon imports, while navigation and copy are defined around stable section IDs. Existing app routes remain untouched.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, `@web3icons/react`, Lucide React.

## Global Constraints

- Do not create Git commits; provide split staging/commit commands after verification.
- Keep one landing page with anchor navigation for Overview, Smart Money, Alerts, Opportunity Score, Flows, Intelligence, and FAQ.
- Use authentic branded crypto icons only for real wallets, chains, exchanges, and tokens.
- Product capability visuals must be coded UI, not generated screenshots containing fake or malformed text.
- State clearly that current product scenes use mock data and that Priple is research software, not investment advice.
- Preserve the existing near-black, thin-border, dotted-atmosphere visual system.
- Avoid unsupported claims about live data, users, chain counts, performance, or guaranteed returns.

---

### Task 1: Authentic Web3 icon boundary

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/components/marketing/CryptoIcons.tsx`

**Interfaces:**
- Produces: `CryptoIcon`, `CryptoIconName`, and `cryptoIconNames` for all marketing scenes.
- Consumes: static, tree-shakeable exports from `@web3icons/react`.

- [ ] **Step 1: Install the maintained icon package**

Run:

```powershell
npm install @web3icons/react
```

Expected: package and lockfile include `@web3icons/react` with no audit errors.

- [ ] **Step 2: Inspect exact icon exports**

Run:

```powershell
node -e "const icons=require('@web3icons/react'); console.log(Object.keys(icons).filter(k => /^(Token|Network|Wallet|Exchange)(ETH|BTC|SOL|LINK|Ethereum|Base|Arbitrum|Binance|Solana|Metamask|Phantom|WalletConnect|Coinbase)/.test(k)).sort().join('\n'))"
```

Expected: exact export names for the required branded marks.

- [ ] **Step 3: Add stable icon wrappers**

Create a server-compatible component with a union name map:

```tsx
import {
  ExchangeBinance,
  ExchangeCoinbase,
  NetworkArbitrum,
  NetworkBase,
  NetworkBinanceSmartChain,
  NetworkEthereum,
  NetworkSolana,
  TokenBTC,
  TokenETH,
  TokenLINK,
  TokenSOL,
  WalletMetamask,
  WalletPhantom,
  WalletWalletConnect,
} from "@web3icons/react";

export const cryptoIconNames = [
  "binance",
  "bitcoin",
  "coinbase",
  "ethereum",
  "base",
  "arbitrum",
  "bnb",
  "solana",
  "eth",
  "sol",
  "link",
  "metamask",
  "phantom",
  "walletconnect",
] as const;

export type CryptoIconName = (typeof cryptoIconNames)[number];

const icons = {
  binance: ExchangeBinance,
  bitcoin: TokenBTC,
  coinbase: ExchangeCoinbase,
  ethereum: NetworkEthereum,
  base: NetworkBase,
  arbitrum: NetworkArbitrum,
  bnb: NetworkBinanceSmartChain,
  solana: NetworkSolana,
  eth: TokenETH,
  sol: TokenSOL,
  link: TokenLINK,
  metamask: WalletMetamask,
  phantom: WalletPhantom,
  walletconnect: WalletWalletConnect,
};

export function CryptoIcon({
  name,
  size = 24,
  className,
}: {
  name: CryptoIconName;
  size?: number;
  className?: string;
}) {
  const Icon = icons[name];
  return <Icon size={size} variant="branded" className={className} />;
}
```

- [ ] **Step 4: Verify icon types**

Run:

```powershell
npx tsc --noEmit
```

Expected: PASS with no missing exports.

### Task 2: Shared landing-page structure

**Files:**
- Create: `src/components/marketing/ProductSection.tsx`
- Modify: `src/components/marketing/PripleCard.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: `ProductSection`, `SceneCard`, `SceneHeader`, and existing `DotStage`/`MockSurface` styling.
- Consumes: section IDs and copy from each scene.

- [ ] **Step 1: Add `ProductSection`**

Implement a section shell accepting:

```tsx
type ProductSectionProps = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  align?: "left" | "center";
  className?: string;
};
```

It must render `scroll-mt-24`, a responsive heading block, and children without adding a second visible outer border.

- [ ] **Step 2: Normalize card styles**

Use one visible border per major card, `min-height` appropriate to large editorial scenes, `overflow: clip`, and a dot/glow pseudo-element with no border.

- [ ] **Step 3: Add responsive scene utilities**

Add CSS for:

```css
.scene-grid { display: grid; gap: 1rem; }
.scene-card { min-height: 32rem; }
.scene-muted-grid { background-image: linear-gradient(...), linear-gradient(...); }
@media (min-width: 1024px) {
  .scene-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
```

Also preserve reduced-motion behavior.

### Task 3: Six focused product scenes

**Files:**
- Create: `src/components/marketing/scenes/SmartMoneyScene.tsx`
- Create: `src/components/marketing/scenes/AlertsScene.tsx`
- Create: `src/components/marketing/scenes/OpportunityScene.tsx`
- Create: `src/components/marketing/scenes/FlowsScene.tsx`
- Create: `src/components/marketing/scenes/NarrativeScene.tsx`
- Create: `src/components/marketing/scenes/CoinIntelligenceScene.tsx`
- Delete: `src/components/marketing/FeatureShowcases.tsx`
- Delete: `src/components/marketing/TrackTradersSection.tsx`

**Interfaces:**
- Each file default-exports or named-exports one scene component with no props.
- Scenes consume `CryptoIcon`, `ProductSection`, `PripleCard`, `MockSurface`, and Lucide action icons.

- [ ] **Step 1: Smart Money scene**

Build a large entity watchlist with branded chain/token icons, follow states, 30-day realized P&L context, and recent BUY/SELL badges. Copy must explain favorite wallets, any address, and curated Smart Money cohorts.

- [ ] **Step 2: Alerts scene**

Build a rule-builder with visible conditions:

```text
WHEN [Smart Money cohort]
BUYS or SELLS [>$50k]
AND Opportunity Score [>=80]
AND Social momentum [>+40%]
DELIVER TO [App] [Telegram] [Email]
```

Include a realistic resulting notification preview.

- [ ] **Step 3: Opportunity Score scene**

Render score `86` with four transparent dimensions: On-chain `92`, Social `78`, Market `84`, Risk `73`. Add short evidence rows and “Mock analysis” labeling.

- [ ] **Step 4: Correlation and cross-chain scene**

Create a coded SVG relationship graph connecting three wallets to LINK, plus a chain path from Ethereum → Base → Arbitrum. Use authentic network/token icons adjacent to graph nodes.

- [ ] **Step 5: AI narrative scene**

Build a daily wallet briefing with factual support: net flow, protocols used, profitable trades, overlap wallets, and a concise narrative. Mark it as “AI summary · mock data”.

- [ ] **Step 6: Social/news coin intelligence scene**

Create an inline SVG price chart with buy/sell markers, social spike markers, and one news event. Include token facts for liquidity, holder concentration, Smart Money netflow, and risk.

- [ ] **Step 7: Verify scenes independently**

Run:

```powershell
npx tsc --noEmit
```

Expected: PASS.

### Task 4: Reframe hero, navigation, FAQ, and page composition

**Files:**
- Modify: `src/components/marketing/Hero.tsx`
- Modify: `src/components/marketing/HeroDashboardMock.tsx`
- Modify: `src/components/marketing/SiteNav.tsx`
- Modify: `src/components/marketing/SiteFooter.tsx`
- Modify: `src/components/marketing/Faq.tsx`
- Modify: `src/components/marketing/Audience.tsx`
- Modify: `src/app/(marketing)/page.tsx`
- Modify: `src/app/layout.tsx`
- Delete: `src/app/(marketing)/track/page.tsx`

**Interfaces:**
- Homepage sections use IDs: `overview`, `smart-money`, `alerts`, `opportunity`, `flows`, `intelligence`, `faq`.
- Nav links point only to those IDs plus account actions.

- [ ] **Step 1: Rewrite hero**

Use:

```text
Track smart money. Connect the signals.

Follow wallets and entities, catch buy/sell and cross-chain activity, and understand every move through transparent scoring, AI narratives, and market/news context.
```

CTA labels: `Explore the product` (scrolls to Smart Money) and `Open app shell`.

- [ ] **Step 2: Update hero terminal**

Use authentic token/network icons and show a balanced overview: tracked entities, active alerts, correlation cluster, Opportunity Score, and news event. Label all values as mock.

- [ ] **Step 3: Replace navigation**

Desktop and mobile labels:

```text
Smart Money · Alerts · Score · Flows · Intelligence · FAQ
```

Each link scrolls to a real landing-page section.

- [ ] **Step 4: Compose one page**

Render in order:

```tsx
<Hero />
<SmartMoneyScene />
<AlertsScene />
<OpportunityScene />
<FlowsScene />
<NarrativeScene />
<CoinIntelligenceScene />
<Audience />
<FaqTeaser />
```

- [ ] **Step 5: Rewrite FAQ and footer**

Cover all six pillars, mock/live-data boundaries, optional wallet connection, data interpretation, alert delivery, and not-investment-advice language.

- [ ] **Step 6: Remove one-feature route**

Delete `/track` after its useful copy and visuals exist in the landing page. Ensure no remaining `/track` links.

### Task 5: Visual and production verification

**Files:**
- Modify only files with issues discovered during verification.

**Interfaces:**
- Consumes the complete landing page.
- Produces a clean build and handoff commands.

- [ ] **Step 1: Search for stale positioning**

Run:

```powershell
rg -n 'track page|/track|copy trad|Pricing|pricing|live data' src
```

Expected: no stale route or unsupported claim.

- [ ] **Step 2: Run lint**

Run:

```powershell
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```powershell
npm run build
```

Expected: all routes prerender and build exits `0`.

- [ ] **Step 4: Inspect IDE diagnostics**

Check changed files and fix introduced warnings/errors.

- [ ] **Step 5: Provide split commit commands**

Give the user separate commands for:

1. Web3 icon system.
2. Shared landing structure.
3. Six product scenes.
4. Homepage copy/navigation integration.
5. Cleanup and documentation.

