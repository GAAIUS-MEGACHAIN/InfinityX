# InfinityX Wallet Comparison Report

Generated May 23, 2026.

## Compared Products

- MetaMask
- WalletConnect
- Phantom
- Trust Wallet
- Coinbase Wallet
- InfinityX Wallet

## Current InfinityX Advantages

| Area | InfinityX Current State | Why It Can Be Strong |
| --- | --- | --- |
| Chain registry | 133 local chains with Main as a virtual routing layer | Broader built-in registry than many consumer wallets expose by default |
| Token registry | 3000 local hardcoded token/coin records | Less runtime API dependence for discovery and add-token flow |
| IFX utility | Fixed supply IFX plus service-fee discount policy | Gives the token product utility beyond speculation |
| Audit artifacts | Compressed audit pack committed to GitHub | Useful internal integrity trail |
| Backend policy | Non-custodial intent backend | Avoids backend seed/private-key custody |
| Desktop and APK | Both generated from shared UI | Multi-platform from the start |

## Where Competitors Are Ahead

| Area | MetaMask | Phantom | Trust Wallet | Coinbase Wallet | WalletConnect | InfinityX Gap |
| --- | --- | --- | --- | --- | --- | --- |
| Production wallet signing | Mature | Mature | Mature | Mature | Protocol only | Needs audited signing/broadcast flows |
| dApp connection network | Strong EVM | Strong Solana/multi-chain | Strong mobile/browser | Strong developer ecosystem | Core strength | Needs WalletConnect WalletKit integration |
| NFT support | ERC-721/ERC-1155 ecosystem | Strong Solana/NFT UX | Broad NFT storage | NFT gallery/transfers | Enables dApp connection | Needs real NFT indexers |
| Swaps/bridges | Portfolio buy/swap/bridge/stake | Cross-chain swap UX | Swaps/staking/buy | dApp/wallet integrations | Connection layer | Needs provider execution and risk engine |
| Security maturity | Established | Scam detection/transaction previews | Established | Transaction previews | Session security | Needs audits, transaction simulation, phishing engine |
| App store readiness | Production | Production | Production | Production | SDK/protocol | Needs signed release builds and policies |

## Source Notes

- MetaMask help describes the extension/mobile wallet as managing Ethereum, Solana, Bitcoin, and other private keys, plus dApp interaction; MetaMask Portfolio covers dashboard, buy, swap, bridge, and stake workflows: https://support.metamask.io/start/getting-started-with-metamask and https://support.metamask.io/manage-crypto/portfolio/getting-started-with-the-metamask-portfolio-dashboard/
- WalletConnect docs describe Wallet SDK/App SDK for chain-agnostic wallet-to-app connections across EVM, Solana, Bitcoin, and CAIP-25 namespaces: https://docs.walletconnect.network/
- Phantom official docs describe multi-chain account/token/NFT support and trading/cross-chain swap features: https://www.phantom.com/learn/blog/introducing-phantom-multichain and https://phantom.com/Trade
- Trust Wallet material describes self-custody, dApp access, swaps/staking, and NFT support: https://trustwallet.com/nft
- Coinbase Wallet docs describe self-custody, dApp connectivity, NFT support, transaction previews, biometrics, Ledger support, and malicious dApp warnings: https://www.coinbase.com/security/wallet-security and https://docs.cdp.coinbase.com/wallet-sdk/docs/wallet-features

## What InfinityX Needs Before Real Users With Funds

1. Solana local signing and broadcast from encrypted vault.
2. EVM signing and chain switching.
3. WalletConnect WalletKit integration.
4. Transaction simulation and approval risk warnings.
5. NFT indexer integrations or self-hosted indexers.
6. Swap execution adapters with signed user approval.
7. Bridge provider adapters with signed user approval.
8. Production Play Store signing key and release pipeline.
9. External security audit.
10. Legal review for swap fees, sales, and token listings.

## Enhancement Roadmap

- Add WalletConnect WalletKit.
- Add Solana send/receive first.
- Add EVM account derivation and send/receive.
- Add NFT gallery with spam filtering.
- Add dApp browser/session permissions.
- Add signed swap execution.
- Add compressed registry update packs through GitHub Releases.
- Add real backend indexing jobs.
- Add treasury multisig for fees.
