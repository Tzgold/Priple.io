const audiences = [
  {
    title: "Solo traders",
    body: "Replace tab-hopping across DexScreener, explorers, and Twitter with one evidence surface before you size a position.",
  },
  {
    title: "Desks & funds",
    body: "Track labeled entities, correlation moves, and cross-chain flows without stitching three vendors into a spreadsheet.",
  },
  {
    title: "Researchers",
    body: "Start from Opportunity Score and wallet narratives, then drill into the underlying flows — built for analysis, not hype.",
  },
];

export function Audience() {
  return (
    <section className="mx-auto max-w-5xl px-3 pb-16 sm:px-6 sm:pb-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">
          Built for people who trade on evidence
        </h2>
        <p className="mt-3 text-[14px] leading-7 text-zinc-400 sm:mt-4 sm:text-[15px]">
          Priple is a crypto intelligence layer — wallets, markets, and social heat
          in one place. Informational only. Not investment advice.
        </p>
      </div>

      <div className="mt-8 grid gap-2.5 sm:mt-12 sm:grid-cols-3 sm:gap-3">
        {audiences.map((item) => (
          <article
            key={item.title}
            className="priple-feature-card transition-colors hover:border-white/20"
          >
            <h3 className="text-sm font-medium text-white">{item.title}</h3>
            <p className="mt-2 text-[13px] leading-6 text-zinc-500">{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
