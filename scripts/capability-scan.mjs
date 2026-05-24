import fs from "node:fs";
import path from "node:path";
import { isAddress } from "viem";
import { extraChains } from "../src/data/extraChains.js";
import { evmRpcUrlsForChain, isSupportedEvmChain } from "../src/lib/evmWallet.js";

const ROOT = process.cwd();
const REGISTRY_PATH = path.join(ROOT, "public", "registry", "top-3000-tokens.json");
const OUT_PATH = path.join(ROOT, "audits", "latest-capability-scan.json");
const CHAIN_OUT_PATH = path.join(ROOT, "audits", "latest-chain-support.json");
const ASSET_OUT_PATH = path.join(ROOT, "audits", "latest-asset-support.json");
const REPORT_OUT_PATH = path.join(ROOT, "audits", "latest-capability-report.md");

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
const supportedTron = new Set(["Tron"]);
const supportedXrp = new Set(["XRP Ledger"]);
const supportedMove = new Set(["Sui", "Aptos"]);
const supportedTon = new Set(["Ton"]);
const supportedAlgorand = new Set(["Algorand"]);
const supportedStellar = new Set(["Stellar"]);
const supportedSubstrate = new Set(["Polkadot", "Kusama", "Bittensor"]);
const supportedStacks = new Set(["Stacks"]);
const supportedMultiversX = new Set(["MultiversX"]);
const supportedNeo = new Set(["Neo"]);
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
  binancecoin: "BNB Chain",
  bsc: "BNB Chain",
  acala: "Acala",
  algorand: "Algorand",
  aptos: "Aptos",
  astar: "Astar",
  bevm: "BEVM",
  bittensor: "Bittensor",
  "bsquared-network": "B² Network",
  "bob-network": "BOB",
  celo: "Celo",
  core: "Coreum",
  "cronos-zkevm": "Cronos zkEVM",
  eos: "EOS EVM",
  "eos-evm": "EOS EVM",
  ethereum: "Ethereum",
  "ethereum-classic": "Ethereum Classic",
  etherlink: "Etherlink Mainnet",
  evmos: "Evmos",
  filecoin: "Filecoin",
  "filecoin-mainnet": "Filecoin",
  "flare-network": "Flare",
  flow: "Flow",
  "flow-evm": "Flow",
  "flow-mainnet": "Flow",
  "harmony-shard-0": "Harmony",
  hedera: "Hedera",
  "hedera-hashgraph": "Hedera",
  hyperliquid: "HyperEVM",
  hyperevm: "HyperEVM",
  "klay-token": "Kaia",
  kcc: "KCC Mainnet",
  "kcc-mainnet": "KCC Mainnet",
  kusama: "Kusama",
  "kucoin-community-chain": "KCC Mainnet",
  megaeth: "MegaETH Mainnet",
  "metal-l2": "Metal L2",
  "merlin-chain": "Merlin",
  monad: "Monad",
  multiversx: "MultiversX",
  near: "Near",
  neo: "Neo",
  "near-protocol": "Near",
  "oasis-network": "Oasis",
  polkadot: "Polkadot",
  "optimistic-ethereum": "Optimism",
  optimism: "Optimism",
  polygon: "Polygon",
  "polygon-pos": "Polygon",
  "sei-v2": "Sei EVM",
  shido: "Shido Network",
  solana: "Solana",
  soneium: "Soneium",
  stacks: "Stacks",
  stellar: "Stellar",
  sui: "Sui",
  "the-open-network": "Ton",
  ton: "Ton",
  vechain: "VeChain",
  tron: "Tron",
  "tron-network": "Tron",
  "wemix-network": "WEMIX",
  "world-chain": "World Chain",
  "xdc-network": "XDC Network",
  xdai: "Gnosis",
  xrp: "XRP Ledger",
  xrpl: "XRP Ledger",
  "xrp-ledger": "XRP Ledger",
  "x-layer": "X Layer Mainnet",
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
  if (chain.kind === "SVM") return { status: "live", live: true, adapter: "solana", assets: "native+spl", send: true, receive: true, staking: true, fallbackPaths: 3 };
  if (chain.kind === "EVM" && isSupportedEvmChain(chain)) return { status: "live", live: true, adapter: "evm", assets: "native+erc20", send: true, receive: true, staking: false, fallbackPaths: fallbackPathCount(chain) };
  if ((chain.kind === "UTXO" || chain.kind === "UTXO/EVM") && supportedUtxo.has(chain.name)) return { status: "live", live: true, adapter: "utxo", assets: "native", send: true, receive: true, staking: false, fallbackPaths: 1 };
  if ((chain.kind === "Cosmos" || chain.kind === "Cosmos/EVM") && supportedCosmos.has(chain.name)) return { status: "live", live: true, adapter: "cosmos", assets: "native", send: true, receive: true, staking: false, fallbackPaths: 2 };
  if (supportedTron.has(chain.name)) return { status: "live", live: true, adapter: "tron", assets: "native+trc20", send: true, receive: true, staking: false, fallbackPaths: 1 };
  if (supportedXrp.has(chain.name)) return { status: "live", live: true, adapter: "xrpl", assets: "native+issued", send: true, receive: true, staking: false, fallbackPaths: 1 };
  if (supportedMove.has(chain.name)) return { status: "live", live: true, adapter: chain.name === "Sui" ? "sui" : "aptos", assets: "native", send: true, receive: true, staking: false, fallbackPaths: 1 };
  if (supportedTon.has(chain.name)) return { status: "live", live: true, adapter: "ton", assets: "native", send: true, receive: true, staking: false, fallbackPaths: 1 };
  if (supportedAlgorand.has(chain.name)) return { status: "live", live: true, adapter: "algorand", assets: "native", send: true, receive: true, staking: false, fallbackPaths: 1 };
  if (supportedStellar.has(chain.name)) return { status: "live", live: true, adapter: "stellar", assets: "native", send: true, receive: true, staking: false, fallbackPaths: 1 };
  if (supportedSubstrate.has(chain.name)) return { status: "live", live: true, adapter: "substrate", assets: "native", send: true, receive: true, staking: false, fallbackPaths: 1 };
  if (supportedStacks.has(chain.name)) return { status: "live", live: true, adapter: "stacks", assets: "native", send: true, receive: true, staking: false, fallbackPaths: 1 };
  if (supportedMultiversX.has(chain.name)) return { status: "live", live: true, adapter: "multiversx", assets: "native", send: true, receive: true, staking: false, fallbackPaths: 1 };
  if (supportedNeo.has(chain.name)) return { status: "live", live: true, adapter: "neo", assets: "native", send: true, receive: true, staking: false, fallbackPaths: 1 };
  return { status: "blocked", live: false, reason: "Listed in registry, but no production signer/RPC/indexer adapter is wired yet." };
}

