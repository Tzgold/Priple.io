export type CuratedWallet = {
  id: string;
  label: string;
  address: string;
  chain: "ETH";
  asset: string;
  blurb: string;
};

/** Public ETH addresses used for the market pulse until the user owns a desk. */
export const CURATED_SMART_MONEY: CuratedWallet[] = [
  {
    id: "vitalik",
    label: "Vitalik Buterin",
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    chain: "ETH",
    asset: "ETH",
    blurb: "High-signal ETH reference wallet",
  },
  {
    id: "wintermute",
    label: "Wintermute Desk",
    address: "0x4F3a120E72C76c22ae802D129F6504731D7B76d3",
    chain: "ETH",
    asset: "ETH",
    blurb: "Market-making flow",
  },
  {
    id: "jump",
    label: "Jump Trading",
    address: "0xF584F8728B874a6a5c7A8d4d387C9aae899FCEC6",
    chain: "ETH",
    asset: "ETH",
    blurb: "Prop desk activity",
  },
  {
    id: "binance-hot",
    label: "Exchange hot flow",
    address: "0x28C6c06298d514Db089934071355E5743bf21d60",
    chain: "ETH",
    asset: "ETH",
    blurb: "Large exchange movement proxy",
  },
];

/** Flip Overview / pulse to personal desks as soon as the user tracks one wallet. */
export const PERSONAL_PULSE_THRESHOLD = 1;
