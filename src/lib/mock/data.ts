export const mockWallets = [
  {
    id: "1",
    label: "Wintermute Desk",
    address: "0x8f3c…9a21",
    chain: "ETH",
    pnl30d: "+18.4%",
    lastMove: "Bought $420k $LINK",
    score: 86,
  },
  {
    id: "2",
    label: "Smart Money α",
    address: "0x2b91…c4e0",
    chain: "ETH",
    pnl30d: "+42.1%",
    lastMove: "Bridged $1.2M → Base",
    score: 91,
  },
  {
    id: "3",
    label: "DeFi Accumulator",
    address: "0x71aa…08d3",
    chain: "BNB",
    pnl30d: "+9.7%",
    lastMove: "Staked 2.4k $ETH",
    score: 74,
  },
  {
    id: "4",
    label: "NFT Flipper 09",
    address: "0x9e22…bb17",
    chain: "ETH",
    pnl30d: "-3.2%",
    lastMove: "Sold 14 Punks",
    score: 61,
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

export const mockAlerts = [
  {
    id: "a1",
    title: "Whale accumulation",
    detail: "3 tracked wallets bought $LINK in the last 40m",
    time: "2m ago",
    type: "signal" as const,
  },
  {
    id: "a2",
    title: "Cross-chain flow",
    detail: "Smart Money α bridged $1.2M ETH → Base",
    time: "18m ago",
    type: "flow" as const,
  },
  {
    id: "a3",
    title: "Sentiment spike",
    detail: "Social mentions for $SOL up 47% vs 24h avg",
    time: "41m ago",
    type: "social" as const,
  },
];

export const mockMoves = [
  {
    wallet: "Wintermute Desk",
    action: "Bought",
    amount: "$420k",
    asset: "LINK",
    time: "4m",
  },
  {
    wallet: "Smart Money α",
    action: "Bridged",
    amount: "$1.2M",
    asset: "ETH",
    time: "18m",
  },
  {
    wallet: "DeFi Accumulator",
    action: "Staked",
    amount: "2.4k",
    asset: "ETH",
    time: "1h",
  },
];

export const testimonials = [
  {
    name: "Maya Chen",
    role: "On-chain analyst",
    quote:
      "Priple is the first place I check before I even open a chart. The scorecard cuts the noise fast.",
  },
  {
    name: "Jonah Reed",
    role: "Prop desk",
    quote:
      "Wallet correlation alerts alone paid for the Pro seat. We catch leader-follower flows earlier now.",
  },
  {
    name: "Aisha Okonkwo",
    role: "Solo trader",
    quote:
      "Looks like a research tool, feels like a trading cockpit. Clean enough that I actually use it daily.",
  },
  {
    name: "Leo Martins",
    role: "Fund ops",
    quote:
      "Finally one screen for whales, screener, and social heat — without five tabs open.",
  },
];
