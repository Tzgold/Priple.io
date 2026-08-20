import type { CoinAnalysis } from "@/lib/coin-analysis";
import type { WalletNarrative } from "@/lib/wallet-narrative";

/** Deterministic coin briefing — LLM fallback and facts checksum. */
export function buildCoinNarrativeTemplate(
  analysis: CoinAnalysis,
  trackedWalletBuys = 0,
): WalletNarrative {
  const change = analysis.market.change24hLabel;
  const changeTone =
    change.startsWith("+") ? "up" : change.startsWith("-") ? "down" : ("neutral" as const);

  return {
    headline: analysis.headline,
    paragraphs: analysis.summary.slice(0, 4),
    highlight: analysis.whyHere
      ? { title: "Why it's here", body: analysis.whyHere.slice(0, 400) }
      : null,
    facts: [
      { label: "24H change", value: change, tone: changeTone },
      { label: "Liquidity", value: analysis.market.liquidityLabel },
      {
        label: "Risk",
        value: analysis.risk.level,
        tone:
          analysis.risk.level === "high"
            ? "down"
            : analysis.risk.level === "low"
              ? "up"
              : "neutral",
      },
      {
        label: "Tracked desks",
        value: trackedWalletBuys > 0 ? String(trackedWalletBuys) : "0",
        tone: trackedWalletBuys > 0 ? "up" : "neutral",
      },
    ],
    sources: analysis.sources,
    generatedAt: analysis.generatedAt,
  };
}
