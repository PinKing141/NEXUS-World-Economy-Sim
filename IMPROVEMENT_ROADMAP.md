# Legacy Engineering Notes

> Superseded for product direction by `ROADMAP.md` and `READ_MY_NEW_ROADMAP.md`. Use this file only as historical engineering context. If this file conflicts with the global autonomous roadmap, the new roadmap wins.


This is an engineering and scope-discipline roadmap, not a feature roadmap.
It exists to take NEXUS from "ambitious hobby codebase" to "shippable, auditable, deterministic simulation."
It supersedes nothing in `ROADMAP.md` — it gates it. No Tier 6+ feature work happens until Phase 2 here is green.

## Operating Principles

1. **One file should fit in one head.** Hard cap: 800 lines per source file.
2. **Determinism is a feature.** If a system uses `Math.random` directly, it is broken.
3. **Every claim must be testable.** "Closure stable" without a property test is marketing.
4. **Cut before you add.** Every new system must remove or fold in an old one, or stay out.
5. **Ship a vertical slice before broadening.** One country, one decade, one causal chain — proven — before scaling.
6. **The roadmap is the backlog.** No work happens that isn't on it. No work stays on it that isn't being done.

---

## Phase 0 — Stop the Bleeding (Week 1)

Nothing else matters until this is done. No feature work in this phase.

- [ ] Remove `node_modules/` from git history with `git filter-repo`. Force-push once, document the rewrite, move on.
- [ ] Confirm `.gitignore` excludes `node_modules/`, `dist/`, `.vite/`, `coverage/`, OS junk.
- [ ] Move `worldcities.csv` (4.9 MB) to Git LFS or out of the repo entirely. Update `.gitattributes` and verify with `git lfs ls-files`.
- [ ] Delete empty stub files (`src/js/app/name-data.js` is 0 lines) or fill them. No empty files in main.
- [ ] Add `LICENSE`, `CONTRIBUTING.md` stub, `CODEOWNERS` (just you for now). Future-you will thank present-you.
- [ ] Add a one-paragraph `README.md` that says what NEXUS *is*, what it *isn't*, and the current playable state. No marketing.

**Exit criteria:** `git clone` is under 10 MB. Repo has zero committed dependencies. Every tracked file has a reason to exist.

---

## Phase 1 — Toolchain Reset (Weeks 2-3)

Modern tooling is non-negotiable at this scale.

- [ ] Adopt **Vite** as the dev server and bundler. Replace `http-server` script.
- [ ] Adopt **TypeScript** in `strict` mode. Migrate file-by-file, starting with `utils.ts`, `state.ts`, then sim modules.
- [ ] Adopt **ESLint** + **Prettier** with a tight config. Wire into `npm run lint` and `npm run format`.
- [ ] Adopt **Vitest** for unit tests. Keep the existing closure scripts as integration tests under `tests/integration/`.
- [ ] Add **GitHub Actions CI**: lint, typecheck, unit tests, integration tests on every PR.
- [ ] Add a **pre-commit hook** (`simple-git-hooks` or `husky`) that runs lint + typecheck on staged files only.
- [ ] Convert `(function(global){ ... })(window)` IIFE modules to **ES modules** with explicit `import`/`export`. Drop the `Nexus` global namespace.
- [ ] Replace every `var` with `const` / `let`. No exceptions.

**Exit criteria:** `npm run ci` runs lint, typecheck, unit, and integration tests, and is green on `main`.

---

## Phase 2 — Determinism Foundation (Weeks 4-5)

The single highest-leverage change in the entire codebase.

- [ ] Introduce a single **seeded PRNG** (mulberry32 or PCG32) on `World.rng`. One algorithm, one seed, one source of truth.
- [ ] Forbid bare `Math.random` via an ESLint rule. CI fails if it appears outside a test fixture.
- [ ] Replace all 76+ `Math.random()` call sites with `world.rng.next()` / `world.rng.range(a,b)` / `world.rng.pick(arr)`.
- [ ] Sub-stream RNGs per domain (`rng.fork("business")`, `rng.fork("migration")`) so adding new business systems doesn't desync demographics.
- [ ] Persist the RNG state in saves. Loading a save must resume exactly where it left off.
- [ ] Add a **golden-run test**: seed `42`, simulate 30 years, hash the world state, assert the hash never changes. This test is sacred. Anything that breaks it is reviewed manually.

**Exit criteria:** Two runs from the same seed produce byte-identical state hashes at year 1, 5, 10, 30. Save → load → continue produces the same trajectory as the uninterrupted run.

---

## Phase 3 — Decompose the Monolith (Weeks 6-9)

`sim.js` is 17,360 lines. This is where it dies.

- [ ] Inventory every top-level function in `sim.js`. Group by domain: business, labour, finance, demographics, society, geopolitics, calendar, RNG, persistence-glue.
- [ ] Move each group into its real home (`sim/business/`, `sim/labour/`, etc.). The existing 21-34 line stub files become real modules.
- [ ] Define a **single typed `World` interface** that every domain reads/writes through. No more shared mutable globals.
- [ ] Define a **tick orchestrator** (`runTick(world, dt)`) that calls each domain's `tick(world, dt)` in a fixed, declared order. The order is the causal chain from `ROADMAP.md`: labour → production → income → consumption → demand → prices → firm decisions → employment.
- [ ] Hard cap any new file at 800 lines. Split further if it grows.
- [ ] Same treatment for `ui.js` (4,321 lines): split by panel, one panel per file, each panel subscribes to the world.

