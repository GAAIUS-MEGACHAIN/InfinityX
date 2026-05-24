import { Account, Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { unlockVault } from "./vault.js";

const SUI_DECIMALS = 9;
const APT_DECIMALS = 8;

export async function getSuiWalletState({ password, chain, accountIndex = 0 }) {
  const { keypair, address } = await deriveSuiAccount({ password, accountIndex });
  const client = suiClient(chain);
  const balance = await client.getBalance({ owner: address });
  return {
    address,
    balance: formatUnits(balance.totalBalance ?? 0, SUI_DECIMALS),
    raw: String(balance.totalBalance ?? 0),
    symbol: "SUI",
    publicKey: keypair.getPublicKey().toSuiPublicKey()
  };
}

export async function sendSuiNative({ password, chain, to, amount, accountIndex = 0 }) {
  assertSuiAddress(to);
  const { keypair } = await deriveSuiAccount({ password, accountIndex });
  const client = suiClient(chain);
  const tx = new Transaction();
  const amountMist = parseUnits(amount, SUI_DECIMALS);
  tx.transferObjects([tx.splitCoins(tx.gas, [amountMist])], to.trim());
  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true }
  });
  return {
    hash: result.digest,
    explorer: explorerTxUrl(chain, result.digest),
    status: result.effects?.status?.status ?? "submitted"
  };
}

export async function getAptosWalletState({ password, accountIndex = 0 }) {
  const account = await deriveAptosAccount({ password, accountIndex });
  const aptos = aptosClient();
  const raw = await aptos.getAccountAPTAmount({ accountAddress: account.accountAddress });
  return {
    address: account.accountAddress.toString(),
    balance: formatUnits(raw, APT_DECIMALS),
    raw: String(raw),
    symbol: "APT"
  };
}

export async function sendAptosNative({ password, to, amount, accountIndex = 0 }) {
  const account = await deriveAptosAccount({ password, accountIndex });
  const aptos = aptosClient();
  const amountOctas = parseUnits(amount, APT_DECIMALS);
  const transaction = await aptos.transferCoinTransaction({
    sender: account.accountAddress,
    recipient: to.trim(),
    amount: amountOctas
  });
  const pending = await aptos.signAndSubmitTransaction({ signer: account, transaction });
  return {
    hash: pending.hash,
    explorer: `https://aptoscan.com/transaction/${pending.hash}`,
    status: pending.type ?? "pending"
  };
}

export async function deriveSuiAddress({ password, accountIndex = 0 }) {
  const { address } = await deriveSuiAccount({ password, accountIndex });
  return address;
}

export async function deriveAptosAddress({ password, accountIndex = 0 }) {
  const account = await deriveAptosAccount({ password, accountIndex });
  return account.accountAddress.toString();
}

async function deriveSuiAccount({ password, accountIndex }) {
  const vault = await unlockVault(password);
  if (!vault.phrase) throw new Error("Vault does not contain a mnemonic phrase.");
  const path = `m/44'/784'/0'/0'/${accountIndex}'`;
  const keypair = Ed25519Keypair.deriveKeypair(vault.phrase.trim().toLowerCase(), path);
  return { keypair, address: keypair.toSuiAddress() };
}

async function deriveAptosAccount({ password, accountIndex }) {
  const vault = await unlockVault(password);
  if (!vault.phrase) throw new Error("Vault does not contain a mnemonic phrase.");
  return Account.fromDerivationPath({
    mnemonic: vault.phrase.trim().toLowerCase(),
    path: `m/44'/637'/${accountIndex}'/0'/0'`
  });
}

function suiClient(chain) {
  return new SuiJsonRpcClient({
    url: chain?.rpc?.startsWith("http") ? chain.rpc : getJsonRpcFullnodeUrl("mainnet"),
    network: "mainnet"
  });
}

function aptosClient() {
  return new Aptos(new AptosConfig({ network: Network.MAINNET }));
}

function assertSuiAddress(value) {
  if (!/^0x[a-fA-F0-9]{64}$/.test(String(value ?? "").trim())) {
    throw new Error("Invalid Sui recipient address.");
  }
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

function explorerTxUrl(chain, digest) {
  if (chain?.explorer?.startsWith("http")) return `${chain.explorer.replace(/\/$/, "")}/tx/${digest}`;
  return `https://suiscan.xyz/mainnet/tx/${digest}`;
}
