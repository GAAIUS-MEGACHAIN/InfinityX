import { broadcastTransaction, getAddressFromPrivateKey, makeSTXTokenTransfer } from "@stacks/transactions";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeedSync } from "@scure/bip39";
import { unlockVault } from "./vault.js";

const DECIMALS = 6;
const DEFAULT_API = "https://api.mainnet.hiro.so";

export async function getStacksWalletState({ password, chain, accountIndex = 0 }) {
  const account = await deriveStacksAccount({ password, accountIndex });
  const response = await fetch(`${apiBase(chain)}/extended/v1/address/${account.address}/balances`);
  if (!response.ok) throw new Error(`Stacks balance API error: ${response.status}`);
  const payload = await response.json();
  const raw = BigInt(payload.stx?.balance ?? 0);
  return {
    address: account.address,
    balance: formatUnits(raw, DECIMALS),
    raw: raw.toString(),
    symbol: "STX"
  };
}

export async function sendStacksNative({ password, chain, to, amount, accountIndex = 0 }) {
  const account = await deriveStacksAccount({ password, accountIndex });
  const tx = await makeSTXTokenTransfer({
    recipient: to.trim(),
    amount: parseUnits(amount, DECIMALS),
    senderKey: account.privateKey,
    network: "mainnet"
  });
  const result = await broadcastTransaction({ transaction: tx, network: "mainnet" });
  const hash = result.txid ?? result.reason_data?.txid ?? tx.txid();
  if (result.error) throw new Error(result.reason ?? "Stacks broadcast failed.");
  return { hash, explorer: `https://explorer.hiro.so/txid/${hash}?chain=mainnet` };
}

export async function deriveStacksAddress({ password, accountIndex = 0 }) {
  const account = await deriveStacksAccount({ password, accountIndex });
  return account.address;
}

async function deriveStacksAccount({ password, accountIndex }) {
  const vault = await unlockVault(password);
  if (!vault.phrase) throw new Error("Vault does not contain a mnemonic phrase.");
  const seed = mnemonicToSeedSync(vault.phrase.trim().toLowerCase());
  const child = HDKey.fromMasterSeed(seed).derive(`m/44'/5757'/0'/0/${accountIndex}`);
  if (!child.privateKey) throw new Error("Unable to derive Stacks private key.");
  const privateKey = `${Buffer.from(child.privateKey).toString("hex")}01`;
  return {
    privateKey,
    address: getAddressFromPrivateKey(privateKey, "mainnet")
  };
}

function apiBase(chain) {
  return chain?.rpc?.startsWith("http") ? chain.rpc.replace(/\/$/, "") : DEFAULT_API;
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
