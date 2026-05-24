import { deriveEvmAddress, getErc20TokenBalance, getEvmWalletState, isSupportedEvmChain, sendErc20Token, sendEvmNative } from "./evmWallet.js";
import { getSolanaWalletState, getSplTokenBalance, IFX_MINT, sendSol, sendSplToken } from "./solanaWallet.js";
import { isAddress } from "viem";

const SUPPORTED_UTXO_CHAINS = new Set(["Bitcoin", "Litecoin", "Dogecoin", "Dash"]);
const SUPPORTED_COSMOS_CHAINS = new Set(["Cosmos Hub", "Osmosis", "Celestia", "Stargaze", "Juno", "Akash", "Kujira", "Secret Network", "Stride", "Evmos", "Coreum"]);
const SUPPORTED_TRON_CHAINS = new Set(["Tron"]);
const SUPPORTED_XRP_CHAINS = new Set(["XRP Ledger"]);
const SUPPORTED_MOVE_CHAINS = new Set(["Sui", "Aptos"]);
const SUPPORTED_TON_CHAINS = new Set(["Ton"]);
const SUPPORTED_ALGORAND_CHAINS = new Set(["Algorand"]);
const SUPPORTED_STELLAR_CHAINS = new Set(["Stellar"]);
const SUPPORTED_SUBSTRATE_CHAINS = new Set(["Polkadot", "Kusama", "Bittensor"]);
const SUPPORTED_STACKS_CHAINS = new Set(["Stacks"]);
const SUPPORTED_MULTIVERSX_CHAINS = new Set(["MultiversX"]);
const SUPPORTED_NEO_CHAINS = new Set(["Neo"]);
const CHAIN_ALIASES = {
  binancecoin: "bnbchain",
  acala: "acala",
  algorand: "algorand",
  aptos: "aptos",
  astar: "astar",
  b2network: "bnetwork",
  bsquarednetwork: "bnetwork",
  bevm: "bevm",
  bittensor: "bittensor",
  bobnetwork: "bob",
  core: "coreum",
  cronozkevm: "cronoszkevm",
  cronoszkevm: "cronoszkevm",
  eos: "eosevm",
  eosevm: "eosevm",
  ethereumclassic: "ethereumclassic",
  etherlink: "etherlinkmainnet",
  evmos: "evmos",
  filecoin: "filecoin",
  filecoinmainnet: "filecoin",
  flarenetwork: "flare",
  flow: "flow",
  flowevm: "flow",
  flowmainnet: "flow",
  hedera: "hedera",
  hederahashgraph: "hedera",
  harmonyshard0: "harmony",
  hyperliquid: "hyperevm",
  hyperevm: "hyperevm",
  klaytoken: "kaia",
  kcc: "kccmainnet",
  kccmainnet: "kccmainnet",
  kusama: "kusama",
  kucoincommunitychain: "kccmainnet",
  megaeth: "megaethmainnet",
  metall2: "metall2",
  merlinchain: "merlin",
  monad: "monad",
  multiversx: "multiversx",
  near: "near",
  neo: "neo",
  nearprotocol: "near",
  oasisnetwork: "oasis",
  polkadot: "polkadot",
  stellar: "stellar",
  stacks: "stacks",
  sui: "sui",
  theopennetwork: "ton",
  ton: "ton",
  tron: "tron",
  tronnetwork: "tron",
  sei2: "seievm",
  seiv2: "seievm",
  shido: "shidonetwork",
  soneium: "soneium",
  wemixnetwork: "wemix",
  vechain: "vechain",
  xdcnetwork: "xdcnetwork",
  xrp: "xrpledger",
  xrpl: "xrpledger",
  xrpledger: "xrpledger",
  xlayer: "xlayermainnet",
  xdai: "gnosis"
};

export function buildNativeAsset(chain) {
  return {
    id: `native:${chain.name}`,
    symbol: chain.native || chain.symbol,
    name: `${chain.name} Native`,
    network: chain.name,
    chains: [chain.name],
    contracts: [],
    native: true,
    action: "Native"
  };
}

export function assetKey(asset) {
  return asset?.id ?? `${asset?.symbol}:${asset?.name}:${asset?.network ?? ""}`;
}

