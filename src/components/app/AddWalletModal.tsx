"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useDesk } from "@/lib/app-store";

import { DESK_CHAINS } from "@/lib/alchemy-networks";

const chains = [...DESK_CHAINS];

export function AddWalletModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addWallet } = useDesk();
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-[22px] border border-white/10 bg-[#0c0c0e] p-5">
        <h2 className="font-sans text-xl font-semibold text-white">Add wallet</h2>
        <p className="mt-1 font-mono text-[12px] text-zinc-500">
          ETH, Base, Arb, OP, Polygon, BNB, Avalanche, or Solana — live dossier + chart marks when Alchemy covers that network.
        </p>

        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const label = (form.elements.namedItem("label") as HTMLInputElement).value.trim();
            const address = (form.elements.namedItem("address") as HTMLInputElement).value.trim();
            const chain = (form.elements.namedItem("chain") as HTMLSelectElement).value;

            if (address.length < 8) {
              setError("Enter a wallet address.");
              return;
            }

            void (async () => {
              try {
                setError(null);
                await addWallet({ label, address, chain });
                onClose();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to add wallet");
              }
            })();
          }}
        >
          {error ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 font-mono text-[11px] text-red-300">
              {error}
            </p>
          ) : null}

          <label className="block">
            <span className="font-mono text-[11px] text-zinc-400">Label</span>
            <input
              name="label"
              placeholder="Wintermute desk"
              className="auth-input mt-1.5"
            />
          </label>

          <label className="block">
            <span className="font-mono text-[11px] text-zinc-400">Address</span>
            <input
              name="address"
              required
              placeholder="0x…"
              className="auth-input mt-1.5"
            />
          </label>

          <label className="block">
            <span className="font-mono text-[11px] text-zinc-400">Chain</span>
            <select
              name="chain"
              className="auth-input mt-1.5 appearance-none"
              defaultValue="ETH"
            >
              {chains.map((chain) => (
                <option key={chain} value={chain} className="bg-[#0c0c0e]">
                  {chain}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Track wallet
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
