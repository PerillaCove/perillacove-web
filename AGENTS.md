# PerillaCove ~ Integrated Systems

## Commands

- Use `pnpm`, not npm: `pnpm install`, `pnpm run dev`, `pnpm test`, `pnpm exec tsc --noEmit`.
- Read full files before editing. Search with `rg`, then open the actual files.
- Prefer existing modules and helpers over new abstractions.
- DONT DO QA TESTING THAT I CAN USE MY EYES TO DO

## Essence

- PerillaCove is about making integrated systems lucid, visible, and immersive.
- The philosophical anchor is `src/components/Forest/ultimate_truth.html`: integration means flawless turnover, where waste approaches zero.
- Food forests are the current working domain, not the boundary of the app. Future domains may include restaurants, athletics, homes, gardens, relationships, or any lived system where parts can feed and reinforce one another, creating a unified coherent whole.
- Plants are **ingredients** in the forest domain. The forest is designed like a living recipe.
- The canonical system language is **integration**: no waste, flows being harnessed, transformed, and returned.
- Internal element ids are `fire`, `water`, `earth`, `air`.
- User-facing element labels are `Fire`, `Water`, `Earth`, `Air`.
- Use the shared substrate label mapping for element labels. Do not relabel `fire` as Light or `earth` as Soil in UI, docs, tests, or explanations.
- Keep the substrate deterministic: no AI, no trained model, no network calls, no dataset, no rules engine.

## Architecture

- `src/components/IngredientsPage/data/species.ts` is the source data.
- `src/components/Forest/substrate/` is the current integration engine implementation: profiles, structures, transformations, fields, scene assembly, explanations.
- `src/components/Forest/Forest3D/` is the current renderer and authoring surface: 3D scene, time cursor, drag-to-reposition, instancing, lifecycle visuals, field overlays.
- `src/components/Forest/index.tsx` wires selected species, counts, replants, position overrides, timeline state, and Forest3D together.
- Forest, garden, greenhouse, and swale systems should be parameter differences on the same substrate physics, not separate special-case branches.
- Design new systems as integrated-system domains first, then choose the domain-specific language and renderer.

## Forest3D Rules

- The continuous year cursor is the single time control.
- Preserve lifecycle growth/shrink behavior, instanced rendering, fruit behavior, drag-to-reposition, and position overrides.
- Dragging plants updates `positionOverrides`; the substrate reads current 3D positions from the assembled scene.
- Integration view is the default full Forest3D experience except where an embedded preview intentionally uses a constrained/mobile presentation.
- Keep rendering and substrate resolves decoupled so interaction remains smooth.

## Testing Policy

- Keep tests that protect pure logic, math, deterministic integration, profile mapping, turnover, scene assembly, spatial placement, lifecycle timing, and data transformations.
- Avoid adding or repairing tests that only assert visual layout, copy tone, modal sizing, button placement, screenshot-like appearance, or other things a human can directly inspect.
- Do not resurrect deleted or unrelated hub portal tests.
- When changing production TypeScript, run targeted tests or `pnpm exec tsc --noEmit` when useful. Markdown-only changes do not require test runs.

## Editing Discipline

- Keep changes scoped to the user request.
- Do not revert user changes unless explicitly asked.
- Do not use destructive git commands unless the user explicitly requests them.
- Use `apply_patch` for manual edits.
- Prefer small comments only where physics, determinism, or non-obvious data flow needs explanation.
- Never reintroduce compatibility/coherence naming for the integration substrate.
