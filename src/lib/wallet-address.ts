import { isSolanaChain, normalizeDeskChain, type DeskChain } from "@/lib/alchemy-networks";

/** Basic EVM address check (0x + 40 hex). */
export function isValidEvmAddress(address: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

/** Solana addresses are base58, typically 32–44 chars. */
export function isValidSolanaAddress(address: string) {
  const value = address.trim();
  if (value.length < 32 || value.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(value);
}

export function validateWalletAddress(chain: string, address: string): string | null {
  const normalized = normalizeDeskChain(chain);
  if (!normalized) return "Unsupported chain";
  const value = address.trim();
  if (!value) return "Address is required";

  if (isSolanaChain(normalized)) {
    if (!isValidSolanaAddress(value)) {
      return "Enter a valid Solana address (base58, 32–44 characters)";
    }
    return null;
  }

  if (!isValidEvmAddress(value)) {
    return "Enter a valid EVM address (0x + 40 hex characters)";
  }
  return null;
}

export function addressPlaceholderFor(chain: DeskChain | string) {
  const normalized = normalizeDeskChain(chain);
  if (normalized === "SOL") return "So1… or wallet pubkey";
  return "0x…";
}
