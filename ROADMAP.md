# NEXUS Global Autonomous Simulation Roadmap

NEXUS is a global, autonomous, observational world-economy simulation. The player does **not** control countries, companies, families, wars, policy, markets, or people. The player watches a living world produce its own history through interacting systems: people, households, families, firms, industries, cities, countries, blocs, migration, trade, inequality, institutions, and geopolitical pressure.

This roadmap replaces the older broad feature backlog with a AAA-style production roadmap focused on architectural discipline, deterministic simulation, modular systems, explainable causality, and emergent storytelling at global scale.

## North Star

Build a world that writes its own history.

The player experience is:

- Observe a global simulation rather than command it.
- Follow people, families, companies, countries, industries, classes, migration routes, and crises through watchlists.
- Read emergent biographies, family sagas, company histories, country reports, and world newspapers generated from real simulation evidence.
- Ask why an outcome happened and receive a clear causal explanation.
- Compare how inequality, class mobility, institutions, migration, and global shocks reshape lives across generations.

## Non-Negotiable Product Rules

- No direct player agency over countries, firms, families, people, policy, wars, markets, or central banks.
- No win condition, conquest loop, god mode, policy-button gameplay, or optimization meta.
- No scenario lab as a headline user mode. Stress presets and scenario harnesses are developer-only diagnostics.
- No one-country final product vision. Small slices may be used to prove systems, but the product fantasy is a connected world.
- No decorative systems. Every major system must attach to the causal loop and create downstream consequences.
- No fake storytelling. Narrative output must summarize state changes and causal evidence produced by the simulation.
- No unbounded scope expansion before the required architecture and determinism gates are green.

## Core Simulation Loop

Every feature must declare how it enters and exits this loop:

1. Labor supply and skills.
2. Production capacity and constraints.
3. Income, wages, profits, transfers, and owner returns.
4. Household spending, savings, debt, fertility, and migration pressure.
5. Demand by sector, country, city, and bloc.
6. Prices, shortages, inflation, logistics, and allocation pressure.
7. Firm decisions: hiring, layoffs, expansion, liquidation, investment, location, succession.
8. Employment closure back into households, countries, inequality, migration, and future demand.

## Hard Simulation Constraints

Depth must come from constraints and tradeoffs, not unconstrained accumulation.

- Labor supply caps hiring and expansion.
- Demand caps revenue and sector growth.
- Capital, debt headroom, and liquidity cap investment and survival.
- Resources, infrastructure, logistics, and trade access cap production.
- Housing and cost of living cap migration absorption and household surplus.
- Education, institutions, class position, and inheritance shape life chances.
- Inequality feeds class mobility, social pressure, institutional drift, and political/geopolitical instability.
- Global shocks must propagate unevenly through trade, migration, prices, firms, households, and countries.

## Combined Route Direction

NEXUS combines these routes into one coherent product:

1. **Life Simulation** - people are born into families and conditions that shape education, work, marriage, migration, wealth, illness, aging, death, and legacy.
2. **Business Dynasty Simulation** - founders, executives, employees, firms, sectors, reputation, scandals, succession, layoffs, and bankruptcy drive economic stories.
3. **Macro Economy Simulation** - labor, production, income, demand, prices, credit, trade, inflation, housing, and firm decisions form the systemic engine.
4. **Generational Family Simulation** - households carry wealth, debt, status, inheritance, rivalry, migration chains, education advantage, and class position across generations.
5. **Geopolitical Shock Simulation** - elections, sanctions, trade wars, blocs, institutional pressure, and conflict risk emerge from conditions and reshape the economy.
6. **Inequality and Class Mobility Simulation** - the world tracks who rises, who falls, who stays trapped, and why mobility differs by country, city, class, education, migration, and inheritance.
7. **Global Multi-Country Simulation** - countries interact through trade, migration, capital, remittances, supply chains, commodity exposure, sanctions, and bloc relationships.
8. **Emergent Storytelling** - stories are generated from real causal evidence.
9. **World Chronicle Interface** - newspapers, decade reports, biographies, family sagas, company histories, and country reports make the world readable.
10. **Watchlist Interface** - the player follows entities and receives meaningful updates without controlling them.
11. **Causal Trace System** - raw traces are developer-facing; polished why-explanations are user-facing.

## User-Facing Experience Pillars

### World Chronicle

A readable digest of the living world:

- Global front page.
- Country reports.
- Industry reports.
- Business section.
- Family and inheritance section.
- Inequality and class mobility section.
- Migration and housing section.
- Geopolitical pressure section.
- Obituaries and legacy section.
- Decade summaries.

### Watchlists

The player can follow:

- People.
- Families.
- Companies.
- Countries.
- Cities or regions.
- Industries.
- Social classes.
- Migration corridors.
- Trade routes.
- Blocs and geopolitical flashpoints.

