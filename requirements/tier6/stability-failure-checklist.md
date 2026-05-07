# Tier 6 Stability And Failure-Mode Checklist

## Goal

Prevent Tier 6 additions from destabilizing the core loop or closure gates.

## Stability Checklist

- [ ] Domain construction smoke test passes at boot (`npm run test:domains`).
- [ ] Architecture contract test passes and the coordinator phase order is intentional.
- [ ] Tier 6 Slice 1 contract test passes when working on elections/sanctions (`npm run test:tier6:slice1`).
- [ ] Closure command runs headless without runtime errors and remains fully green (`npm run test:closure`).
- [ ] At least one bounded horizon smoke remains green before Tier 6 resumes (`npm run test:horizon:smoke`).
- [ ] Tier 6 work stays paused unless all three checks above are green on the current branch.
- [ ] Overall passing target remains true for validation seed set.
- [ ] Under-utilized layoff guardrail margin is not near threshold.
- [ ] No new NaN/Infinity counters or labor bound violations.
- [ ] Save/load + migration path remains valid after Tier 6 state changes.

## Current Baseline Snapshot

- Source: `tests/closure_test_notes/closure-latest-run.json` (generated 2026-05-03T14:33:47.835Z, seed 20260325).
- Harness status: `pass=true`, baseline `21/21`, sequential `3/3` passing.
- Domain construction status: `npm run test:domains` passes and now fails fast on missing injected handlers during `initSim()`.
- Horizon smoke status: `npm run test:horizon:smoke` passes with 5 years at 30 sim-days per tick and writes `long-horizon-5y-smoke.json`.
- Tier 6 Slice 1 status: elections are active in bounded deterministic runs; sanctions activate under induced geo-pressure and survive snapshot round-trip via `npm run test:tier6:slice1`.
- Numeric/labor invariants: no baseline or sequential gate failures; latest failed gate list is empty.
- Sequential drift still worth watching even in passing runs: run 1 `firm revenue drift exceeded tolerance`; run 3 `household stress drift exceeded tolerance` and `demand drift exceeded tolerance`.
- Start-era contract baseline via `npm run test:start-era`: default preset `1998`; preset ids `1998`, `2000`, `2008`, `2016`, `2020`, `present-day`; deterministic present-day year `2026`; snapshot schema `12`.

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

1. Run `npm run test:stability` as the default one-command gate stack.
2. If only a narrow slice changed, use the individual commands below to isolate failures quickly.
3. Run `npm run test:domains` to force domain construction at boot and catch missing injected handlers immediately.
4. Run `npm run test:architecture` to verify domain and phase contracts.
5. Run `npm run test:start-era` to verify preset registry, deterministic present-day year, and snapshot round-trip retention.
6. Run `npm run test:tier6:slice1` when touching elections, sanctions, persistence, or inspector evidence for Tier 6 Slice 1.
7. Run `npm run test:closure` on the current branch and require a green result before Tier 6 work continues.
8. Run `npm run test:horizon:smoke` as the interactive horizon guardrail instead of the full 70-year soak.
9. Only after all prior checks are green, run the Tier 6 slice branch closure with the same seed and compare gate deltas and hard failures.
10. If any gate worsens beyond tolerance, block merge and apply mitigation knobs.

## Merge Gate

- [ ] Checklist complete.
- [ ] `npm run test:stability` is green on the branch.
- [ ] Delta review attached in PR notes.
- [ ] At least one reviewer signs off on stability risk.
