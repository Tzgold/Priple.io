"use client";

import { useRouter } from "next/navigation";
import { PairSearchBox, type PairHit } from "@/components/app/PairSearchBox";

export function CommandSearch() {
  const router = useRouter();

  function openPair(hit: PairHit) {
    router.push(
      `/app/screener?network=${encodeURIComponent(hit.network)}&address=${encodeURIComponent(hit.address)}`,
    );
  }

  return (
    <div className="hidden sm:block sm:w-[280px]">
      <PairSearchBox
        onSelect={openPair}
        placeholder="Search any pair…"
        className="[&_div]:h-10 [&_input]:text-[11px]"
      />
    </div>
  );
}
