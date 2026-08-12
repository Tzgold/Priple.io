import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Priple builds crypto trading intelligence — wallet tracking, market data, and social signals in one decision surface.",
};

const principles = [
  {
    title: "Evidence over noise",
    body: "We surface labeled wallet moves, market structure, and social heat together — so decisions aren’t made from a single incomplete feed.",
  },
  {
    title: "Transparent composites",
    body: "Opportunity Score is a readable blend of on-chain, social, and market inputs. Scores guide attention; they don’t pretend to predict the future.",
  },
  {
    title: "Research, not advice",
    body: "Priple is an analytics product. We do not issue buy/sell recommendations. Every surface carries that boundary by design.",
  },
  {
    title: "Privacy-aware labeling",
    body: "Blockchain data is public; identity linking is sensitive. We prioritize entity labels useful for research and avoid publishing personal identifiers.",
  },
];

const stack = [
  {
    title: "On-chain",
    body: "Wallet activity, transfers, and cross-chain flows from indexed chain data.",
  },
  {
    title: "Markets",
    body: "DEX/CEX price, volume, and liquidity context beside the wallet story.",
  },
  {
    title: "Social & news",
    body: "Sentiment and narrative spikes when they correlate with on-chain movement.",
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
          One intelligence layer for wallets, markets, and narrative heat.
        </h1>
        <p className="mt-5 text-[15px] leading-7 text-zinc-400 sm:text-base">
          Traders today bounce between explorers, DEX charts, whale trackers, and
          social feeds. Priple exists to collapse that stack into a single
          professional surface — so you can see who moved, what moved with them,
          and whether the market and narrative agree.
        </p>
        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <Button href="/signup" size="lg">
            Get started
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button href="/#features" variant="secondary" size="lg">
            View product
          </Button>
        </div>
      </section>

      <section className="mt-14 grid gap-3 sm:mt-20 sm:grid-cols-3">
        {stack.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-white/[0.08] bg-[#141416] p-5"
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
            labeling, custom SQL analytics, DEX discovery, social scores. None of
            them cleanly fuse multi-chain on-chain activity, live market context,
            and social/news signals into one decision UI.
          </p>
          <p>
            Priple&apos;s product bet is that edge comes from correlation: when
            smart money, liquidity, and narrative line up — or when they
            diverge. That&apos;s the gap we&apos;re closing, starting with
            Opportunity Score, wallet tracking, and composable alerts.
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
              className="rounded-2xl border border-white/[0.08] bg-[#141416] p-5"
            >
              <h3 className="text-sm font-medium text-white">{item.title}</h3>
              <p className="mt-2 text-[13px] leading-6 text-zinc-500">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="contact"
        className="mt-14 scroll-mt-24 rounded-[22px] border border-white/[0.08] bg-[#141416] p-6 sm:mt-20 sm:rounded-[28px] sm:p-8"
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
        <p className="mt-6 text-xs leading-5 text-zinc-600">
          Prefer email later? We&apos;ll publish a dedicated address when support
          volume justifies it. Until then, GitHub is the source of truth.
        </p>
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
