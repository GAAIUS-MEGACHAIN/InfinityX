# InfinityX Secure Custody Design

InfinityX is non-custodial. The backend never stores seed phrases, private keys, or MPC complete key material.

## Key Modes

- Seed phrase wallet: generated/imported on device, encrypted locally.
- Passkey wallet gate: WebAuthn/passkey unlock before local signing.
- Biometric gate: Android Keystore or secure enclave unlock before signing.
- MPC wallet: threshold key shares split across device, recovery service, and optional guardian.
- Social recovery: guardian approvals create a visible recovery intent with delay and cancellation.

## Transaction Flow

1. Client unlocks the encrypted vault locally with the user's password.
2. Client derives the requested Solana or EVM signing account in memory.
3. Client validates address/network/token inputs and shows risk warnings.
4. Client simulates Solana transactions or estimates/simulates EVM calls.
5. User confirms the network, recipient, token, and amount.
6. Client signs locally and broadcasts through the selected RPC.
7. Backend indexes public result only.

## Implemented Live Paths

- Solana native SOL transfer.
- Solana SPL transfer, including destination associated token account creation.
- EVM native transfer on Ethereum, Polygon, BNB Chain, Base, Arbitrum, Optimism, Avalanche, and Fantom.
- EVM ERC-20 transfer with contract simulation.
- Jupiter Solana swap transaction building, local signing, and broadcast.
- LI.FI EVM bridge quote plus transaction-request signing and broadcast.
- WalletConnect WalletKit initialization scaffold requiring a project ID.

## Hard Rule

No backend route may accept a seed phrase, private key, full MPC key, or raw signing authority.
