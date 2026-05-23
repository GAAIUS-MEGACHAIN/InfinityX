import fs from "node:fs";
import path from "node:path";
import { extraChains } from "../src/data/extraChains.js";
import { isSupportedEvmChain } from "../src/lib/evmWallet.js";

const ROOT = process.cwd();
const REGISTRY_PATH = path.join(ROOT, "public", "registry", "top-3000-tokens.json");
const OUT_PATH = path.join(ROOT, "audits", "latest-capability-scan.json");

const baseChains = [
  { name: "Main", symbol: "IFX", kind: "InfinityX routing", rpc: "InfinityX backend registry", explorer: "InfinityX unified activity", native: "IFX" },
  { name: "Solana", symbol: "SOL", kind: "SVM", rpc: "https://api.mainnet-beta.solana.com", explorer: "https://solscan.io", native: "SOL" },
  { name: "Ethereum", symbol: "ETH", kind: "EVM", rpc: "https://ethereum-rpc.publicnode.com", explorer: "https://etherscan.io", native: "ETH" },
  { name: "Polygon", symbol: "POL", kind: "EVM", rpc: "https://polygon-bor-rpc.publicnode.com", explorer: "https://polygonscan.com", native: "POL" },
  { name: "BNB Chain", symbol: "BNB", kind: "EVM", rpc: "https://bsc-rpc.publicnode.com", explorer: "https://bscscan.com", native: "BNB" },
  { name: "Base", symbol: "ETH", kind: "EVM", rpc: "https://base-rpc.publicnode.com", explorer: "https://basescan.org", native: "ETH" },
  { name: "Arbitrum", symbol: "ETH", kind: "EVM", rpc: "https://arbitrum-one-rpc.publicnode.com", explorer: "https://arbiscan.io", native: "ETH" },
  { name: "Optimism", symbol: "ETH", kind: "EVM", rpc: "https://optimism-rpc.publicnode.com", explorer: "https://optimistic.etherscan.io", native: "ETH" },
  { name: "Avalanche", symbol: "AVAX", kind: "EVM", rpc: "https://avalanche-c-chain-rpc.publicnode.com", explorer: "https://snowtrace.io", native: "AVAX" },
  { name: "Fantom", symbol: "FTM", kind: "EVM", rpc: "https://fantom-rpc.publicnode.com", explorer: "https://ftmscan.com", native: "FTM" },
  { name: "Bitcoin", symbol: "BTC", kind: "UTXO", rpc: "indexer-required", explorer: "https://mempool.space", native: "BTC" },
  { name: "Cardano", symbol: "ADA", kind: "UTXO", rpc: "indexer-required", explorer: "https://cardanoscan.io", native: "ADA" },
  { name: "XRP Ledger", symbol: "XRP", kind: "Account", rpc: "wss://xrplcluster.com", explorer: "https://xrpscan.com", native: "XRP" }
];

const chains = [...baseChains, ...extraChains];
const supportedUtxo = new Set(["Bitcoin", "Litecoin", "Dogecoin", "Dash"]);
const supportedCosmos = new Set(["Cosmos Hub", "Osmosis", "Celestia", "Stargaze", "Juno", "Akash", "Kujira", "Secret Network", "Stride", "Evmos", "Coreum"]);
const aliases = new Map();

for (const chain of chains) {
  addAlias(chain.name, chain);
  addAlias(chain.name.replace(/\s+/g, "-"), chain);
  addAlias(chain.name.replace(/\s+/g, ""), chain);
}

for (const [slug, name] of Object.entries({
  "arbitrum-one": "Arbitrum",
  avalanche: "Avalanche",
  base: "Base",
  "binance-smart-chain": "BNB Chain",
  bsc: "BNB Chain",
  celo: "Celo",
  ethereum: "Ethereum",
  "optimistic-ethereum": "Optimism",
  optimism: "Optimism",
  polygon: "Polygon",
  "polygon-pos": "Polygon",
  solana: "Solana",
  "world-chain": "World Chain",
  zksync: "zkSync Era"
})) {
  const chain = chains.find((item) => item.name === name);
  if (chain) addAlias(slug, chain);
}

