# Tier 6 Constrained Slice Plan

## Sequence
1. Slice 1: Elections + sanctions only.
2. Slice 2: Expanded trade-war retaliation loops.
3. Slice 3+: Conflict systems (gated, out of current scope).

## Slice 1 Requirements
- Implement election schedule and bounded policy stance transitions.
- Implement sanctions targeting with reroute path pressure.
- Emit explainability signals for policy and sanctions effects.
- Keep closure checks in CI/manual run flow for every merge.

## Slice 2 Preconditions
- Slice 1 closure drift accepted and documented.
- No unresolved hard-failure regressions.
- Observability confirmed for sanctions and election effects.

## Blockers For Conflict Scope
- Any failing closure trend with worsening margin.
- Missing loop attachment evidence for Slice 1 or 2 mechanics.
- Unresolved save/migration incompatibility risks.
