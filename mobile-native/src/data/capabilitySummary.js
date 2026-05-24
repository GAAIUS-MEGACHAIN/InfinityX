export const capabilitySummary = {
  listedChains: 152,
  liveTransactionChains: 137,
  blockedNativeChains: 14,
  bundledAssets: 3000,
  liveAssetPaths: 2617,
  registryOnlyAssets: 383
};

export const liveChains = [
  "Main",
  "Solana",
  "Ethereum",
  "Polygon",
  "BNB Chain",
  "Base",
  "Arbitrum",
  "Optimism",
  "Avalanche",
  "Bitcoin",
  "Tron",
  "Ton",
  "Sui",
  "Aptos",
  "Polkadot",
  "Kusama",
  "Bittensor",
  "Algorand",
  "Stellar",
  "Stacks",
  "MultiversX",
  "Neo"
];

export const blockedChains = [
  { name: "Cardano", reason: "Needs eUTXO transaction builder, coin selection, and Cardano native asset support." },
  { name: "WAX", reason: "Needs EOSIO/WAX signing, account resources, and history provider." },
  { name: "Internet Computer", reason: "Needs ICP ledger actor, identity support, and canister transaction flow." },
  { name: "Kaspa", reason: "Needs Kaspa WASM signer, UTXO indexer, and mass/fee estimator." },
  { name: "Bitcoin Cash", reason: "Needs BCH sighash/fork-id signing and BCH indexer broadcast." },
  { name: "Zcash", reason: "Needs transparent/shielded transaction support and chain-specific signing." },
  { name: "Monero", reason: "Needs privacy wallet scanning, spend keys, view keys, and daemon integration." },
  { name: "Nervos", reason: "Needs CKB cell model transaction builder and indexer." },
  { name: "Ergo", reason: "Needs Ergo box model support and ErgoTree transaction assembly." },
  { name: "Nano", reason: "Needs block-lattice account chain, representative, and work generation." },
  { name: "Waves", reason: "Needs browser-safe Waves SDK integration; current SDK package has install/runtime issues." },
  { name: "Ontology", reason: "Needs ONT/ONG account signing and node broadcast adapter." },
  { name: "Qtum", reason: "Needs Qtum UTXO plus account-contract transaction support." },
  { name: "Fractal Bitcoin", reason: "Needs Fractal-specific UTXO indexer, fee estimator, and broadcast route." }
];

export const featuredAssets = [
  { symbol: "IFX", name: "InfinityX", network: "Solana", value: "$0.00", trend: "native ecosystem" },
  { symbol: "BTC", name: "Bitcoin", network: "Bitcoin", value: "$0.00", trend: "live native" },
  { symbol: "ETH", name: "Ethereum", network: "Ethereum", value: "$0.00", trend: "live ERC-20" },
  { symbol: "SOL", name: "Solana", network: "Solana", value: "$0.00", trend: "live SPL" },
  { symbol: "USDC", name: "USD Coin", network: "Multi-chain", value: "$0.00", trend: "multi-path" },
  { symbol: "TON", name: "Toncoin", network: "Ton", value: "$0.00", trend: "live native" },
  { symbol: "SUI", name: "Sui", network: "Sui", value: "$0.00", trend: "live native" },
  { symbol: "APT", name: "Aptos", network: "Aptos", value: "$0.00", trend: "live native" },
  { symbol: "DOT", name: "Polkadot", network: "Polkadot", value: "$0.00", trend: "live native" }
];

export const services = [
  { name: "Send", fee: "network fee", discount: "no InfinityX fee" },
  { name: "Receive", fee: "free", discount: "free" },
  { name: "Swap", fee: "0.15%", discount: "0.075% with IFX" },
  { name: "Bridge", fee: "0.20%", discount: "0.10% with IFX" },
  { name: "DEX", fee: "0.15%", discount: "0.075% with IFX" },
  { name: "Token Create", fee: "0.25%", discount: "0.125% with IFX" }
];
