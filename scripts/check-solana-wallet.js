import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Connection, Keypair, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";

const network = getArg("--network") ?? "devnet";
const walletPath = resolve(getArg("--wallet") ?? "secrets/infinityx-token-authority.json");
const keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(walletPath, "utf8"))));
const connection = new Connection(clusterApiUrl(network), "confirmed");
const lamports = await connection.getBalance(keypair.publicKey);

console.log(`Network: ${network}`);
console.log(`Wallet: ${keypair.publicKey.toBase58()}`);
console.log(`Balance: ${lamports / LAMPORTS_PER_SOL} SOL`);

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}
