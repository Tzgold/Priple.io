/** Deterministic wallet profile image for chart markers + dossiers. */

export function walletAvatarUrl(address: string, label?: string | null): string {
  const seed = (address || label || "wallet").trim().toLowerCase() || "wallet";
  const params = new URLSearchParams({
    seed,
    backgroundColor: "0a0a0c",
    size: "64",
  });
  return `https://api.dicebear.com/9.x/shapes/svg?${params.toString()}`;
}
