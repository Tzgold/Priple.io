import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { HeroDashboardMock } from "@/components/marketing/HeroDashboardMock";

const quickLinks = [
  { href: "#features", label: "See Opportunity Score" },
  { href: "#wallets", label: "Wallet tracking" },
  { href: "#screener", label: "Token screener" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About Priple" },
];

export function Hero() {
  return (
    <>
      <section className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-4 pb-10 pt-14 text-center sm:px-6 sm:pb-12 sm:pt-24 md:pt-28">
        <div className="animate-fade-up">
          <Badge className="max-w-full px-2.5 sm:px-3">
            <span className="text-zinc-400">Introducing</span>
            <a
              href="#features"
              className="truncate text-white transition-colors hover:text-zinc-200"
            >
              Opportunity Score →
            </a>
          </Badge>
        </div>

        <p className="animate-fade-up delay-1 mt-7 text-xs font-medium tracking-[0.2em] text-zinc-500 uppercase sm:mt-8 sm:text-sm">
          Priple
        </p>

        <h1 className="animate-fade-up delay-2 mt-3 text-balance text-[2rem] font-semibold leading-[1.12] tracking-tight text-white sm:mt-4 sm:text-5xl sm:leading-[1.08] md:text-[3.5rem]">
          You want the signal,
          <br className="hidden sm:block" /> not the ordeal.
        </h1>

        <p className="animate-fade-up delay-3 mt-5 max-w-xl text-pretty px-1 text-[14px] leading-7 text-zinc-400 sm:mt-6 sm:text-[15px] sm:text-base">
          Wallet intelligence, market screener, and social heat — fused into one
          decision surface for crypto traders who move on evidence, not noise.
        </p>

        <div className="animate-fade-up delay-4 mt-8 flex w-full max-w-md flex-col items-stretch gap-2.5 sm:mt-9 sm:max-w-none sm:flex-row sm:items-center sm:justify-center sm:gap-3">
          <Button href="/signup" size="lg" className="w-full sm:w-auto">
            Start free
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button href="/app" variant="secondary" size="lg" className="w-full sm:w-auto">
            View live shell
          </Button>
        </div>

        <div className="animate-fade-in delay-4 mt-7 flex max-w-xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px] text-zinc-500 sm:mt-8 sm:gap-x-5 sm:text-[13px]">
          {quickLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-zinc-300"
            >
              {link.label}
            </a>
          ))}
        </div>
      </section>

      <HeroDashboardMock />
    </>
  );
}
