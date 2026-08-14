import {
  ExchangeBinance,
  ExchangeCoinbase,
  NetworkArbitrumOne,
  NetworkBase,
  NetworkBinanceSmartChain,
  NetworkEthereum,
  NetworkPolygon,
  NetworkSolana,
  TokenADA,
  TokenARB,
  TokenBTC,
  TokenETH,
  TokenLINK,
  TokenMATIC,
  TokenOP,
  TokenSOL,
  TokenUSDC,
  TokenUSDT,
  TokenXRP,
  WalletMetamask,
  WalletPhantom,
  WalletWalletConnect,
} from "@web3icons/react";

export const cryptoIconNames = [
  "binance",
  "bitcoin",
  "coinbase",
  "ethereum",
  "base",
  "arbitrum",
  "bnb",
  "solana",
  "eth",
  "sol",
  "link",
  "usdt",
  "usdc",
  "matic",
  "polygon",
  "xrp",
  "ada",
  "arb",
  "op",
  "metamask",
  "phantom",
  "walletconnect",
] as const;

export type CryptoIconName = (typeof cryptoIconNames)[number];

const icons = {
  binance: ExchangeBinance,
  bitcoin: TokenBTC,
  coinbase: ExchangeCoinbase,
  ethereum: NetworkEthereum,
  base: NetworkBase,
  arbitrum: NetworkArbitrumOne,
  bnb: NetworkBinanceSmartChain,
  solana: NetworkSolana,
  eth: TokenETH,
  sol: TokenSOL,
  link: TokenLINK,
  usdt: TokenUSDT,
  usdc: TokenUSDC,
  matic: TokenMATIC,
  polygon: NetworkPolygon,
  xrp: TokenXRP,
  ada: TokenADA,
  arb: TokenARB,
  op: TokenOP,
  metamask: WalletMetamask,
  phantom: WalletPhantom,
  walletconnect: WalletWalletConnect,
};

export function CryptoIcon({
  name,
  size = 24,
  className,
  variant = "branded",
}: {
  name: CryptoIconName;
  size?: number;
  className?: string;
  variant?: "branded" | "mono" | "background";
}) {
  const Icon = icons[name];

  return (
    <Icon
      aria-hidden="true"
      className={className}
      size={size}
      variant={variant}
    />
  );
}
