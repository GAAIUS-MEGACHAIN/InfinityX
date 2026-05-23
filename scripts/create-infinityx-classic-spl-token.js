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
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE
} from "@solana/spl-token";
import {
  MPL_TOKEN_METADATA_PROGRAM_ID,
  createMetadataAccountV3,
  mplTokenMetadata
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity } from "@metaplex-foundation/umi";
import {
  fromWeb3JsKeypair,
  fromWeb3JsPublicKey,
  toWeb3JsInstruction
} from "@metaplex-foundation/umi-web3js-adapters";

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
const rent = await getMinimumBalanceForRentExemptMint(connection);
const umi = createUmi(clusterApiUrl(network))
  .use(mplTokenMetadata())
  .use(keypairIdentity(fromWeb3JsKeypair(payer)));

const metadataPda = PublicKey.findProgramAddressSync(
  [
    Buffer.from("metadata"),
    new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
    mint.publicKey.toBuffer()
  ],
  new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)
)[0];

const baseUnits = BigInt(config.supply) * 10n ** BigInt(config.decimals);
const associatedTokenAccount = getAssociatedTokenAddressSync(
  mint.publicKey,
  recipientOwner,
  false,
  TOKEN_PROGRAM_ID
);

const metadataBuilder = createMetadataAccountV3(umi, {
  mint: fromWeb3JsPublicKey(mint.publicKey),
  mintAuthority: umi.identity,
  payer: umi.payer,
  updateAuthority: umi.identity,
  data: {
    name: config.name,
    symbol: config.symbol,
    uri: config.metadataUri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null
  },
  isMutable: true,
  collectionDetails: null
});

const createMintAndMetadataTx = new Transaction();
createMintAndMetadataTx.add(
  SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: mint.publicKey,
    lamports: rent,
    space: MINT_SIZE,
    programId: TOKEN_PROGRAM_ID
  }),
  createInitializeMintInstruction(
    mint.publicKey,
    Number(config.decimals),
    payer.publicKey,
    config.revokeFreezeAuthority ? null : payer.publicKey,
    TOKEN_PROGRAM_ID
  ),
  toWeb3JsInstruction(metadataBuilder.items[0].instruction)
);

const createMintSignature = await sendAndConfirmTransaction(
  connection,
  createMintAndMetadataTx,
  [payer, mint],
  { commitment: "confirmed" }
);

const mintSupplyTx = new Transaction().add(
  createAssociatedTokenAccountInstruction(
    payer.publicKey,
    associatedTokenAccount,
    recipientOwner,
    mint.publicKey,
    TOKEN_PROGRAM_ID
  ),
  createMintToInstruction(
    mint.publicKey,
    associatedTokenAccount,
    payer.publicKey,
    baseUnits,
    [],
    TOKEN_PROGRAM_ID
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
      TOKEN_PROGRAM_ID
    )
  );
}

const mintSupplySignature = await sendAndConfirmTransaction(
  connection,
  mintSupplyTx,
  [payer],
  { commitment: "confirmed" }
);

mkdirSync("launch-output", { recursive: true });
const output = {
  network,
  tokenStandard: "SPL Token",
  name: config.name,
  symbol: config.symbol,
  decimals: config.decimals,
  supply: config.supply,
  mintAddress: mint.publicKey.toBase58(),
  tokenProgram: TOKEN_PROGRAM_ID.toBase58(),
  metadataAddress: metadataPda.toBase58(),
  authorityWallet: payer.publicKey.toBase58(),
  recipientOwner: recipientOwner.toBase58(),
  associatedTokenAccount: associatedTokenAccount.toBase58(),
  createMintSignature,
  mintSupplySignature,
  metadataUri: config.metadataUri,
  mintAuthorityRevoked: Boolean(config.revokeMintAuthority),
  freezeAuthorityRevoked: Boolean(config.revokeFreezeAuthority)
};

const outputPath = resolve(`launch-output/${network}-${config.symbol.toLowerCase()}-classic-spl-token.json`);
writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(JSON.stringify(output, null, 2));
console.log(`Saved launch record: ${outputPath}`);

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}