function addAlias(value, chain) {
  aliases.set(normalize(value), chain);
}

function normalize(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function supportForChain(chain) {
  if (chain.name === "Main") return { status: "routing", live: false, reason: "Main is a unified routing page, not its own live L1 signer." };
  if (chain.kind === "SVM") return { status: "live", live: true, adapter: "solana", assets: "native+spl" };
  if (chain.kind === "EVM" && isSupportedEvmChain(chain)) return { status: "live", live: true, adapter: "evm", assets: "native+erc20" };
  if ((chain.kind === "UTXO" || chain.kind === "UTXO/EVM") && supportedUtxo.has(chain.name)) return { status: "live", live: true, adapter: "utxo", assets: "native" };
  if ((chain.kind === "Cosmos" || chain.kind === "Cosmos/EVM") && supportedCosmos.has(chain.name)) return { status: "live", live: true, adapter: "cosmos", assets: "native" };
  return { status: "blocked", live: false, reason: "Listed in registry, but no production signer/RPC/indexer adapter is wired yet." };
}

const chainSupport = chains.map((chain) => ({ ...chain, support: supportForChain(chain) }));
const liveChains = chainSupport.filter((chain) => chain.support.live);
const blockedChains = chainSupport.filter((chain) => chain.support.status === "blocked");
const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
const assets = registry.assets ?? [];

function assetCanUseLiveAdapter(asset) {
  const symbol = String(asset.symbol ?? "").toUpperCase();
  const refs = [
    ...(asset.chains ?? []).map((chain) => ({ chain, address: "" })),
    ...(asset.contracts ?? []).map((contract) => ({ chain: contract.chain ?? contract.platform, address: contract.address ?? "" }))
  ];
  if (symbol === "IFX") return true;
  for (const ref of refs) {
    const chain = aliases.get(normalize(ref.chain));
    if (!chain) continue;
    const support = supportForChain(chain);
    if (!support.live) continue;
    const nativeSymbol = String(chain.native ?? chain.symbol ?? "").toUpperCase();
    if (symbol === nativeSymbol) return true;
    if ((support.adapter === "solana" || support.adapter === "evm") && ref.address) return true;
  }
  return false;
}

const liveAssets = assets.filter(assetCanUseLiveAdapter);
const blockedAssets = assets.filter((asset) => !assetCanUseLiveAdapter(asset));
const byKind = Object.fromEntries(
  Object.entries(groupBy(chains, (chain) => chain.kind)).map(([kind, list]) => [kind, list.length])
);
const blockedByKind = Object.fromEntries(
  Object.entries(groupBy(blockedChains, (chain) => chain.kind)).map(([kind, list]) => [kind, list.map((chain) => chain.name)])
);

const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    listedChains: chains.length,
    liveTransactionChains: liveChains.length,
    blockedNativeChains: blockedChains.length,
    bundledAssets: assets.length,
    assetsWithLiveSendReceivePath: liveAssets.length,
    assetsStillRegistryOnly: blockedAssets.length
  },
  supportByKind: byKind,
  liveChains: liveChains.map((chain) => ({ name: chain.name, kind: chain.kind, adapter: chain.support.adapter, assets: chain.support.assets })),
  blockedByKind,
  topBlockedAssets: blockedAssets.slice(0, 100).map((asset) => ({ rank: asset.rank, symbol: asset.symbol, name: asset.name, chains: asset.chains ?? [] }))
};

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary, null, 2));

function groupBy(items, keyer) {
  return items.reduce((groups, item) => {
    const key = keyer(item);
    groups[key] ??= [];
    groups[key].push(item);
    return groups;
  }, {});
}
