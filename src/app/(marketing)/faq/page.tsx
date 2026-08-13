import type { Metadata } from "next";
import Link from "next/link";
import { FaqList } from "@/components/marketing/Faq";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Before you ask — answers about Priple’s six pillars, Opportunity Score, alerts, narratives, and what this product is not.",
};

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-14 sm:px-6 sm:pb-32 sm:pt-20">
      <header className="pb-10 sm:pb-12">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[2.5rem] sm:leading-tight">
          Before you ask
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-7 text-zinc-400 sm:text-base">
          The six Priple pillars, what the scores mean, and what this product
          is not — before you follow your first wallet.
        </p>
      </header>

      <FaqList />

      <p className="mt-12 text-sm text-zinc-500">
        Still stuck?{" "}
        <Link
          href="/about#contact"
          className="text-zinc-300 underline-offset-4 hover:underline"
        >
          Contact
        </Link>{" "}
        or{" "}
        <Link href="/signup" className="text-zinc-300 underline-offset-4 hover:underline">
          create an account
        </Link>
        .
      </p>
    </main>
  );
}
