import { buildPulseForWallets, type PulseItem } from "@/lib/alchemy-pulse";
import { buildCoinAnalysis, withTrackedFlowMoves } from "@/lib/coin-analysis";
import { getWallet, listWallets, type WalletRow } from "@/lib/desk-db";
import { buildFlowsFromPulse } from "@/lib/flows";
import {
  buildCoinPacketFromAnalysis,
  buildWalletPacketFromDossier,
  type CoinNarrativePacket,
  type WalletNarrativePacket,
} from "@/lib/narrative-packet";
import { resolvePulseBuy } from "@/lib/screener-lists";
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

function coinSubjectKey(network: string, address: string) {
  return `${network}:${address.toLowerCase()}`;
}

function matchesCoin(network: string, address: string, symbol: string, item: PulseItem) {
  if (item.source !== "personal") return false;
  const route = resolvePulseBuy(item);
  if (route) {
    return coinSubjectKey(route.network, route.address) === coinSubjectKey(network, address);
  }
  return item.asset.toUpperCase() === symbol.toUpperCase();
}

export async function loadWalletNarrativePacket(
  userId: string,
  walletId: string,
): Promise<WalletNarrativePacket | null> {
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

export async function loadCoinNarrativePacket(
  userId: string,
  network: string,
  address: string,
  whyHere?: string | null,
  trackedWalletBuys?: number,
): Promise<CoinNarrativePacket | null> {
  let analysis = await buildCoinAnalysis({
    network,
    address,
    whyHere,
    trackedWalletBuys,
  });
  if (!analysis) return null;

  const wallets = await listWallets(userId);
  let trackedMoves: PulseItem[] = [];
  let clusters: ReturnType<typeof buildFlowsFromPulse>["clusters"] = [];

  if (wallets.length > 0) {
    const pulse = await buildPulseForWallets(
      wallets.map((wallet) => ({
        label: wallet.label,
        address: wallet.address,
        chain: wallet.chain,
      })),
      "personal",
    );
    trackedMoves = pulse.filter((item) => matchesCoin(network, address, analysis!.symbol, item));
    clusters = buildFlowsFromPulse(pulse.filter((item) => item.source === "personal")).clusters;
    analysis = withTrackedFlowMoves(analysis, trackedMoves);
  }

  return buildCoinPacketFromAnalysis({
    analysis,
    trackedMoves,
    clusters,
  });
}

export { coinSubjectKey };
