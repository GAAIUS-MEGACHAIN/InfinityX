# InfinityX Automated Audit Pipeline

The local backend can generate compressed audit records:

```powershell
python backend/infinityx_backend.py
```

Then open:

```text
http://127.0.0.1:8787/audit/latest
```

Outputs:

- `audits/latest-audit.json`
- `audits/latest-audit.json.gz`

These are source-integrity and policy audits. They do not replace professional cryptographic, smart-contract, mobile, or custody audits.

## Free Online Audit

GitHub now runs a free audit workflow on push and pull request:

- CodeQL for JavaScript/TypeScript and Android Java.
- `npm audit --omit=dev` for runtime dependencies.
- Slither for Solidity contracts.
- Semgrep community rules.

Workflow:

```text
.github/workflows/security-audit.yml
```

This gives automated security scanning in GitHub. Findings still need to be reviewed and fixed; automated scanning is not the same as a human wallet custody audit.
