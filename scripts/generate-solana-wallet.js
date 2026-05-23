import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Keypair } from "@solana/web3.js";

const walletPath = resolve("secrets/infinityx-token-authority.json");

if (existsSync(walletPath)) {
  console.log(`Wallet already exists: ${walletPath}`);
  console.log("I will not overwrite it.");
  process.exit(0);
}

const keypair = Keypair.generate();
mkdirSync(dirname(walletPath), { recursive: true });
writeFileSync(walletPath, JSON.stringify(Array.from(keypair.secretKey)), { flag: "wx" });

console.log("Created local Solana token authority wallet.");
console.log(`Public address: ${keypair.publicKey.toBase58()}`);
console.log(`Secret key file: ${walletPath}`);
console.log("");
console.log("Do not share the secret key file or seed material.");
console.log("For mainnet, fund only the public address with enough SOL for token creation.");
