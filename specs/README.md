# Specification workflow

The [existing service baseline](001-baseline-backup-service/spec.md) documents implemented behavior through reverse engineering. Its [contracts](001-baseline-backup-service/contracts.md) and [evidence and gaps](001-baseline-backup-service/evidence.md) distinguish observed behavior from unverified coverage and future corrections. The baseline is awaiting owner review; it does not approve exceptions to the constitution.

For each future change:

1. Use `$speckit-specify` to create a new feature describing the problem, scope and acceptance criteria before changing code. Reference the affected baseline requirements and contracts.
2. Use `$speckit-clarify` if material ambiguities remain.
3. Use `$speckit-plan` to design the change and check the constitution, compatibility and data impact.
4. Use `$speckit-tasks`, then `$speckit-analyze`, to prepare and review implementation work.
5. Use `$speckit-implement` and run the required checks for the change.
6. Review outcomes and update the affected baseline contracts when behavior changes. Use `$speckit-converge` when comparing implementation with a feature's spec, plan and tasks.

The [retrospective plan](001-baseline-backup-service/plan.md) completes the baseline with its existing stack, architecture, data model and validation guide. It does not reconstruct the service or mark historical tasks as completed. Pending corrections require their own scope and acceptance criteria before generating tasks. `.specify/feature.json` is the local active-feature pointer; new specifications update it automatically. Specifications use the default `specs/` directory, independently of branch naming.

Versión española: [README.es.md](README.es.md).
