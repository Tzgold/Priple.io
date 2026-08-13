import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Priple is a crypto research terminal for Smart Money tracking, custom alerts, Opportunity Score, cross-chain flows, AI narratives, and coin intelligence.",
};

const principles = [
  {
    title: "Evidence over noise",
    body: "Wallet moves, market structure, social momentum, and news sit on one surface so decisions are not made from a single incomplete feed.",
  },
  {
    title: "Transparent composites",
    body: "Opportunity Score is a readable blend of on-chain, social, market, and risk inputs. Scores guide attention; they do not predict the future.",
  },
  {
    title: "Research, not advice",
    body: "Priple is an analytics product. We do not issue buy or sell recommendations. Every surface carries that boundary by design.",
  },
  {
    title: "Privacy-aware labeling",
    body: "Blockchain data is public; identity linking is sensitive. We prioritize entity labels useful for research and avoid publishing personal identifiers.",
  },
];

const stack = [
  {
    title: "Smart Money tracking",
    body: "Follow any address, favorite traders, or curated cohorts with performance and recent buy/sell context.",
  },
  {
    title: "Custom alerts",
    body: "Compose who, action, size, score, and social momentum — then deliver in-app, Telegram, or email.",
  },
  {
    title: "Opportunity Score",
    body: "A transparent composite of on-chain flows, social heat, market structure, and risk.",
  },
  {
    title: "Correlation & flows",
    body: "See when wallets move together and keep the story intact across Ethereum, Base, Arbitrum, BNB, and Solana.",
  },
  {
    title: "AI narratives",
    body: "Plain-language wallet briefs with a checkable evidence trail.",
  },
  {
    title: "Coin intelligence",
    body: "Overlay wallet activity on price, social spikes, news events, liquidity, and concentration.",
  },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 sm:pb-28 sm:pt-14">
      <section className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
          About Priple
        </p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-[2.75rem] md:leading-[1.1]">
          Track smart money. Connect the signals.
        </h1>
        <p className="mt-5 text-[15px] leading-7 text-zinc-400 sm:text-base">
          Traders already bounce between explorers, DEX charts, whale trackers,
          and social feeds. Priple collapses that stack into one research
          terminal: follow wallets, catch activity, correlate it, and understand
          the coin with scoring, narratives, and news context. Research tooling
          — not a signal spam feed, and not investment advice.
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
        {stack.map((item) => (
          <article
            key={item.title}
            className="priple-dash-card"
          >
            <h2 className="text-sm font-medium text-white">{item.title}</h2>
            <p className="mt-2 text-[13px] leading-6 text-zinc-500">{item.body}</p>
          </article>
        ))}
      </section>

      <section className="mt-14 sm:mt-20">
        <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
          Why we&apos;re building this
        </h2>
        <div className="mt-4 space-y-4 text-[15px] leading-7 text-zinc-400">
          <p>
            Best-in-class tools already own pieces of the puzzle — wallet
            labeling, DEX discovery, social scores. None of them cleanly fuse
            multi-chain activity, live market context, and social/news signals
            into one decision UI.
          </p>
          <p>
            Priple&apos;s bet is that edge comes from correlation: when smart
            money, liquidity, and narrative line up — or when they diverge.
            That is the gap we are closing, starting with the six product
            pillars on the landing page.
          </p>
        </div>
      </section>

      <section className="mt-14 sm:mt-20">
        <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
          Operating principles
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {principles.map((item) => (
            <article
              key={item.title}
              className="priple-dash-card"
            >
              <h3 className="text-sm font-medium text-white">{item.title}</h3>
              <p className="mt-2 text-[13px] leading-6 text-zinc-500">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="contact"
        className="mt-14 scroll-mt-24 rounded-[18px] border border-white/[0.12] bg-[#141416] p-6 sm:mt-20 sm:p-8"
      >
        <h2 className="text-xl font-semibold tracking-tight text-white">Contact</h2>
        <p className="mt-3 max-w-xl text-[15px] leading-7 text-zinc-400">
          For product feedback, enterprise access, or partnership questions,
          reach out via GitHub issues on the public repo — or create an account
          and we&apos;ll route desk inquiries from there as the product opens.
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
      </section>

      <p className="mt-10 text-sm text-zinc-600">
        Questions first?{" "}
        <Link href="/faq" className="text-zinc-300 underline-offset-4 hover:underline">
          Read the FAQ
        </Link>
        .
      </p>
    </main>
  );
}
