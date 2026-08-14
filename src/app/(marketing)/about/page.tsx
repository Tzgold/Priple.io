import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CardBorder } from "@/components/marketing/PripleCard";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Priple is a crypto research terminal for Smart Money tracking, alerts, scoring, flows, narratives, and coin intelligence.",
};

const stack = [
  { title: "Smart Money", body: "Any address. Favorite desks. Curated cohorts." },
  { title: "Alerts", body: "Who, action, size, score, social — then deliver." },
  { title: "Opportunity Score", body: "On-chain, social, market, risk. Readable." },
  { title: "Flows", body: "Wallets moving together, kept across chains." },
  { title: "Narratives", body: "A briefing with a checkable evidence trail." },
  { title: "Intelligence", body: "Price, news, liquidity, and Smart Money on one tape." },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 sm:pb-28 sm:pt-14">
      <section className="max-w-2xl">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
          About
        </p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-[2.75rem] md:leading-[1.1]">
          Track smart money. Connect the signals.
        </h1>
        <p className="mt-5 font-mono text-[13px] leading-6 text-zinc-400">
          One research terminal for wallets, alerts, scores, and news. Not investment advice.
        </p>
        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <Button href="/signup" size="lg">
            Get started
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button href="/#smart-money" variant="secondary" size="lg">
            See the product
          </Button>
        </div>
      </section>

      <section className="mt-14 grid gap-3 sm:mt-20 sm:grid-cols-2 lg:grid-cols-3">
        {stack.map((item, index) => (
          <article
            key={item.title}
            className="priple-dash-card"
            data-petal={(["tl-br", "tr-bl", "bl-tr", "br-tl", "tl-br", "tr-bl"] as const)[index]}
          >
            <CardBorder />
            <div className="priple-card-fill">
              <h2 className="font-sans text-sm font-medium text-white">{item.title}</h2>
              <p className="mt-3 font-mono text-[12px] leading-6 text-zinc-500">{item.body}</p>
            </div>
          </article>
        ))}
      </section>

      <section
        id="contact"
        data-petal="tl-br"
        className="priple-dash-card relative mt-14 scroll-mt-24 sm:mt-20"
      >
        <CardBorder />
        <div className="priple-card-fill">
          <h2 className="text-xl font-semibold tracking-tight text-white">Contact</h2>
          <p className="mt-3 max-w-xl font-mono text-[13px] leading-6 text-zinc-400">
            Product, access, or partnerships — GitHub issues, or create an account.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Button
              href="https://github.com/Tzgold/Priple.io"
              variant="secondary"
              className="rounded-xl"
            >
              Open GitHub
            </Button>
            <Button href="/signup" className="rounded-xl">
              Create account
            </Button>
          </div>
        </div>
      </section>

      <p className="mt-10 font-mono text-[12px] text-zinc-600">
        Questions?{" "}
        <Link href="/faq" className="text-zinc-300 underline-offset-4 hover:underline">
          FAQ
        </Link>
      </p>
    </main>
  );
}
