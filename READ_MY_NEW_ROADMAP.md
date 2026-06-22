# READ ME FIRST - NEXUS Roadmap Operating Guide

Future developers: read this before changing simulation code.

NEXUS is not a strategy game. NEXUS is not a policy sandbox. NEXUS is not a one-country-only demo. NEXUS is a global autonomous simulation where the user observes history emerging from connected systems.

The authoritative product roadmap is `ROADMAP.md`. This file explains how to follow it in the right order.

## The Product Vision In One Sentence

NEXUS simulates a connected world where people, families, companies, countries, classes, migration, trade, inequality, institutions, and geopolitical shocks create emergent history without direct player control.

## Absolute Rules

1. Do not add player agency over countries, firms, families, people, policy, wars, markets, or central banks.
2. Do not add decorative systems that do not feed the causal loop.
3. Do not add story text that invents causes not present in simulation evidence.
4. Do not broaden features before architecture, determinism, and tests are ready.
5. Do not use direct random behavior in simulation code; deterministic replay is mandatory.
6. Do not turn developer scenario harnesses into the main user fantasy.
7. Do not treat one-country slices as the final product vision.
8. Do not create or expand monoliths when modular domain ownership is possible.

## Correct Build Order

Follow this order from `ROADMAP.md`:

1. **Phase 0 - Repository Hygiene and Vision Lock**
   - Align documentation.
   - Remove tracked dependencies.
   - Make future contribution rules clear.

2. **Phase 1 - Architecture Reset**
   - Inventory the monolith.
   - Extract modules by domain.
   - Create explicit orchestration and boundaries.

3. **Phase 2 - Determinism Foundation**
   - Add seeded RNG.
   - Remove direct simulation randomness.
   - Persist RNG state.
   - Protect replay with tests.

4. **Phase 3 - Global Core Loop Binding**
   - Enforce labor, demand, capital, logistics, housing, and migration constraints.
   - Make countries, firms, households, and blocs affect each other.

5. **Phase 4 - Inequality, Class Mobility, and Family Memory**
   - Make social mobility and intergenerational outcomes first-class systems.

6. **Phase 5 - Business and Labor Deepening**
   - Make firms and labor markets produce human consequences.

7. **Phase 6 - Global Interdependence**
   - Add meaningful trade, migration, remittance, supply-chain, and bloc spillovers.

8. **Phase 7 - Geopolitical Pressure Without Player Control**
   - Add sanctions, elections, instability, and conflict risk as autonomous consequences.

9. **Phase 8 - Emergent Storytelling and World Chronicle**
   - Convert structured events and causal traces into readable world history.

10. **Phase 9 - Watchlists and Investigation**
    - Let users follow entities without controlling them.

11. **Phase 10 - Performance, Scale, and Release Hardening**
    - Make the global simulation shippable.

## AAA Development Standard

Treat every change like it belongs in a large production simulation:

- Architecture first.
- Determinism first.
- Tests first.
- Small modules over giant files.
- Explicit domain ownership.
- Stable save compatibility.
- Repeatable replays.
- Performance budgets.
- Clear user-facing explanations.
- No dependencies committed to source control.

## Domain Ownership Expectations

- `sim-core` orchestrates time and tick order.
- `sim-business` owns firms, founders, leadership, hiring decisions, succession, reputation, and liquidation.
- `sim-labour` owns labor supply, employment, unemployment, skills, and wages.
- `sim-finance` owns credit, liquidity, capital, debt, and firm/household financial pressure.
- `sim-demographics` owns births, deaths, aging, population profiles, and migration pressure.
- `sim-society` owns inequality, class mobility, institutions, education access, and social pressure.
- `sim-geopolitics` owns sanctions, blocs, election pressure, conflict risk, and policy-stance drift.
- `events` owns structured event records and evidence, not actual mechanics.
- `ui` should evolve into focused panels: World Chronicle, watchlists, inspectors, map, why panels, and reports.

## System Design Checklist

Before implementing any new feature, write down:

- What causal-loop variables does this read?
- What causal-loop variables does this write?
- What could break if this runs for 70 years?
- What test proves it is deterministic?
- What test proves it respects hard constraints?
- What event evidence does it emit?
- How will the user understand it through the World Chronicle or why panel?

## User Experience Translation

Raw causal traces are for developers. Users should see readable explanations.

Developer trace example:

- `tradeShockIndex +0.12`
- `firmSupplyStress +0.08`
- `layoffPressure +0.04`
- `householdDemand -0.03`

User-facing explanation:

> Import costs rose after a trade disruption. Several firms reduced hiring and raised prices. Household spending weakened, which increased unemployment pressure in affected regions.

## Definition Of Done

A feature is not done until:

- It is deterministic.
- It is modular.
- It has tests or a documented validation command.
- It emits causal evidence where relevant.
- It does not add direct player control.
- It does not break save compatibility without migration.
- It can be summarized by the World Chronicle or inspected through a why explanation.

## If Unsure

Choose the option that strengthens the autonomous global simulation and makes cause-and-effect clearer.
