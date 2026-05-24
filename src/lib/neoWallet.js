import * as Neon from "@cityofzion/neon-js";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeedSync } from "@scure/bip39";
import { unlockVault } from "./vault.js";

const DEFAULT_RPC = "https://mainnet1.neo.coz.io:443";

export async function getNeoWalletState({ password, chain, accountIndex = 0 }) {
  const account = await deriveNeoAccount({ password, accountIndex });
  const neo = await neoContract({ chain, account });
  const balance = await neo.balanceOf(account.address);
  return {
    address: account.address,
    balance: String(balance),
    raw: String(balance),
    symbol: "NEO"
  };
}

export async function sendNeoNative({ password, chain, to, amount, accountIndex = 0 }) {
  const account = await deriveNeoAccount({ password, accountIndex });
  if (!Neon.wallet.isAddress(to.trim())) throw new Error("Invalid NEO recipient address.");
  const value = Number(amount);
  if (!Number.isInteger(value) || value <= 0) throw new Error("NEO transfers must be positive whole numbers.");
  const neo = await neoContract({ chain, account });
  const hash = await neo.transfer(account.address, to.trim(), value);
  return { hash, explorer: `https://dora.coz.io/transaction/neo3/mainnet/${hash}` };
}

export async function deriveNeoAddress({ password, accountIndex = 0 }) {
  const account = await deriveNeoAccount({ password, accountIndex });
  return account.address;
}

async function deriveNeoAccount({ password, accountIndex }) {
  const vault = await unlockVault(password);
  if (!vault.phrase) throw new Error("Vault does not contain a mnemonic phrase.");
  const seed = mnemonicToSeedSync(vault.phrase.trim().toLowerCase());
  const child = HDKey.fromMasterSeed(seed).derive(`m/44'/888'/0'/0/${accountIndex}`);
  if (!child.privateKey) throw new Error("Unable to derive NEO private key.");
  return new Neon.wallet.Account(Buffer.from(child.privateKey).toString("hex"));
}

async function neoContract({ chain, account }) {
  const rpcAddress = chain?.rpc?.startsWith("http") ? chain.rpc : DEFAULT_RPC;
  const client = new Neon.rpc.RPCClient(rpcAddress);
  const version = await client.getVersion();
  const config = {
    account,
    rpcAddress,
    networkMagic: version.protocol.network,
    blocksTillExpiry: 100
  };
  return new Neon.experimental.nep17.NEOContract(config);
}
