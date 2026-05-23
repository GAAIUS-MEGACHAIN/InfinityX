import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Connection, Keypair, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";

const walletPath = resolve(getArg("--wallet") ?? "secrets/infinityx-token-authority.json");
const amountSol = Number(getArg("--amount") ?? "2");
const keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(walletPath, "utf8"))));
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const signature = await connection.requestAirdrop(
  keypair.publicKey,
  Math.round(amountSol * LAMPORTS_PER_SOL)
);
const latest = await connection.getLatestBlockhash();
await connection.confirmTransaction({ signature, ...latest }, "confirmed");

console.log(`Airdropped ${amountSol} devnet SOL`);
console.log(`Wallet: ${keypair.publicKey.toBase58()}`);
console.log(`Signature: ${signature}`);

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}