Watchlists personalize the world without giving the player control.

### Why Explanations

Every major surfaced outcome needs an inspectable explanation:

- Why did this person migrate?
- Why did this family rise or fall?
- Why did this company hire, lay off, expand, collapse, or survive?
- Why did inequality rise?
- Why did class mobility improve or decay?
- Why did this country lose talent?
- Why did a shock spread globally?
- Why did this region become unstable?

## Developer-Facing Architecture Pillars

- Deterministic simulation is mandatory.
- No direct `Math.random` in simulation code.
- Seeded PRNG state must persist through saves.
- Systems are modular by domain, not piled into monoliths.
- Source files should stay small enough to reason about; the target cap is 800 lines per file.
- The tick order must be explicit and stable.
- Each domain owns its own functions but reads/writes through a clear world contract.
- New systems require design briefs, causal-loop attachment notes, stability risks, and test coverage.
- Developer scenario harnesses exist only to validate stability, replay, and balance.
- User-facing storytelling reads from structured events and causal traces.

## Production Phases

### Phase 0 - Repository Hygiene and Vision Lock

Goal: make the repo trustworthy and align future work around the global autonomous vision.

- [x] Replace the old feature-sprawl roadmap with this global autonomous roadmap.
- [x] Add `READ_MY_NEW_ROADMAP.md` as the mandatory future-developer guide.
- [x] Add a concise `README.md` that states what NEXUS is and is not.
- [x] Add `CONTRIBUTING.md` with architecture and workflow expectations.
- [x] Add `CODEOWNERS` placeholder ownership.
- [x] Ensure generated dependencies and build outputs are ignored.
- [x] Stop tracking `node_modules/` in git.
- [ ] Move `worldcities.csv` out of normal git tracking or into verified Git LFS.
- [ ] Verify clone size after dependency cleanup.

Exit criteria: contributors understand the product direction before writing code, and the repository no longer treats installed dependencies as source.

### Phase 1 - Architecture Reset

Goal: prepare the codebase for AAA-scale simulation work.

- [ ] Inventory every top-level function in `src/js/app/sim.js`.
- [ ] Group current behavior into domains: core clock, business, labour, finance, demographics, society, geopolitics, events, persistence glue, and UI glue.
- [x] Define the first-pass domain boundary contract for each module in `requirements/architecture/domain-boundary-plan.md`.
- [x] Create an explicit tick orchestrator that documents the causal order.
- [ ] Move code out of the monolithic simulation file in small, tested slices.
- [ ] Keep each new file below the 800-line target.
- [ ] Preserve save compatibility during every extraction.
- [ ] Keep existing regression and determinism checks green.

Exit criteria: the main simulation entry point orchestrates modules rather than containing most of the simulation.

### Phase 2 - Determinism Foundation

Goal: make every run reproducible and every story auditable.

- [ ] Introduce a single seeded PRNG on world state.
- [ ] Replace direct simulation randomness with domain-specific RNG calls.
- [ ] Fork RNG streams by domain so one feature does not desync unrelated systems.
- [ ] Persist RNG state in saves.
- [ ] Add lint/test enforcement against direct simulation `Math.random` usage.
- [ ] Maintain golden-run state hashes for key horizons.

Exit criteria: same seed plus same inputs produces byte-identical outcomes across save/load and replay.

### Phase 3 - Global Core Loop Binding

Goal: make the world economy interact as one system.

- [ ] Enforce labor supply caps.
- [ ] Enforce demand caps.
- [ ] Enforce capital and liquidity caps.
- [ ] Enforce logistics, resource, and trade-access caps.
- [ ] Enforce housing and cost-of-living migration caps.
- [ ] Make country and bloc conditions flow into firms and households.
- [ ] Make firm and household outcomes flow back into country and bloc conditions.
- [ ] Add property-style tests for each hard constraint.

Exit criteria: global changes propagate through people, households, firms, countries, and blocs without decorative shortcuts.

### Phase 4 - Inequality, Class Mobility, and Family Memory

Goal: make social outcomes central, measurable, and story-visible.

- [ ] Track class position per household and family lineage.
- [ ] Track intergenerational mobility outcomes.
- [ ] Connect education, inheritance, housing, migration, institutions, and labor markets to mobility.
- [ ] Add family status timelines.
- [ ] Add country-level mobility reports.
- [ ] Add inequality-to-institution and inequality-to-social-pressure feedback.
- [ ] Surface class mobility stories in the World Chronicle.

Exit criteria: players can inspect why families rise, fall, or stay trapped across generations.

### Phase 5 - Business and Labor Deepening

Goal: make firms the main bridge between macro systems and household lives.

- [ ] Strengthen founder, leadership, succession, employee, and reputation systems.
- [ ] Tie firm hiring and layoffs to real demand, capital, labor, and logistics conditions.
- [ ] Tie wages and employment to household finances and class mobility.
- [ ] Add explainable company histories.
- [ ] Surface firm collapses, expansions, scandals, and succession crises in the World Chronicle.

