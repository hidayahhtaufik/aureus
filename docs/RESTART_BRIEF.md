# 🔄 AUREUS — Restart Brief (Read This First)

**Created:** 2026-05-12
**Purpose:** Resume context after Claude CLI restart. Read this before anything else.

---

## Quick State

**Project:** AUREUS Protocol — agent commerce infrastructure on Arc Network
**Working dir:** `/Users/taufik/Desktop/Project/Arc/aureus`
**Live:** https://aureus.auranode.xyz (TalosFacilitator)
**Repo:** github.com/hidayahhtaufik/aureus
**Builder:** Taufik (auranode.xyz, solo, Indonesia)

---

## What's Built (verified 2026-05-12)

- ✅ TalosFacilitator LIVE in production
- ✅ 3 smart contracts coded + tested (Tessera, Honos, Acta) — NOT deployed
- ✅ SDK `@auranode/x402-arc` built — NOT published to npm
- ✅ Examples stub (seller + buyer)
- ✅ Comprehensive docs (this dir)
- ✅ Auto-memory + mem0 + repo docs (triple redundancy)

---

## ⚠️ CRITICAL — User Feedback Pending Resolution

User provided strong signals via `/btw` history that the AUREUS SaaS pivot proposal (Track F) is **wrong direction**. Reset before continuing.

### What user said via `/btw`:

1. **OK to replace old code** — "kenapa tetap pakai our old code? bisa aja kita ganti kan?"
2. **Question Stripe framing** — "bukannya arc dan circle sudah ada stripe ya?" (Circle x402-batching already does this)
3. **Prefer Track A + D combo** — "saya tertarik pilihan A dan D"
4. **Want rename** — "veritas + arc = veriarc atau sigil"

### Tracks A + D recap (correct direction):
- **Track A (Defensive):** Ship close-out v0.1/v0.2 + redeploy ke Ink → multi-chain narrative
- **Track D (Standards player):** x402 + MPP + AP2 settlement abstraction layer

### NOT this (incorrect direction I proposed earlier):
- ❌ Stripe-for-AI-Agents SaaS framing
- ❌ Next.js dashboard as primary surface
- ❌ Subscription billing tiers
- ❌ MCP server + Anthropic Skills as priority

### Naming under consideration:
- **Veriarc** — Veritas + Arc combo
- **Veritas** — Roman goddess of truth (single word, brandable)
- **Sigil** — symbol/seal
- AUREUS umbrella + new product name underneath

---

## What Aku Should Have Asked (Open Decisions)

Aku salah push SaaS direction. Before next session, user needs to confirm:

1. **Old code mau diganti yang mana spesifiknya?**
   - (a) TalosFacilitator rewrite?
   - (b) Contracts rewrite?
   - (c) SDK replace?
   - (d) Greenfield new project?

2. **Track A + D simplified — bener begini?**
   - A: ship existing + Ink redeploy
   - D: settlement abstraction (x402/MPP/AP2)

3. **Final name?**
   - Veriarc / Veritas / Sigil / tetap AUREUS / lain?

4. **Product positioning yang akurat?**
   - "Open-source x402 facilitator multi-chain" (Track A focus)
   - "Multi-standard agent payment abstraction" (Track D focus)
   - "Audit/receipt trust layer" (Acta-first)

5. **Indonesian builder identity — front atau background?**

---

## Memory Layers (all populated)

### Auto-memory (loads automatically when Claude starts in this project)
- `~/.claude/projects/-Users-taufik-Desktop-Project-Arc/memory/MEMORY.md` (index, hook blocks updates)
- `project_aureus_saas_pivot.md` (2026-05-12, contains SaaS pivot — ⚠️ user pushed back)
- `reference_arc_native_primitives.md` (Arc addresses + standards)
- `project_aureus_lockin.md` (superseded but valid for historical context)
- `user_profile.md`, `decisions_log.md`, `feedback_*.md`, `project_arc_thesis.md`, `reference_arc_addresses.md`

### mem0 MCP (cloud, searchable)
Top search queries to run after restart:
- `"AUREUS USER FEEDBACK"` — gets the critical Track A+D + rename signals
- `"AUREUS Phase A roadmap"` — gets close-out plan
- `"Arc native primitives"` — gets contract addresses
- `"Circle Agent Stack May 2026"` — gets Circle landscape

### Repo docs (this directory)
- `PRODUCT_SPEC.md` — ⚠️ proposed Stripe-for-AI-Agents (user rejected, needs rewrite)
- `ROADMAP.md` — Phase A-E (Phase A close-out still valid, B-E need rewrite)
- `RESEARCH_SUMMARY.md` — Arc/Circle/Gensyn/Boundless/Lit/Ink (VALID, keep)
- `ADRs/001-saas-pivot.md` — ⚠️ rationale for rejected direction
- `ADRs/002-clean-architecture.md` — VALID if we keep clean architecture
- `ADRs/003-erc-standards.md` — VALID (ERC-8004 + 8183 still relevant)
- `ADRs/004-tech-stack.md` — partial, depends on whether dashboard is built
- `ARCHITECTURE.md` — original v0.1/v0.2 design, still mostly valid
- `grant-application.md` — draft, needs update to match final direction
- `x402-pr-plan.md` — upstream PR plan, still valid

---

## Recommended First Prompt After Restart

```
Cek docs/RESTART_BRIEF.md di /Users/taufik/Desktop/Project/Arc/aureus/docs/. 
Search mem0 untuk "AUREUS USER FEEDBACK". 
Aku mau lanjut diskusi: kita pilih Track A + D bener, terus rename ke 
Veritas/Veriarc/Sigil, drop framing Stripe-for-AI-Agents. 
Masuk plan mode, propose ulang yang sesuai preferensi aku.
```

Or shorter:
```
Lanjut AUREUS. Track A + D. Drop SaaS. Propose ulang dengan rename.
```

---

## Bypass Mode Reference

To restart Claude CLI with bypass mode (auto-approve tool calls):

```bash
# Standard restart
claude

# Bypass mode (auto-approves tools — use carefully)
claude --dangerously-skip-permissions
```

Or in settings.json:
```json
{
  "permissions": {
    "defaultMode": "bypassPermissions"
  }
}
```

⚠️ Bypass mode skips permission prompts. Only use if you trust the prompts you're sending. Tools like `Bash`, `Write`, `Edit` will execute without confirmation.

---

## Session Tracking

| Date | Session | Output |
|---|---|---|
| 2026-05-08 | Initial AUREUS lock-in | Original v0.1/v0.2 plan |
| 2026-05-11 | Circle Agent Stack research | Discovery + tension flagged |
| 2026-05-12 morning | SaaS pivot proposal | ⚠️ Wrong direction per user feedback |
| 2026-05-12 afternoon | User pushback via /btw | Track A+D + rename signals |
| **NEXT** | Reset + replan | Propose Track A+D + rename |

---

## Don't Lose This

If something goes wrong with restart:

1. **mem0 search:** `search_memories(query="AUREUS USER FEEDBACK", top_k=5)` — full feedback recorded
2. **Auto-memory:** files in `~/.claude/projects/-Users-taufik-Desktop-Project-Arc/memory/` survive restart
3. **This file:** `cat docs/RESTART_BRIEF.md` — always readable
4. **Git:** `git log` for previous commits showing project history

🛡️ Triple-redundant. Won't disappear.
