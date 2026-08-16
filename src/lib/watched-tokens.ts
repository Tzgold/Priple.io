/** Token watchlist (coins the user pins) — local for now, synced per browser. */

export type WatchedToken = {
  id: string;
  network: string;
  address: string;
  symbol: string;
  name: string;
  imageUrl: string | null;
  addedAt: number;
};

export function watchedTokenId(network: string, address: string) {
  return `${network}:${address.toLowerCase()}`;
}
