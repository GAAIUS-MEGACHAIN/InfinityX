import { mkdirSync, writeFileSync } from "node:fs";

const markets = [];
for (let page = 1; page <= 12; page += 1) {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}&sparkline=false`;
  markets.push(...await fetchJsonWithRetry(url, `markets page ${page}`));
  await sleep(2500);
}

const platformList = await fetchJsonWithRetry("https://api.coingecko.com/api/v3/coins/list?include_platform=true", "coin list");
const platformsById = new Map(platformList.map((coin) => [coin.id, coin.platforms ?? {}]));

const platformMap = {
  solana: "Solana",
  ethereum: "Ethereum",
  "polygon-pos": "Polygon",
  "binance-smart-chain": "BNB Chain",
  "base": "Base",
  "arbitrum-one": "Arbitrum",
  "optimistic-ethereum": "Optimism",
  avalanche: "Avalanche",
  "fantom": "Fantom",
  bitcoin: "Bitcoin",
  cardano: "Cardano",
  "xrp-ledger": "XRP Ledger"
};

const assets = markets.slice(0, 3000).map((coin) => {
  const platforms = platformsById.get(coin.id) ?? {};
  const contracts = Object.entries(platforms)
    .filter(([, address]) => Boolean(address))
    .map(([platform, address]) => ({
      platform,
      chain: platformMap[platform] ?? platform,
      address
    }));
  return {
    rank: coin.market_cap_rank,
    id: coin.id,
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    image: coin.image,
    priceUsd: coin.current_price,
    marketCapUsd: coin.market_cap,
    chains: contracts.length ? [...new Set(contracts.map((item) => item.chain))] : inferChains(coin),
    contracts
  };
});

const payload = {
  generatedAt: new Date().toISOString(),
  source: "CoinGecko snapshot generated at build time; app uses this local file at runtime",
  count: assets.length,
  assets
};

mkdirSync("public/registry", { recursive: true });
mkdirSync("backend/data", { recursive: true });
writeFileSync("public/registry/top-3000-tokens.json", JSON.stringify(payload));
writeFileSync("backend/data/tokens.top3000.json", JSON.stringify(payload, null, 2));

console.log(JSON.stringify({ count: assets.length, public: "public/registry/top-3000-tokens.json", backend: "backend/data/tokens.top3000.json" }, null, 2));

function inferChains(coin) {
  const symbol = coin.symbol.toUpperCase();
  const known = {
    BTC: ["Bitcoin"],
    ETH: ["Ethereum"],
    SOL: ["Solana"],
    BNB: ["BNB Chain"],
    XRP: ["XRP Ledger"],
    ADA: ["Cardano"],
    AVAX: ["Avalanche"],
    FTM: ["Fantom"]
  };
  return known[symbol] ?? ["Main"];
}

async function fetchJsonWithRetry(url, label) {
  let lastError;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const response = await fetch(url);
    if (response.ok) return response.json();
    lastError = new Error(`${label}: ${response.status} ${response.statusText}`);
    const retryAfter = Number(response.headers.get("retry-after") ?? 0);
    const delay = retryAfter > 0 ? retryAfter * 1000 : attempt * 7000;
    await sleep(delay);
  }
  throw lastError;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
