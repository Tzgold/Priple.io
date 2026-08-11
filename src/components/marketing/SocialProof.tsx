import { testimonials } from "@/lib/mock/data";

export function SocialProof() {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Builders are shipping with Priple
        </h2>
        <p className="mt-4 text-[15px] leading-7 text-zinc-400">
          From solo traders to desks — one surface for wallets, markets, and
          narrative heat.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-zinc-500">
          <p>
            <span className="font-semibold text-white">12</span> signal types
          </p>
          <p>
            <span className="font-semibold text-white">MIT</span> spirit UI
          </p>
          <p>
            <span className="font-semibold text-white">Any</span> chain focus
          </p>
        </div>
      </div>

      <div className="mt-14 columns-1 gap-3 sm:columns-2 lg:columns-3">
        {testimonials.map((t) => (
          <article
            key={t.name}
            className="mb-3 break-inside-avoid rounded-2xl border border-white/[0.08] bg-[#141416] p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-zinc-500 to-zinc-800 text-xs font-semibold text-white">
                {t.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{t.name}</p>
                <p className="text-xs text-zinc-500">{t.role}</p>
              </div>
            </div>
            <p className="mt-4 text-[13px] leading-6 text-zinc-400">{t.quote}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
