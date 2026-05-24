import { internal, toNano, TonClient, WalletContractV4 } from "@ton/ton";
import { keyPairFromSeed } from "@ton/crypto";
import { mnemonicToSeedSync } from "@scure/bip39";
import { unlockVault } from "./vault.js";

const DECIMALS = 9;
const DEFAULT_RPC = "https://toncenter.com/api/v2/jsonRPC";

export async function getTonWalletState({ password, chain, accountIndex = 0 }) {
  const { wallet } = await deriveTonAccount({ password, accountIndex });
  const client = tonClient(chain);
  const raw = await client.getBalance(wallet.address);
  return {
    address: wallet.address.toString({ bounceable: false }),
    bounceableAddress: wallet.address.toString({ bounceable: true }),
    balance: formatUnits(raw, DECIMALS),
    raw: raw.toString(),
    symbol: "TON"
  };
}

export async function sendTonNative({ password, chain, to, amount, accountIndex = 0 }) {
  const { wallet, keyPair } = await deriveTonAccount({ password, accountIndex });
  const client = tonClient(chain);
  const opened = client.open(wallet);
  const seqno = await opened.getSeqno();
  await opened.sendTransfer({
    secretKey: keyPair.secretKey,
    seqno,
    messages: [internal({ to: to.trim(), value: toNano(String(amount)) })]
  });
  return {
    hash: `${wallet.address.toString({ bounceable: false })}:${seqno}`,
    explorer: `https://tonscan.org/address/${wallet.address.toString({ bounceable: false })}`,
    status: "submitted"
  };
}

export async function deriveTonAddress({ password, accountIndex = 0 }) {
  const { wallet } = await deriveTonAccount({ password, accountIndex });
  return wallet.address.toString({ bounceable: false });
}

async function deriveTonAccount({ password, accountIndex }) {
  const vault = await unlockVault(password);
  if (!vault.phrase) throw new Error("Vault does not contain a mnemonic phrase.");
  const seed = mnemonicToSeedSync(vault.phrase.trim().toLowerCase(), `ton-${accountIndex}`).slice(0, 32);
  const keyPair = await keyPairFromSeed(Buffer.from(seed));
  const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
  return { wallet, keyPair };
}

function tonClient(chain) {
  return new TonClient({ endpoint: chain?.rpc?.startsWith("http") ? chain.rpc : DEFAULT_RPC });
}

function formatUnits(value, decimals) {
  const raw = BigInt(value);
  const base = 10n ** BigInt(decimals);
  const whole = raw / base;
  const fraction = raw % base;
  if (fraction === 0n) return whole.toString();
  return `${whole}.${fraction.toString().padStart(decimals, "0").replace(/0+$/, "")}`;
}
