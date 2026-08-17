export type TrackedWallet = {
  id: string;
  label: string;
  address: string;
  fullAddress?: string;
  chain: string;
  pnl30d: string;
  lastMove: string;
  score: number;
  asset: string;
  usd: string;
  custom?: boolean;
};

export type AlertItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  type: "signal" | "flow" | "social" | "score";
  status: "Live" | "Confirmed" | "Watching";
};

export const mockWallets: TrackedWallet[] = [
  {
    id: "1",
    label: "Wintermute Desk",
    address: "0x4F3a…76d3",
    fullAddress: "0x4F3a120E72C76c22ae802D129F6504731D7B76d3",
    chain: "ETH",
    pnl30d: "+18.4%",
    lastMove: "Bought $420k $LINK",
    score: 86,
    asset: "ETH",
    usd: "$4.82M",
  },
  {
    id: "2",
    label: "Smart Money α",
    address: "0xd8dA…6045",
    fullAddress: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    chain: "ETH",
    pnl30d: "+42.1%",
    lastMove: "Bridged $1.2M → Base",
    score: 91,
    asset: "ETH",
    usd: "$12.4M",
  },
  {
    id: "3",
    label: "DeFi Accumulator",
    address: "0x71aa…08d3",
    chain: "BNB",
    pnl30d: "+9.7%",
    lastMove: "Staked 2.4k $ETH",
    score: 74,
    asset: "BNB",
    usd: "$1.08M",
  },
  {
    id: "4",
    label: "Jump Trading",
    address: "0xF584…CEC6",
    fullAddress: "0xF584F8728B874a6a5c7A8d4d387C9aae899FCEC6",
    chain: "ETH",
    pnl30d: "+21.6%",
    lastMove: "Bought $890k flow",
    score: 88,
    asset: "ETH",
    usd: "$6.31M",
  },
  {
    id: "5",
    label: "Base Builder",
    address: "0x28C6…1d60",
    fullAddress: "0x28C6c06298d514Db089934071355E5743bf21d60",
    chain: "ETH",
    pnl30d: "+14.2%",
    lastMove: "Accumulated $ARB",
    score: 79,
    asset: "ETH",
    usd: "$640k",
  },
  {
    id: "6",
    label: "NFT Flipper 09",
    address: "0x9e22…bb17",
    chain: "ETH",
    pnl30d: "-3.2%",
    lastMove: "Sold 14 Punks",
    score: 61,
    asset: "ETH",
    usd: "$220k",
  },
];

export const mockTokens = [
  {
    symbol: "ETH",
    name: "Ethereum",
    price: "$3,412.20",
    change24h: "+2.4%",
    volume: "$18.2B",
    score: 78,
    positive: true,
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: "$97,840",
    change24h: "+1.1%",
    volume: "$32.4B",
    score: 72,
    positive: true,
  },
  {
    symbol: "SOL",
    name: "Solana",
    price: "$168.40",
    change24h: "+5.1%",
    volume: "$4.1B",
    score: 84,
    positive: true,
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    price: "$18.92",
    change24h: "+8.7%",
    volume: "$892M",
    score: 88,
    positive: true,
  },
  {
    symbol: "USDT",
    name: "Tether",
    price: "$1.00",
    change24h: "+0.0%",
    volume: "$61.2B",
    score: 54,
    positive: true,
  },
  {
    symbol: "XRP",
    name: "XRP",
    price: "$2.18",
    change24h: "+3.4%",
    volume: "$3.1B",
    score: 71,
    positive: true,
  },
  {
    symbol: "ARB",
    name: "Arbitrum",
    price: "$0.84",
    change24h: "-1.2%",
    volume: "$214M",
    score: 62,
    positive: false,
  },
  {
    symbol: "OP",
    name: "Optimism",
    price: "$1.12",
    change24h: "+0.6%",
    volume: "$156M",
    score: 69,
    positive: true,
  },
];

export const watchTokens = [
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "USDT", name: "Tether" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "LINK", name: "Chainlink" },
  { symbol: "ARB", name: "Arbitrum" },
  { symbol: "XRP", name: "XRP" },
] as const;

export const mockAlerts: AlertItem[] = [
  {
    id: "a1",
    title: "Whale accumulation",
    detail: "3 tracked wallets bought $LINK in the last 40m",
    time: "2m ago",
    type: "signal",
    status: "Live",
  },
  {
    id: "a2",
    title: "Cross-chain flow",
    detail: "Smart Money α bridged $1.2M ETH → Base",
    time: "18m ago",
    type: "flow",
    status: "Confirmed",
  },
  {
    id: "a3",
    title: "Sentiment spike",
    detail: "Social mentions for $SOL up 47% vs 24h avg",
    time: "41m ago",
    type: "social",
    status: "Watching",
  },
  {
    id: "a4",
    title: "Opportunity threshold",
    detail: "$LINK score crossed 85 with clustered buys",
    time: "1h ago",
    type: "score",
    status: "Live",
  },
];

export const mockMoves = [
  {
    id: "m1",
    wallet: "Wintermute Desk",
    action: "Bought",
    amount: "$420k",
    asset: "LINK",
    usd: "$420,180",
    time: "14:35",
    date: "Today",
    status: "Confirmed" as const,
    type: "buy" as const,
  },
  {
    id: "m2",
    wallet: "Smart Money α",
    action: "Bridged",
    amount: "$1.2M",
    asset: "ETH",
    usd: "$1,204,000",
    time: "13:12",
    date: "Today",
    status: "Confirmed" as const,
    type: "flow" as const,
  },
  {
    id: "m3",
    wallet: "Jump Trading",
    action: "Alert fired",
    amount: "$890k",
    asset: "SOL",
    usd: "$890,400",
    time: "11:48",
    date: "Today",
    status: "Live" as const,
    type: "alert" as const,
  },
  {
    id: "m4",
    wallet: "DeFi Accumulator",
    action: "Staked",
    amount: "2.4k",
    asset: "ETH",
    usd: "$8,189,000",
    time: "09:04",
    date: "Today",
    status: "Confirmed" as const,
    type: "stake" as const,
  },
  {
    id: "m5",
    wallet: "Base Builder",
    action: "Accumulated",
    amount: "$186k",
    asset: "ARB",
    usd: "$186,220",
    time: "22:17",
    date: "Yesterday",
    status: "Watching" as const,
    type: "buy" as const,
  },
  {
    id: "m6",
    wallet: "Smart Money α",
    action: "Bought",
    amount: "$310k",
    asset: "LINK",
    usd: "$310,400",
    time: "15:06",
    date: "Today",
    status: "Confirmed" as const,
    type: "buy" as const,
  },
];
