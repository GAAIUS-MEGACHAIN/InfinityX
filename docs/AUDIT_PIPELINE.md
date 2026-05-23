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
