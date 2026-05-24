import algosdk from "algosdk";
import { mnemonicToSeedSync } from "@scure/bip39";
import { derivePath } from "ed25519-hd-key";
import nacl from "tweetnacl";
import { unlockVault } from "./vault.js";

const DECIMALS = 6;
const DEFAULT_ALGOD = "https://mainnet-api.algonode.cloud";

export async function getAlgorandWalletState({ password, chain, accountIndex = 0 }) {
  const account = await deriveAlgorandAccount({ password, accountIndex });
  const algod = algodClient(chain);
  let info;
  try {
    info = await algod.accountInformation(account.address).do();
  } catch (error) {
    if (!String(error?.message ?? "").includes("account not found")) throw error;
    info = { amount: 0n };
  }
  const raw = BigInt(info.amount ?? 0);
  return {
    address: account.address,
    balance: formatUnits(raw, DECIMALS),
    raw: raw.toString(),
    symbol: "ALGO"
  };
}

export async function getAlgorandAssetBalance({ password, chain, assetId, decimals = DECIMALS, symbol = "ASA", accountIndex = 0 }) {
  const account = await deriveAlgorandAccount({ password, accountIndex });
  const algod = algodClient(chain);
  let info;
  try {
    info = await algod.accountInformation(account.address).do();
  } catch (error) {
    if (!String(error?.message ?? "").includes("account not found")) throw error;
    info = { assets: [] };
  }
  const id = Number(assetId);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid Algorand ASA id.");
  const holding = (info.assets ?? []).find((asset) => Number(asset["asset-id"] ?? asset.assetId) === id);
  const raw = BigInt(holding?.amount ?? 0);
  return {
    address: account.address,
    balance: formatUnits(raw, decimals),
    raw: raw.toString(),
    symbol,
    assetId: String(id)
  };
}

export async function sendAlgorandNative({ password, chain, to, amount, accountIndex = 0 }) {
  const account = await deriveAlgorandAccount({ password, accountIndex });
  if (!algosdk.isValidAddress(to.trim())) throw new Error("Invalid Algorand recipient address.");
  const algod = algodClient(chain);
  const suggestedParams = await algod.getTransactionParams().do();
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: account.address,
    receiver: to.trim(),
    amount: parseUnits(amount, DECIMALS),
    suggestedParams
  });
  const signed = txn.signTxn(account.secretKey);
  const submitted = await algod.sendRawTransaction(signed).do();
  const hash = submitted.txid ?? txn.txID();
  return { hash, explorer: `https://allo.info/tx/${hash}` };
}

export async function sendAlgorandAsset({ password, chain, to, amount, assetId, decimals = DECIMALS, accountIndex = 0 }) {
  const account = await deriveAlgorandAccount({ password, accountIndex });
  if (!algosdk.isValidAddress(to.trim())) throw new Error("Invalid Algorand recipient address.");
  const id = Number(assetId);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid Algorand ASA id.");
  const algod = algodClient(chain);
  const suggestedParams = await algod.getTransactionParams().do();
  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender: account.address,
    receiver: to.trim(),
    assetIndex: id,
    amount: parseUnits(amount, decimals),
    suggestedParams
  });
  const signed = txn.signTxn(account.secretKey);
  const submitted = await algod.sendRawTransaction(signed).do();
  const hash = submitted.txid ?? txn.txID();
  return { hash, explorer: `https://allo.info/tx/${hash}` };
}

export async function deriveAlgorandAddress({ password, accountIndex = 0 }) {
  const account = await deriveAlgorandAccount({ password, accountIndex });
  return account.address;
}

async function deriveAlgorandAccount({ password, accountIndex }) {
  const vault = await unlockVault(password);
  if (!vault.phrase) throw new Error("Vault does not contain a mnemonic phrase.");
  const seedHex = Buffer.from(mnemonicToSeedSync(vault.phrase.trim().toLowerCase())).toString("hex");
  const { key } = derivePath(`m/44'/283'/${accountIndex}'/0'/0'`, seedHex);
  const pair = nacl.sign.keyPair.fromSeed(new Uint8Array(key));
  return {
    address: algosdk.encodeAddress(pair.publicKey),
    secretKey: pair.secretKey,
    publicKey: pair.publicKey
  };
}

function algodClient(chain) {
  return new algosdk.Algodv2("", chain?.rpc?.startsWith("http") ? chain.rpc : DEFAULT_ALGOD, "");
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
