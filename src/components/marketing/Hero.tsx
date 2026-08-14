import { HeroField } from "@/components/marketing/HeroField";
import { HeroGlass } from "@/components/marketing/HeroGlass";
import { HudButton } from "@/components/marketing/HudButton";

export function Hero() {
  return (
    <section
      id="overview"
      className="hero-cinematic relative isolate -mt-[4.25rem] min-h-[100svh] scroll-mt-0 overflow-hidden"
    >
      <HeroField />
      <HeroGlass />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[92rem] flex-col justify-end px-8 pb-12 pt-28 sm:px-14 sm:pb-16 md:px-20 md:pb-20">
        <div className="max-w-xl">
          <p className="animate-fade-up font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
            Priple research terminal
          </p>
          <h1 className="animate-fade-up delay-1 mt-4 font-sans text-[2.4rem] font-semibold tracking-[-0.04em] text-white sm:text-5xl md:text-[3.7rem] md:leading-[1.02]">
            Track smart money.
            <br />
            Connect the signals.
          </h1>
          <p className="animate-fade-up delay-2 mt-5 max-w-md font-mono text-[12px] leading-6 text-zinc-300 sm:text-[13px]">
            Wallets, alerts, scores, and news — one research surface.
          </p>
          <div className="animate-fade-up delay-3 mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-6">
            <HudButton href="#smart-money">Explore the product</HudButton>
            <a
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 font-mono text-[12px] text-white transition-colors hover:text-zinc-300"
            >
              Open app shell
              <span aria-hidden className="text-zinc-400">
                ›
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
