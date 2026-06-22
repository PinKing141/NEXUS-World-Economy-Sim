# NEXUS World Economy Sim

NEXUS is a static prototype for a global, autonomous, observational world-economy simulation. The project aims to simulate how people, families, companies, countries, industries, migration, trade, inequality, institutions, and geopolitical pressure interact to create emergent world history.

NEXUS is **not** a strategy game, policy sandbox, god game, or player-controlled country simulator. The player observes, follows, investigates, and reads the world through chronicles, watchlists, inspectors, and causal explanations.

## Current State

The current implementation is a static web app with legacy simulation modules and regression scripts. The active direction is documented in:

- `ROADMAP.md` - authoritative product and production roadmap.
- `READ_MY_NEW_ROADMAP.md` - mandatory future-developer operating guide.
- `IMPROVEMENT_ROADMAP.md` - legacy engineering notes retained for historical context; follow `ROADMAP.md` first.

## Run Locally

Install dependencies locally, then start the static dev server:

```sh
npm install
npm run dev
```

Open the printed local URL, usually `http://localhost:5173`.

## Validation

Useful checks include:

```sh
npm run test:stability
npm run test:determinism
npm run test:golden-run
```

## Contribution Rule

Before changing simulation behavior, read `READ_MY_NEW_ROADMAP.md`. New simulation work must preserve autonomy, determinism, modular architecture, causal explainability, and global-system consequences.
