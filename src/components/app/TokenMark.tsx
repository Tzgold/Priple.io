import { CryptoIcon, type CryptoIconName } from "@/components/marketing/CryptoIcons";
import { cn } from "@/lib/cn";

const symbolMap: Record<string, CryptoIconName> = {
  ETH: "eth",
  WETH: "eth",
  BTC: "bitcoin",
  SOL: "sol",
  LINK: "link",
  USDT: "usdt",
  USDC: "usdc",
  MATIC: "matic",
  POL: "polygon",
  XRP: "xrp",
  ADA: "ada",
  ARB: "arb",
  OP: "op",
  BNB: "bnb",
  WBNB: "bnb",
};

/** Official CoinGecko CDN marks for board rows that only have a ticker. */
export const SYMBOL_IMAGE_URL: Record<string, string> = {
  ETH: "https://coin-images.coingecko.com/coins/images/279/small/ethereum.png",
  WETH: "https://coin-images.coingecko.com/coins/images/2518/small/weth.png",
  BTC: "https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png",
  SOL: "https://coin-images.coingecko.com/coins/images/4128/small/solana.png",
  LINK: "https://coin-images.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
  USDT: "https://coin-images.coingecko.com/coins/images/325/small/Tether.png",
  USDC: "https://coin-images.coingecko.com/coins/images/6319/small/usdc.png",
  XRP: "https://coin-images.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
  ARB: "https://coin-images.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg",
  OP: "https://coin-images.coingecko.com/coins/images/25244/small/Optimism.png",
  BNB: "https://coin-images.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  WBNB: "https://coin-images.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  ADA: "https://coin-images.coingecko.com/coins/images/975/small/cardano.png",
  MATIC: "https://coin-images.coingecko.com/coins/images/4713/small/polygon.png",
  POL: "https://coin-images.coingecko.com/coins/images/4713/small/polygon.png",
};

export function resolveTokenImage(symbol?: string | null, imageUrl?: string | null) {
  if (imageUrl) return imageUrl;
  if (!symbol) return null;
  return SYMBOL_IMAGE_URL[symbol.toUpperCase()] ?? null;
}

export function TokenMark({
  symbol,
  imageUrl,
  size = 28,
  className,
}: {
  symbol: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const src = resolveTokenImage(symbol, imageUrl);
  const iconName = symbolMap[symbol.toUpperCase()];

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full border border-white/10 bg-[#161616] object-cover", className)}
        style={{ width: size, height: size }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }

  if (iconName) {
    return <CryptoIcon name={iconName} size={size} className={cn("shrink-0", className)} />;
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#161616] font-mono text-[10px] font-semibold text-zinc-300",
        className,
      )}
      style={{ width: size, height: size }}
      title={symbol}
    >
      {symbol.slice(0, 2).toUpperCase()}
    </span>
  );
}
