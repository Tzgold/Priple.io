export const faqItems = [
  {
    q: "Is Priple investment advice?",
    a: "No. Priple is research software. Scores, alerts, and wallet narratives highlight where evidence is clustering — they are not buy or sell recommendations.",
  },
  {
    q: "What does Opportunity Score mean?",
    a: "A readable composite of on-chain flows, social heat, and market structure for a token or wallet cluster. Higher means more converging signals, not a predicted price.",
  },
  {
    q: "Do I need to connect a wallet?",
    a: "No. You can track labeled entities and screen tokens without connecting. Optional connect later is for portfolio context, not required for core research.",
  },
  {
    q: "How is this different from an explorer or DEX chart?",
    a: "Explorers show raw txs. Charts show price. Priple fuses labeled wallet moves, market context, and narrative spikes so correlations show up in one place.",
  },
  {
    q: "Can I build my own alerts?",
    a: "Yes. Rules can combine wallet size, Opportunity Score, and sentiment — not just candle pings. Full live wiring lands with the data layer.",
  },
  {
    q: "Which chains are supported?",
    a: "The product is multi-chain by design, starting with major EVM networks and expanding. The UI already speaks chain-aware wallets and bridge hops.",
  },
  {
    q: "Is the marketing data live?",
    a: "Mocks and the app shell use realistic sample data so you can evaluate the surface. Live ingestion is the next engineering phase.",
  },
  {
    q: "Who is Priple for?",
    a: "Solo traders, research desks, and anyone tired of stitching explorers, DEX screens, and social feeds to make one decision.",
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
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-zinc-400">{item.a}</p>
        </div>
      ))}
    </div>
  );
}

/** Compact “Before you ask” block for the bottom of the homepage. */
export function FaqTeaser() {
  return (
    <section className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6 sm:pb-28">
      <header className="pb-8 sm:pb-10">
        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Before you ask
        </h2>
        <p className="mt-3 max-w-xl text-[15px] leading-7 text-zinc-400">
          The things people want to know before they treat Priple like another
          signal spam feed.
        </p>
      </header>
      <div className="border-t border-white/[0.08]">
        {faqItems.slice(0, 4).map((item) => (
          <div key={item.q} className="border-b border-white/[0.08] py-8 sm:py-10">
            <h3 className="text-[1.15rem] font-semibold tracking-tight text-white sm:text-xl">
              {item.q}
            </h3>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-zinc-400">{item.a}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-zinc-500">
        More answers on the{" "}
        <a href="/faq" className="text-zinc-300 underline-offset-4 hover:underline">
          full FAQ
        </a>
        .
      </p>
    </section>
  );
}
