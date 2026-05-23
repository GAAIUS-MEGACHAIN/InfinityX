# InfinityX Build Phases

## Phase 1

- Mobile and desktop app shell.
- Main chain routing concept.
- IFX token integration.
- Backend registry and audit pack.
- Non-custodial custody policy.
- Fee policy and revenue ledger.

## Phase 2

- Real local wallet generation/import. Done.
- Encrypted vault. Done.
- Send/receive for Solana. Done for SOL/SPL with RPC fallback.
- Jupiter swap execution with local signing. Done for Solana route execution.
- Token index cache. Done with top-3000 registry and compressed update packs.

## Phase 3

- EVM wallet support. Done for supported EVM native/ERC-20 sends.
- WalletConnect WalletKit scaffold. Done, requires project ID and approval screens.
- WalletConnect request approval screens. Done for session proposals and rejection flow; signing decode/approve adapters still need hardening.
- External wallet connect pages. Done for Phantom, MetaMask, Coinbase Wallet, Trust Wallet, WalletConnect, and injected EVM wallets.
- Token creation. Done for live Solana SPL creation; EVM factory contract template added pending deployment.
- Staking. Done for live Solana stake account delegation; provider adapters pending for ETH/POL/BNB/AVAX.
- Cross-chain quote providers. Partial: Solana Jupiter and LI.FI EVM bridge quotes.
- Bridge execution. Done for LI.FI EVM transaction requests; more providers pending.
- Fee collection contracts. Starter templates only, pending audit/deploy.

## Phase 4

- MPC service.
- Social recovery contracts. Guardian recovery template added.
- Android biometric/passkey native signing gate. Done for Android BiometricPrompt + Android Keystore.
- Production Play Store signing. Local upload key generated under ignored `secrets/`; signed APK/AAB build works.
- External security audits. GitHub CodeQL, npm audit, Slither, and Semgrep workflow added.
