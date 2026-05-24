import { Account, Address, ApiNetworkProvider, TransferTransactionsFactory } from "@multiversx/sdk-core";
import { unlockVault } from "./vault.js";

const DECIMALS = 18;
const DEFAULT_API = "https://api.multiversx.com";
const FACTORY_CONFIG = {
  chainID: "1",
  minGasLimit: 50000n,
  gasLimitPerByte: 1500n,
  gasLimitESDTTransfer: 200000n,
  gasLimitESDTNFTTransfer: 200000n,
  gasLimitMultiESDTNFTTransfer: 200000n
};

export async function getMultiversXWalletState({ password, chain, accountIndex = 0 }) {
  const account = await deriveMultiversXAccount({ password, accountIndex });
  const provider = mxProvider(chain);
  const networkAccount = await provider.getAccount(account.address);
  const raw = BigInt(networkAccount.balance ?? 0);
  return {
    address: account.address.toString(),
    balance: formatUnits(raw, DECIMALS),
    raw: raw.toString(),
    symbol: "EGLD"
  };
}

export async function sendMultiversXNative({ password, chain, to, amount, accountIndex = 0 }) {
  const account = await deriveMultiversXAccount({ password, accountIndex });
  const provider = mxProvider(chain);
  const networkAccount = await provider.getAccount(account.address);
  const factory = new TransferTransactionsFactory({ config: FACTORY_CONFIG });
  const tx = await factory.createTransactionForNativeTokenTransfer(account.address, {
    receiver: Address.newFromBech32(to.trim()),
    nativeAmount: parseUnits(amount, DECIMALS)
  });
  tx.nonce = BigInt(networkAccount.nonce ?? 0);
  tx.signature = await account.signTransaction(tx);
  const hash = await provider.sendTransaction(tx);
  return { hash, explorer: `https://explorer.multiversx.com/transactions/${hash}` };
}

export async function deriveMultiversXAddress({ password, accountIndex = 0 }) {
  const account = await deriveMultiversXAccount({ password, accountIndex });
  return account.address.toString();
}

async function deriveMultiversXAccount({ password, accountIndex }) {
  const vault = await unlockVault(password);
  if (!vault.phrase) throw new Error("Vault does not contain a mnemonic phrase.");
  return Account.newFromMnemonic(vault.phrase.trim().toLowerCase(), accountIndex, "erd");
}

function mxProvider(chain) {
  return new ApiNetworkProvider(chain?.rpc?.startsWith("http") ? chain.rpc : DEFAULT_API, { clientName: "InfinityX" });
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
