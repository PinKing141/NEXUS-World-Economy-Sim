# Tier 6 Stability And Failure-Mode Checklist

## Goal

Prevent Tier 6 additions from destabilizing the core loop or closure gates.

## Stability Checklist

- [ ] Closure command runs headless without runtime errors.
- [ ] Architecture contract test passes and the coordinator phase order is intentional.
- [ ] Overall passing target remains true for validation seed set.
- [ ] Under-utilized layoff guardrail margin is not near threshold.
- [ ] No new NaN/Infinity counters or labor bound violations.
- [ ] Save/load + migration path remains valid after Tier 6 state changes.

## Current Baseline Snapshot

- Source: `tests/closure_test_notes/closure-latest-run.json` (generated 2026-03-27T06:54:52.257Z, seed 20260325).
- Harness status: `pass=true`, baseline `21/21`, sequential `3/3` passing.
- Numeric/labor invariants: no baseline or sequential gate failures; latest failed gate list is empty.
- Sequential drift still worth watching even in passing runs: run 1 `firm revenue drift exceeded tolerance`; run 3 `household stress drift exceeded tolerance` and `demand drift exceeded tolerance`.
- Start-era contract coverage now exists via `npm run test:start-era` for default `1998`, deterministic `Present Day`, and snapshot round-trip retention.

## Failure Modes And Mitigations

1. Failure mode: Policy oscillation thrash after elections.

- Mitigation: Add cooldown and bounded stance deltas.

1. Failure mode: Sanctions collapse demand abruptly.

- Mitigation: Add phased ramp-in and reroute relief caps.

1. Failure mode: Over-correlation of sanctions with layoffs.

- Mitigation: Add demand-utilization floor and guardrail overrides.

1. Failure mode: Core-loop bypass through event-only effects.

- Mitigation: Require all Tier 6 effects to map to loop channels (labor, demand, prices, firm decisions).

1. Failure mode: Regression drift hidden by aggregate-only metrics.

- Mitigation: Emit country and bloc evidence deltas per run.

## Runbook

1. Run `npm run test:start-era` to verify preset registry, deterministic present-day year, and snapshot round-trip retention.
1. Run `npm run test:architecture` to verify domain and phase contracts.
2. Run baseline closure.
3. Run Tier 6 slice branch closure with same seed.
4. Compare gate deltas and hard failures.
5. If any gate worsens beyond tolerance, block merge and apply mitigation knobs.

## Merge Gate

- [ ] Checklist complete.
- [ ] Delta review attached in PR notes.
- [ ] At least one reviewer signs off on stability risk.
