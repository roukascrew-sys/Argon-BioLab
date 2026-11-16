# Repository Agent Instructions

## Scope & Architecture Protection
- NEVER modify, rename, or reorganize existing files in `src/modules/oncology/` or core Mission Control runners.
- Place all new TypeScript 1 Diabetes (T1D) implementation files inside `src/modules/t1d/`, `src/mission-control/suites/t1d.suite.ts`, and `src/tests/t1d/`.
- Keep `src/modules/t1d/registry/` and `src/modules/t1d/solvers/` 100% pure TypeScript with zero React, DOM, or browser API imports.

## Strict Scientific Fidelity Rules
- NEVER invent, approximate, or hallucinate biological rate constants or physiological bounds.
- Every parameter in `t1dParameterRegistry.ts` must include `id`, `symbol`, `value`, `unit`, `minBound`, `maxBound`, `sourceCitation`, `doi`, and `sourceLocation`.
- Never simplify or linearize the governing ODEs in `hypoimmuneIsletModel.ts`, `isletOxygenDiffusion.ts`, or `dallaManPkPdModel.ts`.

## Verification Loop
- After creating or editing files, always run the test suite (`npm test` / `vitest run src/tests/t1d`) and fix any numerical drift, type error, or failed physiological assertion before concluding.