import { ApiPromise, WsProvider } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { unlockVault } from "./vault.js";

const SUBSTRATE_CHAINS = {
  Polkadot: {
    symbol: "DOT",
    decimals: 10,
    ss58: 0,
    rpc: "wss://rpc.polkadot.io",
    explorer: "https://polkadot.subscan.io/extrinsic"
  },
  Kusama: {
    symbol: "KSM",
    decimals: 12,
    ss58: 2,
    rpc: "wss://kusama-rpc.polkadot.io",
    explorer: "https://kusama.subscan.io/extrinsic"
  },
  Bittensor: {
    symbol: "TAO",
    decimals: 9,
    ss58: 42,
    rpc: "wss://entrypoint-finney.opentensor.ai:443",
    explorer: "https://taostats.io/extrinsic"
  }
};

export function isSupportedSubstrateChain(chain) {
  return Boolean(SUBSTRATE_CHAINS[chain?.name]);
}

export async function getSubstrateWalletState({ password, chain, accountIndex = 0 }) {
  const config = substrateConfig(chain);
  const pair = await deriveSubstratePair({ password, chain, accountIndex });
  const api = await substrateApi(chain);
  try {
    const { data } = await api.query.system.account(pair.address);
    return {
      address: pair.address,
      balance: formatUnits(data.free.toBigInt(), config.decimals),
      raw: data.free.toString(),
      symbol: config.symbol
    };
  } finally {
    await api.disconnect();
  }
}

export async function sendSubstrateNative({ password, chain, to, amount, accountIndex = 0 }) {
  const config = substrateConfig(chain);
  const pair = await deriveSubstratePair({ password, chain, accountIndex });
  const api = await substrateApi(chain);
  try {
    const value = parseUnits(amount, config.decimals);
    const tx = api.tx.balances.transferKeepAlive(to.trim(), value);
    const hash = await new Promise((resolve, reject) => {
      let unsubscribe = null;
      tx.signAndSend(pair, (result) => {
        if (result.dispatchError) {
          unsubscribe?.();
          reject(new Error(result.dispatchError.toString()));
          return;
        }
        if (result.status.isInBlock || result.status.isFinalized) {
          unsubscribe?.();
          resolve(tx.hash.toHex());
        }
      }).then((unsub) => { unsubscribe = unsub; }).catch(reject);
    });
    return { hash, explorer: `${config.explorer}/${hash}` };
  } finally {
    await api.disconnect();
  }
}

export async function deriveSubstrateAddress({ password, chain, accountIndex = 0 }) {
  const pair = await deriveSubstratePair({ password, chain, accountIndex });
  return pair.address;
}

async function deriveSubstratePair({ password, chain, accountIndex }) {
  const config = substrateConfig(chain);
  const vault = await unlockVault(password);
  if (!vault.phrase) throw new Error("Vault does not contain a mnemonic phrase.");
  await cryptoWaitReady();
  const keyring = new Keyring({ type: "sr25519", ss58Format: config.ss58 });
  return keyring.addFromUri(`${vault.phrase.trim().toLowerCase()}//${accountIndex}`);
}

async function substrateApi(chain) {
  const config = substrateConfig(chain);
  const provider = new WsProvider(chain?.rpc?.startsWith("ws") ? chain.rpc : config.rpc, false);
  await provider.connect();
  return ApiPromise.create({ provider, noInitWarn: true });
}

function substrateConfig(chain) {
  const config = SUBSTRATE_CHAINS[chain?.name];
  if (!config) throw new Error(`${chain?.name ?? "This chain"} is not wired to the Substrate adapter.`);
  return config;
}

function parseUnits(value, decimals) {
  const text = String(value ?? "").trim();
  if (!/^\d+(\.\d+)?$/.test(text)) throw new Error("Enter a valid amount.");
  const [whole, fraction = ""] = text.split(".");
  if (fraction.length > decimals) throw new Error(`Amount supports only ${decimals} decimals.`);
  return BigInt(whole) * (10n ** BigInt(decimals)) + BigInt(fraction.padEnd(decimals, "0") || "0");
}

function formatUnits(value, decimals) {
  const raw = BigInt(value);
  const base = 10n ** BigInt(decimals);
  const whole = raw / base;
  const fraction = raw % base;
  if (fraction === 0n) return whole.toString();
  return `${whole}.${fraction.toString().padStart(decimals, "0").replace(/0+$/, "")}`;
}
