# ADR 003: Build to ERC Standards (8004, 8183) — Not Custom Primitives

**Date:** 2026-05-12
**Status:** Accepted
**Deciders:** Taufik

## Context

Arc Network's docs reference two new ERC standards relevant to agent commerce:

- **ERC-8004:** Onchain Agent Identity (DID-like registry for autonomous agents)
- **ERC-8183:** Job Escrow & Settlement (deferred payment protocol)

Original AUREUS v0.2 design had custom contract primitives (Honos, Acta, Tessera) without referencing emerging standards. Now that Arc explicitly supports these ERCs in its native MCP server and tooling, the question is whether to:

1. Stay custom (Honos, Acta, Tessera independent)
2. Build to standards (implement ERC-8004 + ERC-8183, integrate with Honos/Acta/Tessera)
3. Replace custom contracts with standards

## Decision

**Adopt ERC-8004 and ERC-8183 as Arc-native standards for agent identity and job escrow. Integrate Honos + Acta + Tessera AS COMPLEMENTS, not replacements.**

Specifically:
- **ERC-8004 identity registry:** Use Arc's reference impl when shipped. Agents get a DID-like identifier (`did:erc8004:0x...`).
- **ERC-8183 escrow:** Build `AgentEscrow.sol` wrapping ERC-8183 spec. Used for deferred/disputed payments.
- **Honos:** Reads agent identity from ERC-8004, attaches reputation score to it. Honos is the "credit score" for ERC-8004 identities.
- **Acta:** Continues as semantic receipt. Each Acta receipt references ERC-8004 agent IDs.
- **Tessera:** Stays as Aureus-specific constrained USDC. No corresponding ERC yet.

## Rationale

### Why adopt standards?
- **Portability:** ERC-8004 agent IDs work across any chain supporting the standard
- **Tooling:** Arc's MCP server already speaks ERC-8004. Free integration.
- **Future-proofing:** When standards converge, AUREUS is on the right side
- **Audit cost reduction:** Standard contracts have community-vetted implementations

### Why NOT replace Honos with a standard?
- No ERC for reputation exists yet
- Honos's halving decay + pledge mechanism is unique
- This is AUREUS's competitive moat

### Why NOT replace Acta with a standard?
- No ERC for dual-sig semantic receipts
- Acta's intent → outcome structure is unique
- Auditors value Acta's specific format

### Why NOT replace Tessera with Circle Agent Wallet policy?
- Circle policy is OFF-chain (Circle service)
- Tessera is ON-chain (asset-level)
- Different trust models — Tessera works without trusting Circle

## Implementation Plan

### Phase B (v0.3)
- Implement `AgentEscrow.sol` wrapping ERC-8183 minimal spec
- Add ERC-8004 read calls to Honos contract (linkage)
- Read ERC-8004 agent identity in Acta receipt emission

### Phase C (v0.4)
- Full ERC-8183 dispute window implementation
- ERC-8004 issuance support (Aureus issues DIDs for agents)
- Cross-chain ERC-8004 identity portability (Arc ↔ Ink ↔ Base)

### Phase D (v0.5)
- Submit reference implementation upstream if Arc reference incomplete
- ERC-8004 / 8183 EIP-712 typed data templates published as `@auranode/aureus-types`

## Alternatives Considered

### Alt 1: Stay fully custom
- **Pro:** Faster ship, no spec-tracking overhead
- **Con:** Forks ecosystem, more porting cost, weaker positioning
- **Rejected**

### Alt 2: Replace Honos/Acta with standards
- **Pro:** Smaller surface, easier audit
- **Con:** No standards exist for these. We'd be inventing.
- **Rejected**

### Alt 3 (CHOSEN): Complement standards with unique primitives
- Best of both worlds
- Honos/Acta/Tessera = AUREUS moats
- ERC-8004/8183 = ecosystem alignment

## Consequences

### Positive
- Easier integration with Arc's native MCP server (already speaks ERC-8004)
- Future cross-chain identity portability
- Grant narrative: "open standards + open primitives"
- Community contributions easier (standards-aware)

### Negative
- ERC standards still evolving (specs may change)
- Reference implementations may not be production-ready
- Adds spec-tracking work

### Mitigations
- Pin spec version in contracts (e.g. `import "ERC8004-v0.3.sol"`)
- Implement minimal subset first, expand as standards stabilize
- Monitor Arc's reference repo for upstream updates

## Validation

Phase B end-state: ERC-8004 agent ID readable in Honos. ERC-8183 escrow deployed for at least 1 demo flow.

## References

- ERC-8004: https://eips.ethereum.org/EIPS/eip-8004 (when published, currently in draft)
- ERC-8183: https://eips.ethereum.org/EIPS/eip-8183 (draft)
- Arc docs AI and Agents section: https://docs.arc.network (llms.txt index references these standards)
