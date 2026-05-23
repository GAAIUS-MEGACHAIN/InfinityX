# InfinityX Secure Custody Design

InfinityX is non-custodial. The backend never stores seed phrases, private keys, or MPC complete key material.

## Key Modes

- Seed phrase wallet: generated/imported on device, encrypted locally.
- Passkey wallet gate: WebAuthn/passkey unlock before local signing.
- Biometric gate: Android Keystore or secure enclave unlock before signing.
- MPC wallet: threshold key shares split across device, recovery service, and optional guardian.
- Social recovery: guardian approvals create a visible recovery intent with delay and cancellation.

## Transaction Flow

1. Backend creates unsigned intent.
2. Client simulates risk and fees.
3. User approves with passkey/biometric/PIN.
4. Client signs locally.
5. Client broadcasts through selected RPC.
6. Backend indexes public result only.

## Hard Rule

No backend route may accept a seed phrase, private key, full MPC key, or raw signing authority.
