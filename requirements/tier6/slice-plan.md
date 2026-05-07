# Tier 6 Constrained Slice Plan

## Sequence

1. Slice 1: Elections + sanctions only.
2. Slice 2: Expanded trade-war retaliation loops.
3. Slice 3+: Conflict systems (gated, out of current scope).

Slice 2 brief: `requirements/tier6/slice2-trade-war-retaliation-brief.md`

## Slice 1 Requirements

- Implement election schedule and bounded policy stance transitions.
- Implement sanctions targeting with reroute path pressure.
- Emit explainability signals for policy and sanctions effects.
- Keep closure checks in CI/manual run flow for every merge.
- Validate Slice 1 with a bounded contract harness covering elections, sanctions, and snapshot persistence (`npm run test:tier6:slice1`).

## Slice 1 Status

- Elections and sanctions are active in the constrained yearly pass.
- Inspector/telemetry evidence is present for election and sanction channels.
- Dedicated Slice 1 contract coverage now exists via `npm run test:tier6:slice1`.
- Conflict phase remains hard-disabled; war systems stay out of scope.

## Slice 2 Preconditions

- Slice 1 closure drift accepted and documented.
- No unresolved hard-failure regressions.
- Observability confirmed for sanctions and election effects.
- Slice 1 contract harness remains green alongside closure and horizon smoke.
- Slice 2 implementation must start from the bounded retaliation brief before coding.

## Blockers For Conflict Scope

- Any failing closure trend with worsening margin.
- Missing loop attachment evidence for Slice 1 or 2 mechanics.
- Unresolved save/migration incompatibility risks.
