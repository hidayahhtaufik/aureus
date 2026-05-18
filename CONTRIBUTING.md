# Contributing to Aureus

Thanks for your interest. Aureus is small, focused, and pragmatic — the goal is to make x402 on Arc Network real for everyone, not to win architecture-astronaut points. Issues and PRs welcome.

## Quick links

- [Repository layout](./README.md#repository)
- [Local quickstart](./README.md#quickstart--run-the-whole-stack-locally-in-90-seconds)
- [Architecture deep-dive](./docs/ARCHITECTURE.md)
- [Live demo guide](./docs/DEMO.md)
- [Publishing runbook](./docs/PUBLISHING.md)

## Ground rules

1. **One PR, one concern.** Don't refactor adjacent code "while you're there." If you see a cleanup, file an issue and link the PR.
2. **Tests are the contract.** Every behavior change ships with a test. The verifier and settler suites are where regressions live or die.
3. **Surgical changes.** Match existing style. Don't reformat files outside your diff.
4. **No silent failures.** If something is skipped, blocked, or partially implemented, say so loudly — in code comments AND the PR description.

## Setup

```bash
git clone https://github.com/hidayahhtaufik/aureus.git
cd aureus
npm install
```

Boot the facilitator + run the test suite to confirm a clean baseline:

```bash
cd facilitator
cp .env.example .env  # fill in FACILITATOR_PRIVATE_KEY with a fresh testnet wallet
npm run test          # 36 vitest tests, ~1.2s
npm run typecheck     # 0 errors expected
```

Foundry probes (Arc USDC EIP-3009 verification):

```bash
forge build
forge test -vv
```

## What's a good first PR?

- **Edge case in the verifier.** The 10-step chain in `facilitator/src/lib/verifier.ts` is the heart of the protocol. New test cases against malformed payloads, expired nonces, mismatched chain IDs, etc. are always welcome.
- **Buyer / seller examples in another framework.** The `examples/` folder is Express-based today. A Hono / Fastify / Bun seller would extend reach.
- **Documentation pass.** Typos, missing context, broken links, outdated commands — all fair game.

## What requires discussion first?

- **New endpoint** on the facilitator (we want to stay tight to the x402 spec)
- **Schema changes** to the payment-payload envelope
- **Smart-contract changes** in `src/` — Tessera/Honos/Acta are pre-audit
- **Dependency additions** — we keep the surface small on purpose

Open an issue with a short design note before sending a PR for these.

## Commit + PR conventions

- Conventional commits where possible: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`
- PR title mirrors the lead commit
- Body: what + why, link relevant issues, paste smoke-test output if it touched the facilitator
- CI must pass before merge

## Reporting security issues

Please **don't** open a public issue for vulnerabilities. Email `hello@auranode.xyz` and we'll coordinate disclosure + a fix before any public discussion.

## Licensing

By contributing you agree your code is dedicated under the [MIT license](./LICENSE).

## Acknowledgements

x402 specification by the [x402 Foundation](https://x402.org). Arc Network by [Circle](https://arc.network). The facilitator design pattern was inspired by the reference x402 implementations on Base.
