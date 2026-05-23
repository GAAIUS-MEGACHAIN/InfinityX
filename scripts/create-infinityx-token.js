import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import {
  AuthorityType,
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  getAssociatedTokenAddressSync,
  getMintLen
} from "@solana/spl-token";
import { createInitializeInstruction, pack } from "@solana/spl-token-metadata";

const network = getArg("--network") ?? "devnet";
const walletPath = resolve(getArg("--wallet") ?? "secrets/infinityx-token-authority.json");
const configPath = resolve(getArg("--config") ?? "token.config.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));

if (network === "mainnet-beta" && process.env.CONFIRM_MAINNET !== "true") {
  throw new Error("Mainnet is locked. Run with CONFIRM_MAINNET=true after you verify token.config.json.");
}

const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(walletPath, "utf8"))));
const mint = Keypair.generate();
const connection = new Connection(clusterApiUrl(network), "confirmed");
const recipientOwner = config.recipientOwner ? new PublicKey(config.recipientOwner) : payer.publicKey;

const metadata = {
  mint: mint.publicKey,
  name: config.name,
  symbol: config.symbol,
  uri: config.metadataUri,
  updateAuthority: payer.publicKey,
  additionalMetadata: [["description", config.description]]
};

const metadataLen = pack(metadata).length;
const mintLen = getMintLen(
  [ExtensionType.MetadataPointer],
  { [ExtensionType.TokenMetadata]: metadataLen }
);
const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

const createMintTx = new Transaction().add(
  SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: mint.publicKey,
    space: mintLen,
    lamports,
    programId: TOKEN_2022_PROGRAM_ID
  }),
  createInitializeMetadataPointerInstruction(
    mint.publicKey,
    payer.publicKey,
    mint.publicKey,
    TOKEN_2022_PROGRAM_ID
  ),
  createInitializeMintInstruction(
    mint.publicKey,
    Number(config.decimals),
    payer.publicKey,
    config.revokeFreezeAuthority ? null : payer.publicKey,
    TOKEN_2022_PROGRAM_ID
  ),
  createInitializeInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    metadata: mint.publicKey,
    updateAuthority: payer.publicKey,
    mint: mint.publicKey,
    mintAuthority: payer.publicKey,
    name: config.name,
    symbol: config.symbol,
    uri: config.metadataUri
  })
);

const createMintSignature = await sendAndConfirmTransaction(connection, createMintTx, [payer, mint]);

const associatedTokenAccount = getAssociatedTokenAddressSync(
  mint.publicKey,
  recipientOwner,
  false,
  TOKEN_2022_PROGRAM_ID
);
const baseUnits = BigInt(config.supply) * 10n ** BigInt(config.decimals);

const mintSupplyTx = new Transaction().add(
  createAssociatedTokenAccountInstruction(
    payer.publicKey,
    associatedTokenAccount,
    recipientOwner,
    mint.publicKey,
    TOKEN_2022_PROGRAM_ID
  ),
  createMintToInstruction(
    mint.publicKey,
    associatedTokenAccount,
    payer.publicKey,
    baseUnits,
    [],
    TOKEN_2022_PROGRAM_ID
  )
);

if (config.revokeMintAuthority) {
  mintSupplyTx.add(
    createSetAuthorityInstruction(
      mint.publicKey,
      payer.publicKey,
      AuthorityType.MintTokens,
      null,
      [],
      TOKEN_2022_PROGRAM_ID
    )
  );
}

const mintSupplySignature = await sendAndConfirmTransaction(connection, mintSupplyTx, [payer]);

mkdirSync("launch-output", { recursive: true });
const output = {
  network,
  name: config.name,
  symbol: config.symbol,
  decimals: config.decimals,
  supply: config.supply,
  mintAddress: mint.publicKey.toBase58(),
  tokenProgram: TOKEN_2022_PROGRAM_ID.toBase58(),
  authorityWallet: payer.publicKey.toBase58(),
  recipientOwner: recipientOwner.toBase58(),
  associatedTokenAccount: associatedTokenAccount.toBase58(),
  createMintSignature,
  mintSupplySignature,
  metadataUri: config.metadataUri,
  mintAuthorityRevoked: Boolean(config.revokeMintAuthority),
  freezeAuthorityRevoked: Boolean(config.revokeFreezeAuthority)
};

const outputPath = resolve(`launch-output/${network}-${config.symbol.toLowerCase()}-token.json`);
writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(JSON.stringify(output, null, 2));
console.log(`Saved launch record: ${outputPath}`);

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}