const chainSupport = chains.map((chain) => ({ ...chain, support: supportForChain(chain) }));
const liveChains = chainSupport.filter((chain) => chain.support.live);
const blockedChains = chainSupport.filter((chain) => chain.support.status === "blocked");
const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
const assets = registry.assets ?? [];
const nativeChainsBySymbol = new Map();
for (const chain of chains) {
  if (chain.name === "Main") continue;
  for (const symbol of [chain.native, chain.symbol]) {
    const key = String(symbol ?? "").toUpperCase();
    if (!key) continue;
    nativeChainsBySymbol.set(key, [...(nativeChainsBySymbol.get(key) ?? []), chain]);
  }
}

function workingPathsForAsset(asset) {
  const symbol = String(asset.symbol ?? "").toUpperCase();
  const refs = [
    ...(asset.chains ?? []).map((chain) => ({ chain, address: "" })),
    ...(asset.contracts ?? []).map((contract) => ({ chain: contract.chain ?? contract.platform, address: contract.address ?? "" }))
  ];
  const paths = [];
  if (symbol === "IFX") {
    paths.push({ chain: "Solana", adapter: "solana", assetType: "spl", send: true, receive: true, balance: true, staking: false, fallbackPaths: 3 });
  }
  for (const chain of nativeChainsBySymbol.get(symbol) ?? []) {
    const support = supportForChain(chain);
    if (support.live) {
      paths.push({ chain: chain.name, adapter: support.adapter, assetType: "native", send: support.send, receive: support.receive, balance: true, staking: support.staking, fallbackPaths: support.fallbackPaths });
    }
  }
  for (const ref of refs) {
    const chain = aliases.get(normalize(ref.chain));
    if (!chain) continue;
    const support = supportForChain(chain);
    if (!support.live) continue;
    const nativeSymbol = String(chain.native ?? chain.symbol ?? "").toUpperCase();
    if (symbol === nativeSymbol) {
      paths.push({ chain: chain.name, adapter: support.adapter, assetType: "native", send: support.send, receive: support.receive, balance: true, staking: support.staking, fallbackPaths: support.fallbackPaths });
      continue;
    }
    if (isLiveTokenContract(support.adapter, ref.address)) {
      paths.push({ chain: chain.name, adapter: support.adapter, assetType: tokenTypeForAdapter(support.adapter), contract: ref.address, send: true, receive: true, balance: true, staking: false, fallbackPaths: support.fallbackPaths });
    }
  }
  const seen = new Set();
  return paths.filter((item) => {
    const key = `${item.chain}:${item.contract ?? item.assetType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function tokenTypeForAdapter(adapter) {
  if (adapter === "solana") return "spl";
  if (adapter === "evm") return "erc20";
  if (adapter === "cosmos") return "cosmos-denom";
  if (adapter === "tron") return "trc20";
  if (adapter === "xrpl") return "xrpl-issued";
  if (["sui", "aptos", "ton", "algorand", "stellar", "substrate", "stacks", "multiversx", "neo"].includes(adapter)) return "native";
  return "token";
}

function isLiveTokenContract(adapter, address) {
  if (!address) return false;
  if (adapter === "evm") return isAddress(address);
  return adapter === "solana" || adapter === "cosmos" || adapter === "tron" || adapter === "xrpl";
}

function assetCanUseLiveAdapter(asset) {
  return workingPathsForAsset(asset).length > 0;
}

const assetSupport = assets.map((asset) => {
  const workingPaths = workingPathsForAsset(asset);
  return {
    rank: asset.rank,
    id: asset.id,
    symbol: asset.symbol,
    name: asset.name,
    status: workingPaths.length ? "live" : "registry-only",
    workingPathCount: workingPaths.length,
    workingPaths,
    listedChains: asset.chains ?? [],
    reason: workingPaths.length
      ? "At least one listed chain has a live InfinityX send/receive adapter for this asset."
      : "No listed chain for this asset is wired to a live InfinityX signer/indexer adapter yet."
  };
});
const liveAssets = assetSupport.filter((asset) => asset.status === "live");
const blockedAssets = assetSupport.filter((asset) => asset.status !== "live");
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
  vmCoverage: vmCoverage(chainSupport),
  liveChains: liveChains.map((chain) => chainReportEntry(chain)),
  blockedByKind,
  topBlockedAssets: blockedAssets.slice(0, 100).map((asset) => ({ rank: asset.rank, symbol: asset.symbol, name: asset.name, chains: asset.listedChains }))
};

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2));
fs.writeFileSync(CHAIN_OUT_PATH, JSON.stringify(chainSupport.map((chain) => chainReportEntry(chain)), null, 2));
fs.writeFileSync(ASSET_OUT_PATH, JSON.stringify(assetSupport, null, 2));
fs.writeFileSync(REPORT_OUT_PATH, markdownReport(report, chainSupport, assetSupport));
console.log(JSON.stringify(report.summary, null, 2));

function groupBy(items, keyer) {
  return items.reduce((groups, item) => {
    const key = keyer(item);
    groups[key] ??= [];
    groups[key].push(item);
    return groups;
  }, {});
}

function fallbackPathCount(chain) {
  return evmRpcUrlsForChain(chain).length || 1;
}

function chainReportEntry(chain) {
  return {
    name: chain.name,
    native: chain.native,
    kind: chain.kind,
    status: chain.support.status,
    adapter: chain.support.adapter ?? "",
    assets: chain.support.assets ?? "",
    send: Boolean(chain.support.send),
    receive: Boolean(chain.support.receive),
    balance: Boolean(chain.support.live),
    staking: Boolean(chain.support.staking),
    fallbackPaths: chain.support.fallbackPaths ?? 0,
    rpc: chain.rpc,
    explorer: chain.explorer,
    reason: chain.support.reason ?? "Live adapter is wired."
  };
}

function vmCoverage(chainSupport) {
  return Object.entries(groupBy(chainSupport, (chain) => chain.kind)).map(([kind, items]) => {
    const live = items.filter((item) => item.support.live).length;
    return {
      kind,
      listedChains: items.length,
      liveChains: live,
      status: live === items.length ? "fully-live-for-listed-chains" : live > 0 ? "partial" : "blocked",
      note: vmNote(kind, live)
    };
  });
}

function vmNote(kind, live) {
  if (kind === "EVM") return "EVM native coin and ERC-20 send/receive are wired.";
  if (kind === "SVM") return "Solana native SOL and SPL token send/receive are wired.";
  if (kind === "Cosmos" || kind === "Cosmos/EVM") return "Cosmos native send/receive is wired for selected chains; IBC/token modules are not.";
  if (kind === "UTXO") return live ? "Native UTXO send/receive is wired for selected chains only." : "Native UTXO adapter is still missing for these chains.";
  if (kind === "Move") return live ? "Sui and Aptos native send/receive are wired through chain SDKs; Move token standards still need adapters." : "Move signer adapters are still missing.";
  if (kind === "Substrate") return live ? "Polkadot, Kusama, and Bittensor native send/receive are wired through Substrate SDKs." : "Substrate signer adapters are still missing.";
  if (kind === "Bitcoin L2") return live ? "Stacks native STX and selected EVM BTC L2 networks are wired; non-EVM Bitcoin L2s still need adapters." : "Bitcoin L2 signer adapters are still missing.";
  if (kind === "Account" && live) return "TRON, XRP Ledger, TON, Algorand, Stellar, MultiversX, NEO, and selected EVM-account networks are wired; other account-model chains still need adapters.";
  if (["Move", "Substrate", "Account", "DAG", "Canister", "Privacy", "Bitcoin L2", "UTXO/EVM"].includes(kind)) return "Listed for discovery, but real transaction support needs a production signer/indexer adapter.";
  return "Discovery registry support only unless listed live.";
}

function markdownReport(report, chainSupport, assetSupport) {
  const blocked = chainSupport.filter((chain) => chain.support.status === "blocked");
  const liveAssetCount = assetSupport.filter((asset) => asset.status === "live").length;
  const registryOnlyCount = assetSupport.length - liveAssetCount;
  const blockedKinds = Object.entries(groupBy(blocked, (chain) => chain.kind))
    .map(([kind, items]) => `- ${kind}: ${items.map((item) => item.name).join(", ")}`)
    .join("\n");
  return `# InfinityX Capability Scan

Generated: ${report.generatedAt}

## Summary

- Listed chains: ${report.summary.listedChains}
- Live transaction chains: ${report.summary.liveTransactionChains}
- Blocked native chains: ${report.summary.blockedNativeChains}
- Bundled top assets: ${report.summary.bundledAssets}
- Assets with at least one live send/receive path: ${liveAssetCount}
- Registry-only assets: ${registryOnlyCount}

## VM Coverage

${report.vmCoverage.map((item) => `- ${item.kind}: ${item.liveChains}/${item.listedChains} live (${item.status})`).join("\n")}

## Blocked Chain Families

${blockedKinds || "- None"}

## Files

- Full chain support: audits/latest-chain-support.json
- Full 3000-asset support: audits/latest-asset-support.json
- Summary JSON: audits/latest-capability-scan.json
`;
}
