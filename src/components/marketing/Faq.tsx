export const faqItems = [
  {
    q: "What does Priple actually do?",
    a: "Six connected research surfaces: Smart Money wallet tracking, buy/sell and custom alerts, Opportunity Score, wallet correlation and cross-chain tracing, AI wallet narratives, and social/news overlays on coin analysis.",
  },
  {
    q: "Can I track any wallet, or only famous traders?",
    a: "Any address. Save favorites, follow labeled desks, or monitor curated Smart Money cohorts. The same watchlist powers alerts, correlation, narratives, and coin analysis.",
  },
  {
    q: "How do custom alerts work?",
    a: "Combine who moved, buy or sell, size, Opportunity Score, and social momentum. Deliver in-app, Telegram, or email. Alerts point you to analysis — they are not trade calls.",
  },
  {
    q: "What is Opportunity Score?",
    a: "A readable composite of on-chain flows, social momentum, market structure, and risk. Higher means more converging evidence, not a predicted price.",
  },
  {
    q: "What is wallet correlation and cross-chain tracing?",
    a: "Priple flags when followed wallets start trading the same asset, then keeps the story intact if funds hop Ethereum → Base, Arbitrum, BNB Chain, or Solana.",
  },
  {
    q: "Are AI narratives just summaries?",
    a: "They are briefings with supporting facts: net flow, protocols, overlap wallets, and a timestamped evidence trail. Every sentence is meant to be checkable.",
  },
  {
    q: "Is this investment advice?",
    a: "No. Priple is research software. Scores, alerts, and narratives highlight where evidence is clustering. They do not tell you to buy or sell.",
  },
  {
    q: "Is the marketing data live?",
    a: "Landing-page scenes and the app shell use realistic mock data so you can evaluate the product surface. Live ingestion is the next engineering phase.",
  },
];

export function FaqList() {
  return (
    <div className="border-t border-white/[0.08]">
      {faqItems.map((item) => (
        <div
          key={item.q}
          className="border-b border-white/[0.08] py-8 last:border-b sm:py-10"
        >
          <h2 className="text-[1.15rem] font-semibold tracking-tight text-white sm:text-xl">
            {item.q}
          </h2>
          <p className="mt-3 max-w-2xl font-mono text-[13px] leading-6 text-zinc-400">{item.a}</p>
        </div>
      ))}
    </div>
  );
}

export function FaqTeaser() {
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 pb-20 pt-8 sm:px-6 sm:pb-28">
      <header className="pb-8 sm:pb-10">
        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Before you ask
        </h2>
        <p className="mt-3 max-w-xl font-mono text-[13px] leading-6 text-zinc-400">
          Straight answers. What this is — and is not.
        </p>
      </header>
      <div className="border-t border-white/[0.08]">
        {faqItems.slice(0, 4).map((item) => (
          <div key={item.q} className="border-b border-white/[0.08] py-8 sm:py-10">
            <h3 className="text-[1.15rem] font-semibold tracking-tight text-white sm:text-xl">
              {item.q}
            </h3>
            <p className="mt-3 max-w-2xl font-mono text-[13px] leading-6 text-zinc-400">{item.a}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-zinc-500">
        More on the{" "}
        <a href="/faq" className="text-zinc-300 underline-offset-4 hover:underline">
          full FAQ
        </a>
        .
      </p>
    </section>
  );
}
