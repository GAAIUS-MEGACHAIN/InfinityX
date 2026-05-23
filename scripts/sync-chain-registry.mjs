import { writeFileSync, mkdirSync } from "node:fs";
import { extraChains } from "../src/data/extraChains.js";

const baseChains = [
  { id: "main", name: "Main", type: "InfinityX virtual routing layer", native: "IFX", connectedChains: [] },
  { id: "solana", name: "Solana", type: "SVM", native: "SOL", rpc: "https://api.mainnet-beta.solana.com", explorer: "https://solscan.io" },
  { id: "ethereum", name: "Ethereum", type: "EVM", native: "ETH", rpc: "https://ethereum-rpc.publicnode.com", explorer: "https://etherscan.io" },
  { id: "polygon", name: "Polygon", type: "EVM", native: "POL", rpc: "https://polygon-bor-rpc.publicnode.com", explorer: "https://polygonscan.com" },
  { id: "bnb", name: "BNB Chain", type: "EVM", native: "BNB", rpc: "https://bsc-rpc.publicnode.com", explorer: "https://bscscan.com" },
  { id: "base", name: "Base", type: "EVM", native: "ETH", rpc: "https://base-rpc.publicnode.com", explorer: "https://basescan.org" },
  { id: "arbitrum", name: "Arbitrum", type: "EVM", native: "ETH", rpc: "https://arbitrum-one-rpc.publicnode.com", explorer: "https://arbiscan.io" },
  { id: "optimism", name: "Optimism", type: "EVM", native: "ETH", rpc: "https://optimism-rpc.publicnode.com", explorer: "https://optimistic.etherscan.io" },
  { id: "avalanche", name: "Avalanche", type: "EVM", native: "AVAX", rpc: "https://avalanche-c-chain-rpc.publicnode.com", explorer: "https://snowtrace.io" },
  { id: "fantom", name: "Fantom", type: "EVM", native: "FTM", rpc: "https://fantom-rpc.publicnode.com", explorer: "https://ftmscan.com" },
  { id: "bitcoin", name: "Bitcoin", type: "UTXO", native: "BTC", rpc: "indexer-required", explorer: "https://mempool.space" },
  { id: "cardano", name: "Cardano", type: "UTXO", native: "ADA", rpc: "indexer-required", explorer: "https://cardanoscan.io" },
  { id: "xrp", name: "XRP Ledger", type: "Account", native: "XRP", rpc: "wss://xrplcluster.com", explorer: "https://xrpscan.com" }
];

const extras = extraChains.map((chain) => ({
  id: chain.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, ""),
  name: chain.name,
  type: chain.kind,
  native: chain.native,
  rpc: chain.rpc,
  explorer: chain.explorer
}));

baseChains[0].connectedChains = [...baseChains.slice(1), ...extras].map((chain) => chain.id);
const payload = [...baseChains, ...extras];

mkdirSync("backend/data", { recursive: true });
mkdirSync("public/registry", { recursive: true });
writeFileSync("backend/data/chains.json", JSON.stringify(payload, null, 2));
writeFileSync("public/registry/chains.json", JSON.stringify({ generatedAt: new Date().toISOString(), count: payload.length, chains: payload }, null, 2));
console.log(JSON.stringify({ chains: payload.length }, null, 2));
