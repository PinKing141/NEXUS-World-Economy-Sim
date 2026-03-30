# Simulation Engine Boundaries

## Purpose

Lock the simulation into explicit engine boundaries so Tier 6 and later systems scale without turning the coordinator back into a monolith.

## Coordinator

- File: `src/js/app/sim-core.js`
- Responsibility: timekeeping, phase order, checkpoint/render coordination, and validation-loop sequencing.
- Rule: this file owns order, not mechanics.

## Domain Engines

- `src/js/app/sim-business.js`
  - firm behavior, production throughput, corporate ladders, succession, distress, bankruptcy flow
- `src/js/app/sim-labour.js`
  - labour availability, hiring pressure, unemployment duration, compensation, promotion flow
- `src/js/app/sim-finance.js`
  - household budgets, debt, savings, demand, macro-financial metrics, market/deal passes
- `src/js/app/sim-demographics.js`
  - ageing boundaries, yearly demographic transitions, migration and arrivals
- `src/js/app/sim-society.js`
  - education, inequality, mobility, unrest, institutional and social score refreshes
- `src/js/app/sim-geopolitics.js`
  - elections, sanctions, geopolitical shocks, governor-style macro interventions

## Current Phase Order Contract

1. `business`
2. `labour`
3. `finance`
4. `demographics`
5. `geopolitics`
6. `finance-markets`
7. `demographics-migration`
8. `business-organization`
9. `labour-people`
10. `society`
11. `finance-metrics`
12. `geopolitics-governors`

## Rules For Future Work

- New Tier 6 mechanics must attach to an existing domain engine or justify a new domain explicitly.
- `src/js/app/sim.js` should only keep shared internals and adapter glue while extraction is in progress.
- Tick-order changes must update the architecture contract test before merge.
- Domain logic should move out in vertical slices, not as unrelated helper scattering.
- Closure and architecture tests are both required before accepting sequencing changes.
