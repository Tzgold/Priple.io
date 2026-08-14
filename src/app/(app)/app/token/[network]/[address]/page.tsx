"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TokenDeskView } from "@/components/app/TokenDeskView";

export default function TokenDeskPage() {
  const params = useParams<{ network: string; address: string }>();
  const network = decodeURIComponent(params.network || "");
  const address = decodeURIComponent(params.address || "");

  return (
    <div className="space-y-4">
      <Link
        href={`/app/screener?network=${encodeURIComponent(network)}&address=${encodeURIComponent(address)}`}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 px-3 font-mono text-[11px] text-zinc-400 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Screener
      </Link>
      <TokenDeskView network={network} address={address} />
    </div>
  );
}
