# InfinityX Treasury And Liquidity

## Treasury

Revenue destination:

```text
NHMs85t1zJDKU8ThrxEz6xC4S1R2XANadmk7K55tG3Q
```

The backend records revenue and sweep intents, but it does not hold signing keys. A sweep must be signed by the treasury wallet or future multisig.

## Multisig

Deployment-ready target:

- Solana: Squads or audited SPL-compatible treasury flow.
- EVM: Safe multisig for Ethereum, Polygon, Base, Arbitrum, Optimism, BNB Chain, Avalanche.
- Minimum: 3 owners.
- Threshold: 2-of-3.

Do not create a fake multisig by generating all owners on one machine. That is not real security.

## Liquidity

Real liquidity requires funded pool creation. For IFX:

- Solana DEX targets: Orca or Raydium.
- Starting pairs: IFX/SOL, IFX/USDC, IFX/USDT.
- Required assets: IFX plus real SOL/USDC/USDT liquidity.

No code can create real liquidity without depositing real assets into a DEX pool.