export function getAssetListForChain(registry, chain) {
  const native = buildNativeAsset(chain);
  const normalizedChain = canonicalChain(chain.name);
  const source = chain.name === "Main"
    ? registry
    : registry.filter((asset) =>
      (asset.chains ?? []).some((item) => canonicalChain(item) === normalizedChain) ||
      canonicalChain(asset.network) === normalizedChain ||
      (asset.contracts ?? []).some((contract) => canonicalChain(contract.chain ?? contract.platform) === normalizedChain)
    );
  const ifx = chain.name === "Solana"
    ? [{ id: "infinityx-ifx", symbol: "IFX", name: "InfinityX", network: "Solana", chains: ["Solana"], contracts: [{ chain: "Solana", address: IFX_MINT }], mint: IFX_MINT }]
    : [];
  const seen = new Set();
  return [native, ...ifx, ...source].filter((asset) => {
    const key = assetKey(asset);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function contractForChain(token, chainName) {
  if (!token) return "";
  if (String(token.symbol).toUpperCase() === "IFX" && chainName === "Solana") return IFX_MINT;
  if (token.mint && chainName === "Solana") return token.mint;
  if (token.contract && (!token.network || canonicalChain(token.network) === canonicalChain(chainName) || token.network === "Multi-chain")) return token.contract;
  return (token.contracts ?? []).find((contract) => canonicalChain(contract.chain ?? contract.platform) === canonicalChain(chainName))?.address ?? "";
}

export function isNativeAsset(token, chain) {
  const symbol = String(token?.symbol ?? "").toUpperCase();
  const native = String(chain?.native ?? chain?.symbol ?? "").toUpperCase();
  return Boolean(token?.native || (symbol && native && symbol === native) || (chain?.name === "Ethereum" && symbol === "ETH"));
}

export function getAssetCapability({ chain, token }) {
  const native = isNativeAsset(token, chain);
  const contract = contractForChain(token, chain.name);
  if (chain.kind === "SVM") {
    const canUse = native || Boolean(contract);
    return {
      adapter: "solana",
      native,
      contract,
      canReceive: true,
      canBalance: canUse,
      canSend: canUse,
      canStake: native,
      reason: canUse
        ? "Live Solana/SPL send, receive, and balance are enabled. Native SOL staking is enabled."
        : `${token.symbol} has no Solana mint in the bundled registry. Import the SPL mint to send it.`
    };
  }
  if (chain.kind === "EVM" && isSupportedEvmChain(chain)) {
    const evmContract = contract && isAddress(contract) ? contract : "";
    const hasUnsupportedContractId = Boolean(contract && !evmContract);
    const canUse = native || Boolean(evmContract);
    return {
      adapter: "evm",
      native,
      contract: evmContract,
      canReceive: true,
      canBalance: canUse,
      canSend: canUse,
      canStake: false,
      reason: canUse
        ? "Live EVM native/ERC-20 send, receive, and balance are enabled for this network."
        : hasUnsupportedContractId
          ? `${token.symbol} has a ${chain.name} registry id, but it is not a 0x ERC-20 contract that the EVM signer can send. Import the EVM ERC-20 contract to send it.`
        : `${token.symbol} has no ${chain.name} contract in the bundled registry. Import the contract to send it.`
    };
  }
  if ((chain.kind === "UTXO" || chain.kind === "UTXO/EVM") && SUPPORTED_UTXO_CHAINS.has(chain.name)) {
    const canUse = native;
    const canSend = canUse;
    return {
      adapter: "utxo",
      native,
      contract,
      canReceive: canUse,
      canBalance: canUse,
      canSend,
      canStake: false,
      reason: canUse
        ? `Live ${chain.name} native receive, balance, and UTXO send are enabled through the UTXO adapter.`
        : `${chain.name} supports native UTXO coins only in this adapter.`
    };
  }
  if ((chain.kind === "Cosmos" || chain.kind === "Cosmos/EVM") && SUPPORTED_COSMOS_CHAINS.has(chain.name)) {
    const canUse = native || Boolean(contract);
    return {
      adapter: "cosmos",
      native,
      contract,
      canReceive: canUse,
      canBalance: canUse,
      canSend: canUse,
      canStake: false,
      reason: canUse
        ? `Live ${chain.name} bank-token receive, balance, and send are enabled through the Cosmos adapter.`
        : `${token.symbol} has no ${chain.name} denom in the bundled registry.`
    };
  }
  if (SUPPORTED_TRON_CHAINS.has(chain.name)) {
    const canUse = native || Boolean(contract);
    return {
      adapter: "tron",
      native,
      contract,
      canReceive: canUse,
      canBalance: canUse,
      canSend: canUse,
      canStake: false,
      reason: canUse
        ? "Live TRON native/TRC-20 send, receive, and balance are enabled."
        : `${token.symbol} has no TRON TRC-20 contract in the bundled registry. Import the TRC-20 contract to send it.`
    };
  }
  if (SUPPORTED_XRP_CHAINS.has(chain.name)) {
    const canUse = native || Boolean(contract);
    return {
      adapter: "xrpl",
      native,
      contract,
      canReceive: canUse,
      canBalance: canUse,
      canSend: canUse,
      canStake: false,
      reason: canUse
        ? "Live XRP Ledger native/issued-token send, receive, and balance are enabled."
        : `${token.symbol} has no XRP Ledger issued-token id in the bundled registry. Import currency.issuer to send it.`
    };
  }
  if (SUPPORTED_MOVE_CHAINS.has(chain.name)) {
    const adapter = chain.name === "Sui" ? "sui" : "aptos";
    const canUse = native || (adapter === "sui" ? isSuiCoinType(contract) : isAptosAssetId(contract));
    return {
      adapter,
      native,
      contract,
      canReceive: canUse,
      canBalance: canUse,
      canSend: canUse,
      canStake: false,
      reason: canUse
        ? `Live ${chain.name} native and token send, receive, and balance are enabled through the ${chain.name} SDK.`
        : `${token.symbol} has no ${chain.name} token id in the bundled registry. Import the token id to send it.`
    };
  }
  if (SUPPORTED_TON_CHAINS.has(chain.name)) {
    return nativeCapability({ adapter: "ton", native, contract, chain, token, reason: "Live TON native send, receive, and balance are enabled through the TON SDK." });
  }
  if (SUPPORTED_ALGORAND_CHAINS.has(chain.name)) {
    const canUse = native || isAlgorandAssetId(contract);
    return {
      adapter: "algorand",
      native,
      contract,
      canReceive: canUse,
      canBalance: canUse,
      canSend: canUse,
      canStake: false,
      reason: canUse
        ? "Live ALGO native and ASA send, receive, and balance are enabled through Algorand SDK."
        : `${token.symbol} has no Algorand ASA id in the bundled registry. Import the ASA id to send it.`
    };
  }
  if (SUPPORTED_STELLAR_CHAINS.has(chain.name)) {
    const canUse = native || isStellarClassicAssetId(contract);
    return {
      adapter: "stellar",
      native,
      contract,
      canReceive: canUse,
      canBalance: canUse,
      canSend: canUse,
      canStake: false,
      reason: canUse
        ? "Live XLM native and Stellar asset send, receive, and balance are enabled through Stellar Horizon."
        : `${token.symbol} has no Stellar issuer in the bundled registry. Import asset code/issuer to send it.`
    };
  }
  if (SUPPORTED_SUBSTRATE_CHAINS.has(chain.name)) {
    return nativeCapability({ adapter: "substrate", native, contract, chain, token, reason: `Live ${chain.name} native send, receive, and balance are enabled through the Substrate SDK.` });
  }
  if (SUPPORTED_STACKS_CHAINS.has(chain.name)) {
    return nativeCapability({ adapter: "stacks", native, contract, chain, token, reason: "Live STX native send, receive, and balance are enabled through the Stacks SDK." });
  }
  if (SUPPORTED_MULTIVERSX_CHAINS.has(chain.name)) {
    return nativeCapability({ adapter: "multiversx", native, contract, chain, token, reason: "Live EGLD native send, receive, and balance are enabled through the MultiversX SDK." });
  }
  if (SUPPORTED_NEO_CHAINS.has(chain.name)) {
    return nativeCapability({ adapter: "neo", native, contract, chain, token, reason: "Live NEO native send, receive, and balance are enabled through neon-js." });
  }
  return {
    adapter: "unsupported",
    native,
    contract,
    canReceive: false,
    canBalance: false,
    canSend: false,
    canStake: false,
    reason: `${chain.name} is listed, but InfinityX still needs a production signer/RPC/indexer adapter before real transactions can be enabled for this chain.`
  };
}

function nativeCapability({ adapter, native, contract, chain, token, reason }) {
  return {
    adapter,
    native,
    contract,
    canReceive: native,
    canBalance: native,
    canSend: native,
    canStake: false,
    reason: native ? reason : `${chain.name} SDK support is enabled for the native coin only. ${token?.symbol ?? "This token"} transfers need a token-standard adapter before they can be sent.`
  };
}

function isSuiCoinType(value) {
  return /^0x[a-fA-F0-9]+::[A-Za-z_][A-Za-z0-9_]*::[A-Za-z_][A-Za-z0-9_]*$/.test(String(value ?? "").trim());
}

function isAptosAssetId(value) {
  return /^0x[a-fA-F0-9]+(::[A-Za-z_][A-Za-z0-9_]*::[A-Za-z_][A-Za-z0-9_]*)?$/.test(String(value ?? "").trim());
}

function isAlgorandAssetId(value) {
  return /^\d+$/.test(String(value ?? "").trim());
}

function isStellarClassicAssetId(value) {
  return /^([A-Z0-9]{1,12}-)?G[A-Z2-7]{55}$/.test(String(value ?? "").trim());
}

export async function getAssetReceiveState({ password, chain, token }) {
  const capability = getAssetCapability({ chain, token });
  if (!capability.canReceive) throw new Error(capability.reason);
  if (capability.adapter === "solana") {
    if (capability.native) {
      const state = await getSolanaWalletState({ password, rpcUrl: chain.rpc });
      return {
        adapter: capability.adapter,
        address: state.address,
        balance: state.sol,
        symbol: chain.native,
        contract: "",
        status: "Live Solana native balance loaded."
      };
    }
    const state = await getSplTokenBalance({ password, mint: capability.contract, rpcUrl: chain.rpc });
    return {
      adapter: capability.adapter,
      address: state.address,
      tokenAccount: state.tokenAccount,
      balance: state.uiAmount,
      symbol: token.symbol,
      contract: capability.contract,
      status: "Live SPL token balance loaded."
    };
  }
  if (capability.adapter === "evm") {
    if (capability.native) {
      const state = await getEvmWalletState({ password, chain });
      return {
        adapter: capability.adapter,
        address: state.address,
        balance: state.native,
        symbol: chain.native,
        contract: "",
        status: `Live ${chain.name} native balance loaded.`
      };
    }
    const state = await getErc20TokenBalance({ password, chain, tokenAddress: capability.contract, decimals: token.decimals });
    return {
      adapter: capability.adapter,
      address: state.address,
      balance: state.uiAmount,
      symbol: token.symbol,
      contract: capability.contract,
      status: "Live ERC-20 token balance loaded."
    };
  }
  if (capability.adapter === "utxo") {
    const { getUtxoWalletState } = await import("./utxoWallet.js");
    const state = await getUtxoWalletState({ password, chain });
    return {
      adapter: capability.adapter,
      address: state.address,
      balance: state.balance,
      symbol: state.symbol,
      contract: "",
      status: `Live ${chain.name} UTXO balance loaded.`
    };
  }
  if (capability.adapter === "cosmos") {
    const { getCosmosWalletState } = await import("./cosmosWallet.js");
    const state = await getCosmosWalletState({
      password,
      chain,
      denom: capability.native ? undefined : capability.contract,
      decimals: token.decimals,
      symbol: capability.native ? undefined : token.symbol
    });
    return {
      adapter: capability.adapter,
      address: state.address,
      balance: state.balance,
      symbol: state.symbol,
      contract: state.denom,
      status: `Live ${chain.name} Cosmos balance loaded.`
    };
  }
  if (capability.adapter === "tron") {
    const { getTronWalletState, getTrc20TokenBalance } = await import("./tronWallet.js");
    if (capability.native) {
      const state = await getTronWalletState({ password, chain });
      return {
        adapter: capability.adapter,
        address: state.address,
        balance: state.balance,
        symbol: state.symbol,
        contract: "",
        status: "Live TRON native balance loaded."
      };
    }
    const state = await getTrc20TokenBalance({
      password,
      chain,
      tokenAddress: capability.contract,
      decimals: token.decimals,
      symbol: token.symbol
    });
    return {
      adapter: capability.adapter,
      address: state.address,
      balance: state.uiAmount,
      symbol: state.symbol,
      contract: capability.contract,
      status: "Live TRC-20 token balance loaded."
    };
  }
  if (capability.adapter === "xrpl") {
    const { getXrpWalletState, getXrplIssuedTokenBalance } = await import("./xrpWallet.js");
    if (capability.native) {
      const state = await getXrpWalletState({ password, chain });
      return {
        adapter: capability.adapter,
        address: state.address,
        balance: state.balance,
        symbol: state.symbol,
        contract: "",
        status: "Live XRP Ledger native balance loaded."
      };
    }
    const state = await getXrplIssuedTokenBalance({
      password,
      chain,
      tokenId: capability.contract,
      symbol: token.symbol
    });
    return {
      adapter: capability.adapter,
      address: state.address,
      balance: state.balance,
      symbol: state.symbol,
      contract: capability.contract,
      status: "Live XRP Ledger issued-token balance loaded."
    };
  }
  if (capability.adapter === "sui") {
    const { getSuiWalletState, getSuiTokenBalance } = await import("./moveWallet.js");
    const state = capability.native
      ? await getSuiWalletState({ password, chain })
      : await getSuiTokenBalance({ password, chain, coinType: capability.contract, decimals: token.decimals, symbol: token.symbol });
    return {
      ...nativeReceiveState(capability.adapter, state, chain, capability.native ? "Live Sui native balance loaded." : "Live Sui token balance loaded."),
      contract: capability.native ? "" : capability.contract
    };
  }
  if (capability.adapter === "aptos") {
    const { getAptosWalletState, getAptosTokenBalance } = await import("./moveWallet.js");
    const state = capability.native
      ? await getAptosWalletState({ password, chain })
      : await getAptosTokenBalance({ password, asset: capability.contract, decimals: token.decimals, symbol: token.symbol });
    return {
      ...nativeReceiveState(capability.adapter, state, chain, capability.native ? "Live Aptos native balance loaded." : "Live Aptos fungible asset balance loaded."),
      contract: capability.native ? "" : capability.contract
    };
  }
  if (capability.adapter === "ton") {
    const { getTonWalletState } = await import("./tonWallet.js");
    const state = await getTonWalletState({ password, chain });
    return nativeReceiveState(capability.adapter, state, chain, "Live TON native balance loaded.");
  }
  if (capability.adapter === "algorand") {
    const { getAlgorandWalletState, getAlgorandAssetBalance } = await import("./algorandWallet.js");
    const state = capability.native
      ? await getAlgorandWalletState({ password, chain })
      : await getAlgorandAssetBalance({ password, chain, assetId: capability.contract, decimals: token.decimals, symbol: token.symbol });
    return {
      ...nativeReceiveState(capability.adapter, state, chain, capability.native ? "Live Algorand native balance loaded." : "Live Algorand ASA balance loaded."),
      contract: capability.native ? "" : capability.contract
    };
  }
  if (capability.adapter === "stellar") {
    const { getStellarWalletState, getStellarAssetBalance } = await import("./stellarWallet.js");
    const state = capability.native
      ? await getStellarWalletState({ password, chain })
      : await getStellarAssetBalance({ password, chain, issuer: capability.contract, code: token.symbol });
    return {
      ...nativeReceiveState(capability.adapter, state, chain, capability.native ? "Live Stellar native balance loaded." : "Live Stellar asset balance loaded."),
      contract: capability.native ? "" : capability.contract
    };
  }
  if (capability.adapter === "substrate") {
    const { getSubstrateWalletState } = await import("./substrateWallet.js");
    const state = await getSubstrateWalletState({ password, chain });
    return nativeReceiveState(capability.adapter, state, chain, `Live ${chain.name} native balance loaded.`);
  }
  if (capability.adapter === "stacks") {
    const { getStacksWalletState } = await import("./stacksWallet.js");
    const state = await getStacksWalletState({ password, chain });
    return nativeReceiveState(capability.adapter, state, chain, "Live Stacks native balance loaded.");
  }
  if (capability.adapter === "multiversx") {
    const { getMultiversXWalletState } = await import("./multiversxWallet.js");
    const state = await getMultiversXWalletState({ password, chain });
    return nativeReceiveState(capability.adapter, state, chain, "Live MultiversX native balance loaded.");
  }
  if (capability.adapter === "neo") {
    const { getNeoWalletState } = await import("./neoWallet.js");
    const state = await getNeoWalletState({ password, chain });
    return nativeReceiveState(capability.adapter, state, chain, "Live NEO native balance loaded.");
  }
  throw new Error(capability.reason);
}

function nativeReceiveState(adapter, state, chain, status) {
  return {
    adapter,
    address: state.address,
    balance: state.balance,
    symbol: state.symbol ?? chain.native,
    contract: "",
    status
  };
}

export async function getReceiveAddressOnly({ password, chain }) {
  if (chain.kind === "SVM") {
    const state = await getSolanaWalletState({ password, rpcUrl: chain.rpc });
    return state.address;
  }
  if (chain.kind === "EVM" && isSupportedEvmChain(chain)) {
    return deriveEvmAddress({ password });
  }
  if ((chain.kind === "UTXO" || chain.kind === "UTXO/EVM") && SUPPORTED_UTXO_CHAINS.has(chain.name)) {
    const { getUtxoWalletState } = await import("./utxoWallet.js");
    const state = await getUtxoWalletState({ password, chain });
    return state.address;
  }
  if ((chain.kind === "Cosmos" || chain.kind === "Cosmos/EVM") && SUPPORTED_COSMOS_CHAINS.has(chain.name)) {
    const { getCosmosWalletState } = await import("./cosmosWallet.js");
    const state = await getCosmosWalletState({ password, chain });
    return state.address;
  }
  if (SUPPORTED_TRON_CHAINS.has(chain.name)) {
    const { deriveTronAddress } = await import("./tronWallet.js");
    return deriveTronAddress({ password });
  }
  if (SUPPORTED_XRP_CHAINS.has(chain.name)) {
    const { deriveXrpAddress } = await import("./xrpWallet.js");
    return deriveXrpAddress({ password });
  }
  if (chain.name === "Sui") {
    const { deriveSuiAddress } = await import("./moveWallet.js");
    return deriveSuiAddress({ password });
  }
  if (chain.name === "Aptos") {
    const { deriveAptosAddress } = await import("./moveWallet.js");
    return deriveAptosAddress({ password });
  }
  if (SUPPORTED_TON_CHAINS.has(chain.name)) {
    const { deriveTonAddress } = await import("./tonWallet.js");
    return deriveTonAddress({ password });
  }
  if (SUPPORTED_ALGORAND_CHAINS.has(chain.name)) {
    const { deriveAlgorandAddress } = await import("./algorandWallet.js");
    return deriveAlgorandAddress({ password });
  }
  if (SUPPORTED_STELLAR_CHAINS.has(chain.name)) {
    const { deriveStellarAddress } = await import("./stellarWallet.js");
    return deriveStellarAddress({ password });
  }
  if (SUPPORTED_SUBSTRATE_CHAINS.has(chain.name)) {
    const { deriveSubstrateAddress } = await import("./substrateWallet.js");
    return deriveSubstrateAddress({ password, chain });
  }
  if (SUPPORTED_STACKS_CHAINS.has(chain.name)) {
    const { deriveStacksAddress } = await import("./stacksWallet.js");
    return deriveStacksAddress({ password });
  }
  if (SUPPORTED_MULTIVERSX_CHAINS.has(chain.name)) {
    const { deriveMultiversXAddress } = await import("./multiversxWallet.js");
    return deriveMultiversXAddress({ password });
  }
  if (SUPPORTED_NEO_CHAINS.has(chain.name)) {
    const { deriveNeoAddress } = await import("./neoWallet.js");
    return deriveNeoAddress({ password });
  }
  throw new Error(`${chain.name} does not have a receive-address adapter yet.`);
}

export async function sendUniversalAsset({ password, chain, token, recipient, amount }) {
  const capability = getAssetCapability({ chain, token });
  if (!capability.canSend) throw new Error(capability.reason);
  if (capability.adapter === "solana") {
    const result = capability.native
      ? await sendSol({ password, to: recipient, amountSol: amount, rpcUrl: chain.rpc })
      : await sendSplToken({ password, to: recipient, amount, mint: capability.contract, rpcUrl: chain.rpc });
    return { ...result, network: chain.name, adapter: capability.adapter };
  }
  if (capability.adapter === "evm") {
    const result = capability.native
      ? await sendEvmNative({ password, chain, to: recipient, amount })
      : await sendErc20Token({ password, chain, tokenAddress: capability.contract, to: recipient, amount, decimals: token.decimals });
    return { ...result, network: chain.name, adapter: capability.adapter };
  }
  if (capability.adapter === "utxo") {
    const { sendUtxoNative } = await import("./utxoWallet.js");
    const result = await sendUtxoNative({ password, chain, to: recipient, amount });
    return { ...result, network: chain.name, adapter: capability.adapter };
  }
  if (capability.adapter === "cosmos") {
    const { sendCosmosNative } = await import("./cosmosWallet.js");
    const result = await sendCosmosNative({
      password,
      chain,
      to: recipient,
      amount,
      denom: capability.native ? undefined : capability.contract,
      decimals: token.decimals,
      symbol: capability.native ? undefined : token.symbol
    });
    return { ...result, network: chain.name, adapter: capability.adapter };
  }
  if (capability.adapter === "tron") {
    const { sendTronNative, sendTrc20Token } = await import("./tronWallet.js");
    const result = capability.native
      ? await sendTronNative({ password, chain, to: recipient, amount })
      : await sendTrc20Token({ password, chain, tokenAddress: capability.contract, to: recipient, amount, decimals: token.decimals });
    return { ...result, network: chain.name, adapter: capability.adapter };
  }
  if (capability.adapter === "xrpl") {
    const { sendXrpNative, sendXrplIssuedToken } = await import("./xrpWallet.js");
    const result = capability.native
      ? await sendXrpNative({ password, chain, to: recipient, amount })
      : await sendXrplIssuedToken({ password, chain, tokenId: capability.contract, to: recipient, amount });
    return { ...result, network: chain.name, adapter: capability.adapter };
  }
  if (capability.adapter === "sui") {
    const { sendSuiNative, sendSuiToken } = await import("./moveWallet.js");
    const result = capability.native
      ? await sendSuiNative({ password, chain, to: recipient, amount })
      : await sendSuiToken({ password, chain, to: recipient, amount, coinType: capability.contract, decimals: token.decimals });
    return { ...result, network: chain.name, adapter: capability.adapter };
  }
  if (capability.adapter === "aptos") {
    const { sendAptosNative, sendAptosToken } = await import("./moveWallet.js");
    const result = capability.native
      ? await sendAptosNative({ password, chain, to: recipient, amount })
      : await sendAptosToken({ password, chain, to: recipient, amount, asset: capability.contract, decimals: token.decimals });
    return { ...result, network: chain.name, adapter: capability.adapter };
  }
  if (capability.adapter === "ton") {
    const { sendTonNative } = await import("./tonWallet.js");
    const result = await sendTonNative({ password, chain, to: recipient, amount });
    return { ...result, network: chain.name, adapter: capability.adapter };
  }
  if (capability.adapter === "algorand") {
    const { sendAlgorandNative, sendAlgorandAsset } = await import("./algorandWallet.js");
    const result = capability.native
      ? await sendAlgorandNative({ password, chain, to: recipient, amount })
      : await sendAlgorandAsset({ password, chain, to: recipient, amount, assetId: capability.contract, decimals: token.decimals });
    return { ...result, network: chain.name, adapter: capability.adapter };
  }
  if (capability.adapter === "stellar") {
    const { sendStellarNative, sendStellarAsset } = await import("./stellarWallet.js");
    const result = capability.native
      ? await sendStellarNative({ password, chain, to: recipient, amount })
      : await sendStellarAsset({ password, chain, to: recipient, amount, issuer: capability.contract, code: token.symbol });
    return { ...result, network: chain.name, adapter: capability.adapter };
  }
  if (capability.adapter === "substrate") {
    const { sendSubstrateNative } = await import("./substrateWallet.js");
    const result = await sendSubstrateNative({ password, chain, to: recipient, amount });
    return { ...result, network: chain.name, adapter: capability.adapter };
  }
  if (capability.adapter === "stacks") {
    const { sendStacksNative } = await import("./stacksWallet.js");
    const result = await sendStacksNative({ password, chain, to: recipient, amount });
    return { ...result, network: chain.name, adapter: capability.adapter };
  }
  if (capability.adapter === "multiversx") {
    const { sendMultiversXNative } = await import("./multiversxWallet.js");
    const result = await sendMultiversXNative({ password, chain, to: recipient, amount });
    return { ...result, network: chain.name, adapter: capability.adapter };
  }
  if (capability.adapter === "neo") {
    const { sendNeoNative } = await import("./neoWallet.js");
    const result = await sendNeoNative({ password, chain, to: recipient, amount });
    return { ...result, network: chain.name, adapter: capability.adapter };
  }
  throw new Error(capability.reason);
}

function normalizeChain(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function canonicalChain(value) {
  const normalized = normalizeChain(value);
  return CHAIN_ALIASES[normalized] ?? normalized;
}
