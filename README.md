# InfinityX

This workspace contains the first InfinityX launch tools:

- Solana Token-2022 creator for the InfinityX token.
- Local authority wallet generation.
- Devnet-first safety flow before mainnet.

## Create the token authority wallet

```powershell
npm run token:wallet
```

This creates `secrets/infinityx-token-authority.json` and prints the public address. Do not share the secret file.

## Test on devnet

```powershell
npm run token:create:devnet
```

## Create the real mainnet token

1. Edit `token.config.json`.
2. Fund the generated public wallet with SOL.
3. Confirm the balance:

```powershell
npm run token:balance:mainnet
```

4. Mint on mainnet:

```powershell
$env:CONFIRM_MAINNET="true"
npm run token:create:mainnet
```

## What you must decide before mainnet

- Final token name.
- Final symbol.
- Total supply.
- Decimals, normally `9` on Solana.
- Metadata URL with logo JSON.
- Whether to permanently revoke mint authority.

Mainnet transactions are real. Test on devnet first.