**Exit criteria:** No file in `src/` exceeds 800 lines. `sim.js` no longer exists, replaced by `sim/index.ts` ≤ 200 lines that wires the domains. Type system can prove no domain mutates another's private state.

---

## Phase 4 — Bind the Core Loop (Weeks 10-13)

The roadmap promises a causal chain. Make it real and constrained.

- [ ] Implement and unit-test each link with property-based tests:
  - [ ] **Labour supply caps hiring.** Property: total employed ≤ working-age × participation rate, always.
  - [ ] **Consumer demand caps revenue.** Property: aggregate firm revenue ≤ aggregate household consumption + exports, always.
  - [ ] **Capital and liquidity cap investment.** Property: firm capex ≤ retained earnings + debt headroom, always.
  - [ ] **Housing caps migration.** Property: net inflow to a city ≤ housing slack + new construction.
  - [ ] **Resources cap production.** Property: sector output ≤ input availability × productivity.
- [ ] Add a **"causal trace"** for any single agent: pick a person or firm, get the list of decisions and the inputs that drove each. Render in the UI as a debug panel.
- [ ] Define and freeze the **"feels alive" demo**: one country, 1998 → 2008, observable phenomena (a recession, a migration wave, a sector boom). Write it as a one-page spec. Make it a CI test that asserts those phenomena emerge from seed `1998`.

**Exit criteria:** All five constraint properties pass on 1000+ random seeds. The "feels alive" CI test is green and is the canonical demo.

---

## Phase 5 — Observability (Weeks 14-15)

You can't tune what you can't see.

- [ ] Structured event log: every meaningful state change emits a typed event (`HiringDecision`, `PriceUpdate`, `MigrationFlow`, `FirmFailure`).
- [ ] In-sim time-series ring buffers for the top 20 macro indicators. UI charts read from these directly — no recomputation.
- [ ] **Why panel:** click any number in the HUD, see the last 5 events that moved it.
- [ ] Performance budget: a tick must run in < 16 ms for a 50k-person world. Add a perf test in CI that fails if a fixed scenario regresses by > 15%.
- [ ] Memory budget: heap snapshot test that fails on regressions in steady-state allocation.

**Exit criteria:** Every macro indicator has a "why did this change?" answer reachable in ≤ 2 clicks. Perf and memory regressions break CI.

---

## Phase 6 — Cut the Fat (Week 16)

After Phases 0-5 you will know what's real and what's prose.

- [ ] Walk every `[ ]` in `ROADMAP.md`. For each: keep, defer, or delete. Default to delete.
- [ ] Tier 6 (geopolitics), Tier 8 (storytelling), governors, blocs, sanctions, stock dividend cadence, election machinery — everything not on the path to the "feels alive" demo gets moved to `ROADMAP_DEFERRED.md`. Out of sight, out of scope.
- [ ] Aim to delete **at least 30% of current code** in this phase. Less code is the goal, not more.

**Exit criteria:** `ROADMAP.md` lists only systems that exist or are next. Codebase is smaller than it was at the start of Phase 6.

---

## Phase 7 — Vertical Slice Release (Weeks 17-20)

Ship something.

- [ ] Pick one scenario: 1998 USA → 2008. One save preset, fully tuned.
- [ ] Polish the three panels that matter: people list, firms list, macro chart. Delete or hide everything else behind a debug flag.
- [ ] Public build via GitHub Pages or Cloudflare Pages, served from the Vite output.
- [ ] Write a 500-word post: what you can observe, what you can't, what's next. Link the build.
- [ ] Get 20 people to play it for 10 minutes. Watch the recordings.

**Exit criteria:** A stranger can open a URL, hit play, and within 5 minutes describe an emergent phenomenon they saw without prompting.

---

## Then, and only then, Phase 8+

After the vertical slice ships and the foundation is real:

- Geopolitics layer (Tier 6) — but only the slice that interacts with the core loop (sanctions → trade → demand).
- Multi-country simulation at scale.
- Replay export / scenario sharing.
- Storytelling tools (Tier 8).

These are not on the critical path. Do not start them early. The graveyard of solo sim projects is paved with people who built Tier 8 before Tier 1 was real.

---

## Anti-Goals (things this roadmap explicitly refuses)

- No new gameplay tiers until Phase 4 exits.
- No multiplayer, no modding API, no Steam page, no trailer, no Discord community management. Not yet.
- No engine swap (Unity/Godot/Bevy). The bottleneck is design and discipline, not language.
- No AI/LLM-driven NPCs. Tempting, expensive, and orthogonal to the causal-chain goal.
- No procedural map generation. The map is frozen per `ROADMAP.md` and that decision was correct.

---

## How to use this document

- Work top to bottom. Do not start Phase N+1 until Phase N's exit criteria are green and merged to `main`.
- Each phase is one PR series, not one PR. Small, reviewable, reversible.
- If a phase slips by > 50%, stop and re-scope the phase before continuing. Do not let slip compound.
- Re-read this file at the start of every working session. The point of writing it down is so you can't quietly drift.
