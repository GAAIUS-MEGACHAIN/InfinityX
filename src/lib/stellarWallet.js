import { mnemonicToSeedSync } from "@scure/bip39";
import { derivePath } from "ed25519-hd-key";
import * as StellarSdk from "@stellar/stellar-sdk";
import { unlockVault } from "./vault.js";

const DECIMALS = 7;
const DEFAULT_HORIZON = "https://horizon.stellar.org";

export async function getStellarWalletState({ password, chain, accountIndex = 0 }) {
  const keypair = await deriveStellarKeypair({ password, accountIndex });
  const server = horizon(chain);
  let balance = "0";
  try {
    const account = await server.loadAccount(keypair.publicKey());
    balance = account.balances.find((item) => item.asset_type === "native")?.balance ?? "0";
  } catch (error) {
    if (error?.response?.status !== 404) throw error;
  }
  return {
    address: keypair.publicKey(),
    balance,
    raw: parseUnits(balance, DECIMALS).toString(),
    symbol: "XLM"
  };
}

export async function sendStellarNative({ password, chain, to, amount, accountIndex = 0 }) {
  if (!StellarSdk.StrKey.isValidEd25519PublicKey(to.trim())) throw new Error("Invalid Stellar recipient address.");
  const keypair = await deriveStellarKeypair({ password, accountIndex });
  const server = horizon(chain);
  const [source, fee] = await Promise.all([
    server.loadAccount(keypair.publicKey()),
    server.fetchBaseFee()
  ]);
  const tx = new StellarSdk.TransactionBuilder(source, {
    fee: String(fee),
    networkPassphrase: StellarSdk.Networks.PUBLIC
  })
    .addOperation(StellarSdk.Operation.payment({
      destination: to.trim(),
      asset: StellarSdk.Asset.native(),
      amount: String(amount)
    }))
    .setTimeout(60)
    .build();
  tx.sign(keypair);
  const result = await server.submitTransaction(tx);
  return { hash: result.hash, explorer: `https://stellar.expert/explorer/public/tx/${result.hash}` };
}

export async function deriveStellarAddress({ password, accountIndex = 0 }) {
  const keypair = await deriveStellarKeypair({ password, accountIndex });
  return keypair.publicKey();
}

async function deriveStellarKeypair({ password, accountIndex }) {
  const vault = await unlockVault(password);
  if (!vault.phrase) throw new Error("Vault does not contain a mnemonic phrase.");
  const seedHex = Buffer.from(mnemonicToSeedSync(vault.phrase.trim().toLowerCase())).toString("hex");
  const { key } = derivePath(`m/44'/148'/${accountIndex}'`, seedHex);
  return StellarSdk.Keypair.fromRawEd25519Seed(Buffer.from(key));
}

function horizon(chain) {
  return new StellarSdk.Horizon.Server(chain?.rpc?.startsWith("http") ? chain.rpc : DEFAULT_HORIZON);
}

function parseUnits(value, decimals) {
  const text = String(value ?? "").trim();
  if (!/^\d+(\.\d+)?$/.test(text)) throw new Error("Enter a valid amount.");
  const [whole, fraction = ""] = text.split(".");
  if (fraction.length > decimals) throw new Error(`Amount supports only ${decimals} decimals.`);
  return BigInt(whole) * (10n ** BigInt(decimals)) + BigInt(fraction.padEnd(decimals, "0") || "0");
}
