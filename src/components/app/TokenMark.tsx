import { CryptoIcon, type CryptoIconName } from "@/components/marketing/CryptoIcons";

const symbolMap: Record<string, CryptoIconName> = {
  ETH: "eth",
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
};

export function TokenMark({
  symbol,
  size = 28,
}: {
  symbol: string;
  size?: number;
}) {
  const name = symbolMap[symbol.toUpperCase()];

  if (!name) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#161616] font-mono text-[10px] font-semibold text-zinc-300"
        style={{ width: size, height: size }}
      >
        {symbol.slice(0, 2)}
      </span>
    );
  }

  return <CryptoIcon name={name} size={size} className="shrink-0" />;
}
