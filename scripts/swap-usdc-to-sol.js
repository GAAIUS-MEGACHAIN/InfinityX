import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  Connection,
  Keypair,
  VersionedTransaction,
  clusterApiUrl
} from "@solana/web3.js";

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL_MINT = "So11111111111111111111111111111111111111112";
const amountUsdc = Number(getArg("--amount") ?? "1");
const amount = Math.round(amountUsdc * 1_000_000);
const walletPath = resolve(getArg("--wallet") ?? "secrets/infinityx-token-authority.json");
const keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(walletPath, "utf8"))));
const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

const quoteUrl = new URL("https://api.jup.ag/swap/v1/quote");
quoteUrl.searchParams.set("inputMint", USDC_MINT);
quoteUrl.searchParams.set("outputMint", SOL_MINT);
quoteUrl.searchParams.set("amount", String(amount));
quoteUrl.searchParams.set("slippageBps", "100");

const quote = await fetchJson(quoteUrl);

const swapResponse = await fetchJson("https://api.jup.ag/swap/v1/swap", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    quoteResponse: quote,
    userPublicKey: keypair.publicKey.toBase58(),
    wrapAndUnwrapSol: true,
    dynamicComputeUnitLimit: true,
    prioritizationFeeLamports: {
      priorityLevelWithMaxLamports: {
        maxLamports: 100000,
        priorityLevel: "medium"
      }
    }
  })
});

if (!swapResponse.swapTransaction) {
  throw new Error(`Jupiter did not return a swap transaction: ${JSON.stringify(swapResponse)}`);
}

const transaction = VersionedTransaction.deserialize(Buffer.from(swapResponse.swapTransaction, "base64"));
transaction.sign([keypair]);

const signature = await connection.sendRawTransaction(transaction.serialize(), {
  skipPreflight: false,
  maxRetries: 3
});
await connection.confirmTransaction(signature, "confirmed");

console.log(JSON.stringify({
  wallet: keypair.publicKey.toBase58(),
  input: `${amountUsdc} USDC`,
  expectedOutputLamports: quote.outAmount,
  signature
}, null, 2));

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }
  return JSON.parse(text);
}

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}