Exit criteria: every major company story has visible economic and human consequences.

### Phase 6 - Global Interdependence

Goal: make countries meaningfully affect each other.

- [ ] Model trade dependencies and rerouting pressure.
- [ ] Model migration corridors and talent drift.
- [ ] Model remittance flows.
- [ ] Model global supply-chain exposure by sector.
- [ ] Model bloc-level pressure and spillovers.
- [ ] Connect global shocks to local household, firm, and country outcomes.

Exit criteria: a shock in one region can create believable second- and third-order effects elsewhere.

### Phase 7 - Geopolitical Pressure Without Player Control

Goal: add world pressure systems while preserving autonomous observation.

- [ ] Add elections or leadership transitions as pressure outcomes, not player choices.
- [ ] Add sanctions and trade-war mechanics attached to trade, prices, firms, and households.
- [ ] Add conflict-risk indicators before any direct conflict simulation.
- [ ] Add institutional trust, instability, and policy-stance drift as consequences of material conditions.
- [ ] Surface geopolitics through world reports and causal explanations.

Exit criteria: geopolitics changes the economy and lives without becoming a strategy layer.

### Phase 8 - Emergent Storytelling and World Chronicle

Goal: make the simulation readable as history.

- [ ] Create structured event types for major state changes.
- [ ] Add event significance scoring.
- [ ] Add biographies for people.
- [ ] Add family sagas.
- [ ] Add company histories.
- [ ] Add country reports.
- [ ] Add global newspaper-style summaries.
- [ ] Add decade reports.
- [ ] Connect each story to causal trace evidence.

Exit criteria: the player can understand the world through stories generated from real simulation causes.

### Phase 9 - Watchlists and Investigation

Goal: let players personalize observation without controlling outcomes.

- [ ] Add watchlists for people, families, firms, countries, cities, industries, migration routes, trade routes, and blocs.
- [ ] Prioritize watchlisted events in the World Chronicle.
- [ ] Add timeline views for watched entities.
- [ ] Add why-panels for watched outcomes.
- [ ] Add follow-descendants and follow-successor options.

Exit criteria: players can follow their own slice of the world while the simulation remains autonomous.

### Phase 10 - Performance, Scale, and Release Hardening

Goal: make the global simulation shippable.

- [ ] Define target world sizes and performance budgets.
- [ ] Add performance regression checks.
- [ ] Add memory regression checks.
- [ ] Add save migration tests.
- [ ] Add long-horizon stability tests.
- [ ] Polish the core user surfaces: World Chronicle, watchlists, map, people, firms, countries, class mobility, and why panels.

Exit criteria: a user can open the world, run history, follow entities, and understand major consequences without developer help.

## Current Implementation Map

- `src/js/app/sim.js` remains the legacy primary simulation engine until extracted.
- `src/js/app/sim-core.js` should become the stable orchestration home.
- `src/js/app/sim-business.js` owns business and firm behavior.
- `src/js/app/sim-labour.js` owns labor-market behavior.
- `src/js/app/sim-finance.js` owns finance, credit, capital, and liquidity behavior.
- `src/js/app/sim-demographics.js` owns population, births, deaths, aging, and migration pressure.
- `src/js/app/sim-society.js` owns inequality, class mobility, institutions, and social pressure.
- `src/js/app/sim-geopolitics.js` owns sanctions, blocs, elections, conflict risk, and policy-stance drift.
- `src/js/app/events.js` owns structured event creation and narrative evidence, not missing mechanics.
- `src/js/app/state.js` owns selectors, derived aggregates, and cross-entity indexing.
- `src/js/app/persistence.js` owns save schema, migrations, and compatibility.
- `src/js/app/ui.js` is the legacy UI entry and should be split into World Chronicle, watchlists, map, inspectors, and why panels over time.
- `src/js/app/data.js` owns exogenous baseline data and start presets.
- `src/js/app/map.js` owns geographic presentation, not economic logic.

## Build Gate Template

Every new system must answer these questions before implementation:

1. Which core-loop variables does it read?
2. Which core-loop variables does it write?
3. Which people, households, firms, countries, or blocs can be affected?
4. How can it create upward effects from micro to macro?
5. How can it create downward effects from macro to micro?
6. What degenerate states can it cause?
7. What soft governors prevent collapse or stagnation?
8. What deterministic tests prove it works?
9. What structured events or causal traces make it explainable?
10. How will the World Chronicle summarize it for the user?

## Final Product Promise

NEXUS is successful when a player can watch decades of global history unfold, follow any person, family, company, country, class, or crisis, and understand how economic systems, inequality, migration, business decisions, institutions, and geopolitical shocks created the world they see.
