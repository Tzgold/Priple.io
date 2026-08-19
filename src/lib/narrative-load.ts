import { buildPulseForWallets } from "@/lib/alchemy-pulse";
import { getWallet, type WalletRow } from "@/lib/desk-db";
import { buildFlowsFromPulse } from "@/lib/flows";
import { buildWalletPacketFromDossier, type NarrativePacket } from "@/lib/narrative-packet";
import { buildLiveWalletDossier, type WalletDossier } from "@/lib/wallet-dossier";

function emptyDossier(wallet: WalletRow): WalletDossier {
  const address = wallet.address;
  return {
    id: wallet.id,
    label: wallet.label,
    address,
    shortAddress:
      address.length > 10 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address,
    chain: wallet.chain,
    live: false,
    activity: [],
    holdings: [],
    buysCount: 0,
    sellsCount: 0,
    note: null,
  };
}

export async function loadWalletNarrativePacket(
  userId: string,
  walletId: string,
): Promise<NarrativePacket | null> {
  const owned = await getWallet(userId, walletId);
  if (!owned) return null;

  const live = await buildLiveWalletDossier({
    id: owned.id,
    label: owned.label,
    address: owned.address,
    chain: owned.chain,
  });
  const dossier = live ?? emptyDossier(owned);

  let clusters = [] as ReturnType<typeof buildFlowsFromPulse>["clusters"];
  if (dossier.live) {
    const pulse = await buildPulseForWallets(
      [{ label: owned.label, address: owned.address, chain: owned.chain }],
      "personal",
    );
    clusters = buildFlowsFromPulse(pulse).clusters;
  }

  return buildWalletPacketFromDossier({
    walletId: owned.id,
    dossier,
    clusters,
  });
}
