# NEXUS Phase 1 Domain Boundary Plan

This document starts Phase 1 of the roadmap: architecture reset and modularization. It is intentionally implementation-facing and should be updated as code moves out of the legacy simulation monolith.

## Objective

Move NEXUS toward a AAA-scale simulation architecture where each domain is independently understandable, deterministic, testable, and orchestrated through an explicit tick order.

## Target Tick Order

1. Core clock and pending world events.
2. Demographics: aging, births, deaths, household lifecycle, migration pressure.
3. Society: education access, inequality, class mobility, institutions, social pressure.
4. Labour: labor supply, participation, skills, employment availability, unemployment duration.
5. Production and business capacity: staffing, productivity, infrastructure, logistics, input constraints.
6. Finance: cash, debt, credit pressure, liquidity, investment capacity.
7. Household economy: wages, spending, savings, debt, housing, childcare, fertility pressure.
8. Demand and prices: country, city, bloc, and sector demand; inflation; shortages; allocation.
9. Firm decisions: hiring, layoffs, expansion, contraction, founding, closure, succession.
10. Geopolitics: sanctions, trade-war pressure, bloc stance, election pressure, instability, conflict risk.
11. Events and causal traces: structured records of what changed and why.
12. Derived state and UI indexing.
13. Persistence boundary.

## Domain Boundaries

### `sim-core`

Owns orchestration, tick order, date progression, deterministic domain dispatch, and high-level guardrails. It should not own business, household, country, or geopolitical mechanics.

### `sim-demographics`

Owns population profiles, aging, births, deaths, household lifecycle pressure, and migration pressure. It reads economic and social conditions, then writes demographic consequences.

### `sim-society`

Owns inequality, class position, education access, institutional drift, social pressure, and intergenerational mobility. It reads household, country, and macro conditions, then writes social consequences.

### `sim-labour`

Owns labor supply, participation, employment availability, skill availability, unemployment duration, and wage pressure. It must enforce that employment cannot exceed available labor.

### `sim-business`

Owns firm lifecycle, founders, leadership, succession, reputation, hiring intent, layoffs, production posture, expansion, contraction, and closure. It reads demand, finance, labor, logistics, and geopolitics.

### `sim-finance`

Owns liquidity, credit pressure, debt, capital constraints, investment capacity, household financial pressure, and firm survival pressure.

### `sim-geopolitics`

Owns autonomous policy stance, bloc pressure, sanctions, trade-war retaliation, election pressure, institutional instability, and conflict risk. It must never expose direct player policy control.

### `events`

Owns structured event records, significance scoring inputs, and causal evidence payloads. It must describe real mechanics; it must not replace missing mechanics.

### `state`

Owns selectors, derived aggregates, indexes, and read models used by UI and tests. It should avoid owning simulation mechanics.

### `persistence`

Owns save schema versions, migrations, compatibility guards, and deterministic replay persistence.

### `ui`

Legacy UI file to be split over time into World Chronicle, watchlists, map, inspectors, why panels, people, firms, countries, and reports.

## Extraction Rule

Each extraction must preserve behavior unless the PR explicitly documents a gameplay change. Prefer moving one cohesive function group at a time with tests before and after.

## First Extraction Candidates

1. Pure utility or calculation helpers that have no side effects.
2. Event construction helpers.
3. Demographic pressure calculations.
4. Labour availability and wage-pressure helpers.
5. Business scoring helpers.
6. Geopolitical pressure helpers.

## Done Criteria For A Module Extraction

- The module has one clear owner domain.
- The public functions are named by domain behavior.
- The extraction does not introduce direct randomness.
- Existing tests pass.
- Save compatibility remains unchanged.
- Causal evidence payloads remain available to UI and diagnostics.
