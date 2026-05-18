# Security Policy

## Supported versions

Aureus is in active development. Security fixes land on `master` and are
backported to the latest published release on a best-effort basis.

| Version | Status |
|---|---|
| 0.1.x | ✅ active — security fixes accepted |
| < 0.1 | ❌ pre-release, not supported |

## Reporting a vulnerability

Please **do not** open a public issue for security findings. Email
**hello@auranode.xyz** with:

- A clear description of the vulnerability
- Steps to reproduce
- Affected versions / commits
- Suggested mitigation if you have one

We aim to acknowledge within 48 hours and to coordinate disclosure with
you before any public discussion or fix lands. Critical issues affecting
the production facilitator at `aureus.auranode.xyz` are prioritized.

## In scope

- TalosFacilitator service (`/facilitator`)
- `@hidayahhtaufik/x402-arc` SDK (`/packages/x402-arc`)
- Production deployment of `aureus.auranode.xyz`
- Buyer / seller example apps (`/examples`)

## Out of scope

- Vulnerabilities in upstream dependencies (please report to the
  upstream project; we'll bump versions promptly)
- Self-DoS by misconfiguring your own facilitator instance
- Arc Network protocol issues (please report to Circle directly)
- Theoretical issues without a reproducer

## Hall of fame

Researchers who responsibly disclose security findings will be credited
here (with their permission) after a fix ships.

_No reports yet._
