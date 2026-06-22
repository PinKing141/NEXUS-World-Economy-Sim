# Contributing To NEXUS

Read `READ_MY_NEW_ROADMAP.md` before contributing.

## Product Constraints

- Do not add direct player control over countries, firms, families, people, policy, wars, markets, or central banks.
- Do not add systems that fail to connect to the causal loop in `ROADMAP.md`.
- Do not add fake narrative causes. Storytelling must summarize real simulation evidence.
- Do not turn diagnostic scenario tools into the main user-facing experience.

## Engineering Constraints

- Keep simulation behavior deterministic.
- Do not use direct randomness in simulation code when seeded world RNG is available.
- Keep domain logic modular.
- Avoid expanding monolithic files.
- Preserve save compatibility or add migrations.
- Add or update validation commands for behavior changes.
- Do not commit `node_modules/`, build outputs, local artifacts, or generated dependency folders.

## Preferred Workflow

1. Identify the roadmap phase your work belongs to.
2. Write the causal-loop attachment before implementing.
3. Keep changes small and reversible.
4. Run the narrowest relevant tests first, then broader stability tests when practical.
5. Update documentation when product direction, architecture, or validation changes.
