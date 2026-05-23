# InfinityX Contract Audit Notes

Contracts in `contracts/` are starter templates, not audited production deployments.

## Required Before Mainnet

- Professional Solidity audit.
- Unit and invariant tests.
- Treasury multisig.
- Emergency pause/upgrade policy decision.
- Formal sale economics review.
- Chain-specific deployment review.

## Current Contracts

- `InfinityXFeeRouter.sol`: service fee quote and native fee forwarding.
- `InfinityXListingRegistry.sol`: token/dApp application registry.
- `InfinityXFixedSupplySale.sol`: pre-funded fixed-supply sale adapter. It never mints IFX.
