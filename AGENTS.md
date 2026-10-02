# Repository Guidelines

## Project Structure & Module Organization

GlucoEasy is a minimal Nightscout-compatible backup service on Cloudflare Workers.
`src/index.ts` handles HTTP routes; `src/durable-object.ts` persists readings,
treatments, profiles, and setup state. Keep normalization and query logic in
`entries.ts` and `treatments.ts`, authentication in `auth.ts`, and page rendering
in `health.ts`. Shared types and response helpers live in `types.ts` and
`responses.ts`.

Tests live in `test/`; screenshots and installation assets live in `docs/images/`.
README files provide English and Spanish guides.
`.specify/` contains Spec Kit configuration and the project constitution;
`.agents/skills/` contains workflow instructions.

## Build, Test, and Development Commands

- `npm ci`: install dependencies from the lockfile.
- `npm run dev`: start the local Wrangler development server.
- `npm run test`: run the Vitest suite once.
- `npm run test:watch`: rerun tests during development.
- `npx tsc --noEmit`: check strict TypeScript types.
- `npm run cf:deploy:dry`: validate deployment bundling without publishing.
- `npm run deploy`: publish the Worker to Cloudflare.

There is no separate build script; Wrangler bundles the application.

## Coding Style & Naming Conventions

Match existing TypeScript: two-space indentation, double quotes, semicolons,
camelCase functions and variables, PascalCase types and classes, and UPPER_SNAKE_CASE
constants. Use descriptive lowercase filenames with hyphens where needed.
Prefer typed interfaces and isolate data transformations from HTTP and storage.
No formatter or linter is configured; follow existing style.

## Testing Guidelines

Use Vitest with `@cloudflare/vitest-pool-workers`. Name files `test/*.test.ts` and
describe behavior in `it(...)` statements. Test helpers directly; use `SELF.fetch`
for Worker–Durable Object integration. Reset integration state between tests.

Cover changed contracts, authentication failures, deduplication, retention, and
setup behavior as applicable. Add regression tests for reproducible defects.
No numeric coverage threshold is configured. Run tests and type checks for
functional changes; run deployment dry checks for bindings or migration changes.

## Commit & Pull Request Guidelines

History includes imperative summaries and recent Conventional Commits. Prefer
`docs:`, `fix:`, `feat:`, or `chore:` with a concrete subject.
PRs must explain behavior changes, validation results, compatibility and data
impacts, and link relevant issues when available. Include screenshots for health
page changes and update both language variants of affected documentation.

## Security & Governance

Follow `.specify/memory/constitution.md`. Preserve the informational backup scope
and supported Nightscout contracts. Never commit secrets or real patient data.
Use `npm run cf:secret:api` to configure `API_SECRET`. `READ_PUBLIC=true` currently
enables public reads; document exposure when changing configuration. Evaluate
stored-data migrations before changing Durable Object identity or schemas.
