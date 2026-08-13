import Image from "next/image";
import { HeroGrid } from "@/components/marketing/CrossFrame";
import { HudButton } from "@/components/marketing/HudButton";

export function Hero() {
  return (
    <section
      id="overview"
      className="hero-cinematic relative isolate -mt-[4.25rem] min-h-[100svh] scroll-mt-0 overflow-hidden"
    >
      <Image
        src="/priple-hero-atmosphere.png"
        alt=""
        fill
        preload
        sizes="100vw"
        className="object-cover object-[center_38%]"
      />
      <div className="hero-vignette" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[92rem] flex-col justify-end px-5 pb-10 pt-24 sm:px-10 sm:pb-14 md:px-16 md:pb-16">
        <div className="hero-frame relative px-6 py-8 sm:px-10 sm:py-10 md:px-14 md:py-12">
          <HeroGrid />

          <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)] lg:gap-24">
            <h1 className="animate-fade-up max-w-3xl text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl md:text-[3.6rem] md:leading-[1.04]">
              Track smart money.
              <br />
              Connect the signals.
            </h1>

            <div className="animate-fade-up delay-2 max-w-lg lg:justify-self-end">
              <p className="text-[15px] leading-7 text-zinc-200 sm:text-base">
                Follow wallets and entities, catch buy/sell and cross-chain
                activity, and understand every move through transparent
                scoring, AI narratives, and market, social, and news context.
              </p>
              <div className="mt-6 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-6">
                <HudButton href="#smart-money">Explore the product</HudButton>
                <a
                  href="/app"
                  className="inline-flex items-center justify-center gap-1.5 text-[13px] font-medium text-white transition-colors hover:text-zinc-300"
                >
                  Open app shell
                  <span aria-hidden className="text-zinc-400">
                    ›
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
