import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative mx-auto flex max-w-3xl flex-col items-center px-6 pb-20 pt-20 text-center sm:pt-28">
      <div className="animate-fade-up">
        <Badge>
          Introducing
          <a href="#features" className="text-white transition-colors hover:text-zinc-200">
            Opportunity Score →
          </a>
        </Badge>
      </div>

      <p className="animate-fade-up delay-1 mt-8 text-sm font-medium tracking-[0.18em] text-zinc-500 uppercase">
        Priple
      </p>

      <h1 className="animate-fade-up delay-2 mt-4 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl sm:leading-[1.08] md:text-[3.5rem]">
        You want the signal,
        <br className="hidden sm:block" /> not the ordeal.
      </h1>

      <p className="animate-fade-up delay-3 mt-6 max-w-xl text-pretty text-[15px] leading-7 text-zinc-400 sm:text-base">
        Wallet intelligence, market screener, and social heat — fused into one
        decision surface for crypto traders who move on evidence, not noise.
      </p>

      <div className="animate-fade-up delay-4 mt-9 flex flex-col items-center gap-3 sm:flex-row">
        <Button href="/signup" size="lg">
          Enter Priple
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button href="#features" variant="ghost" size="lg" className="text-zinc-300">
          See what ships
        </Button>
      </div>
    </section>
  );
}
