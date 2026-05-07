# Tier 6 Slice 2 Trade-War Retaliation Brief

## Purpose

Define a narrow Slice 2 that extends sanctions into retaliatory trade-war loops without opening conflict-phase systems.

## Scope

- In scope: bounded retaliation escalation between blocs, sector-weighted trade blocking, reroute counter-adaptation, and explainability outputs for retaliation pressure.
- Out of scope: kinetic conflict, occupation, embargo starvation modeling, refugee flows, treaty debt, reconstruction, or casualty systems.

## Core Loop Attachments

- Production: retaliation should deepen sector bottlenecks rather than apply flat bloc-wide collapse.
- Consumption and demand: consumer demand should shift by sector and import dependence, not only by random macro shock.
- Prices and allocation: retaliatory pressure should raise sector allocation friction and reroute urgency.
- Firm decisions: affected firms should favor reroute, supplier substitution, defensive cash posture, and selective staffing restraint.
- Employment feedback: sector pressure should create uneven hiring and layoffs rather than uniform macro contraction.

## Narrow Slice 2 Objectives

- Add retaliatory escalation rules on top of active Slice 1 sanction lanes.
- Weight retaliation by sector exposure and bilateral pressure instead of broad random escalation.
- Emit country, bloc, and sector-facing evidence fields for retaliation pressure and reroute response.
- Keep conflict phase disabled throughout Slice 2.

## Evidence Fields

- `retaliationPressureIndex`
- `sectorRetaliationWeights`
- `sectorTradeBlockIndex`
- `rerouteCounterPressureIndex`
- `sectorEmploymentDrag`

## Entry Criteria

- `npm run test:stability` is green on the branch.
- Slice 1 contract harness remains green.
- No unresolved persistence gaps for sanction lanes or Tier 6 policy evidence.

## Exit Criteria

- Retaliation activates only from existing sanction lanes or bounded bilateral escalation conditions.
- Sector-weighted evidence is visible in telemetry or inspector surfaces.
- Closure and bounded horizon smoke remain green with documented drift deltas.

## Failure Risks To Watch

1. Retaliation chains saturate all blocs too quickly.
Mitigation: add bilateral cooldowns, escalation caps, and sector-limited propagation.

2. Trade-war logic bypasses core demand or production channels.
Mitigation: require every retaliation effect to land in sector throughput, demand, prices, or firm decisions.

3. Reroute relief becomes a hidden hard reset.
Mitigation: use partial relief with lag and visible evidence rather than full neutralization.

4. Sector shocks become indistinguishable from generic recession.
Mitigation: expose sector-specific evidence and require uneven country or industry outcomes in tests.

## Non-Goals

- No war declaration or conflict phase enablement.
- No military procurement system.
- No treaty or post-conflict reconstruction mechanics.
