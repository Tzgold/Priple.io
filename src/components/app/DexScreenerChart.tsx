"use client";

import { ExternalLink } from "lucide-react";
import { dexScreenerEmbedUrl, dexScreenerPairPageUrl } from "@/lib/dexscreener";
import { cn } from "@/lib/cn";

export function DexScreenerChart({
  network,
  pairOrTokenAddress,
  heightClass = "h-[380px] w-full sm:h-[460px]",
}: {
  network: string;
  pairOrTokenAddress: string;
  heightClass?: string;
}) {
  const embed = dexScreenerEmbedUrl(network, pairOrTokenAddress);
  const page = dexScreenerPairPageUrl(network, pairOrTokenAddress);

  if (!embed) {
    return (
      <p className="px-4 py-20 text-center font-mono text-[12px] text-zinc-600">
        DexScreener chart unavailable for this network.
      </p>
    );
  }

  return (
    <div className="relative">
      {page ? (
        <a
          href={page}
          target="_blank"
          rel="noreferrer"
          className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/70 px-2.5 py-1 font-mono text-[10px] text-zinc-300 backdrop-blur hover:border-white/20 hover:text-white"
        >
          Open DexScreener
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : null}
      <iframe
        title="DexScreener chart"
        src={embed}
        className={cn("w-full border-0 bg-[#050506]", heightClass)}
        allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
