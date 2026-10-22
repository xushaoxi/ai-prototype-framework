# Independent final framework review

Reviewed the architecture/specification and implementation plan, AGENTS.md, README and supporting documentation, business definitions, domain/HTTP/UI code, scripts, CI, and tests. History reviewed: `2b5b48f` through `7b9a459`, then fixes `09bf8bd` and `c11c22c`, plus the current UI/form/E2E working changes on 2026-10-22. No implementation, index, or HEAD changes were made by this reviewer; this report is the only repository write.

## Verdict

- **Task 4 SPEC gate: PASS after c11c22c.** Project creation, protected targets, safe module slugs, dry-run, registry/spec generation, real generated-project builds, source exclusions, documentation/workflow, and evidence-producing delivery are implemented. The initial identifier defect and module-loader regression were demonstrated and fixed.
- **Task 4 QUALITY gate: PASS for the stated local framework scope.** Focused independent tests passed, including actual child processes and temporary project builds. This does not substitute for running the final real delivery command against the finished tree.
- **Whole-project code review: no remaining Critical or Important findings in the inspected current code after the fixes below. The root's current production/subdirectory E2E log has now been inspected: 8/8 passed. Final release acceptance is pending the root agent's final full verify/deliver run, archive/content checks, and final evidence record.** Those ongoing operations were deliberately not duplicated by this reviewer. A pass of this review is not a claim that the final release package already exists or was inspected.

## Critical / Important findings, resolved during review

1. **Valid module IDs could break the entire generated application** — `scripts/generate-module.mjs:40` (formerly line 35). In a real clean temporary copy, generating `a-1` and then `a1` both returned success but produced duplicate `generateda1Module` imports; TypeScript reported TS2300. Fixed with an injective slug-to-identifier mapping using underscores. The new regression generates both and builds the actual copy successfully. Business validation hooks are now deliberately omitted from template cloning, so a source module with a function hook remains generatable without inheriting asset-specific rules.

2. **The generated-project quality gate broke on the storage-key re-export** — `scripts/project-modules.mjs:31`. The store fix introduced `export { STORAGE_KEY } from '../core/storage-key'`; the temporary loader only transformed imports, leaving an extensionless re-export in emitted `.mjs`. Independently reproduced the actual Node `ERR_MODULE_NOT_FOUND` in tooling tests. The loader now transforms export declarations too; the copied store/seed check and all focused tests pass.

3. **Stale detail requests could show another record's activity history** — `src/core/ui/LedgerPage.tsx:53`. The original implementation checked the record identity only for `setDetail`, while history/error/loading writes were unconditional. A controlled-response harness executing the actual extracted function reproduced final state `{detail:B, history:A}` after opening A then B and resolving B first. Current code guards all four detail states with the same request token and invalidates the token on close. Running the same independent harness now gives `{detail:B, history:B}`. The real-browser regression also passed in the root's current 8-test production suite; I inspected its actual log.

4. **Visual/evidence assertions omitted relevant material** — `tests/e2e/ledger.spec.ts` and `tests/e2e/fixtures.ts`. Previously the pageerror listener started after initial navigation, console.error was not checked, and successful desktop/mobile images were written under excluded `work/`. Current shared automatic fixture captures from before navigation, narrowly excludes the expected HTTP 503 message only in the intentional failure-scenario test, and successful screenshots are attached in the test output tree collected by delivery. Real CSV/JSON/reset/delete round-trip assertions were added to support the acceptance documentation. The current 8-test production suite passed; archive contents still require the final delivery gate.

5. **Prior Task 2 findings** were checked against `09bf8bd`: shared-store freshness/stale versions, consistent 2MB persistence/export limits, transition validation, safe code suffixes, and persisted-module addition migration all have concrete fixes and new regression coverage. The reachable startup recovery UI allows raw backup before namespace-only reset. The focused domain and HTTP tests pass. No real-backend guarantee was inferred from these changes.

The root independently found a production blank page caused by forced Ant Design chunk splitting. I inspected the removal of that forced group and the production/subdirectory test setup, and read the actual 8/8 passing production log. I did not independently rerun its browser reproduction.

## Minor follow-ups, now resolved

The reset confirmation now says “所有模块”, matching generated modules too. Architecture/new-module guidance now documents declared scalar extensions, normalization of all date fields, synchronized business specifications, the required-field migration caveat, 2MB snapshots, and concurrency limits. No remaining minor finding is required to block this local release.

The root additionally added regressions and fixes for searchable extra fields and deletion being tied to `defaultValues.status` rather than status display ordering. I read those tests and the implementation; the root owns the final full-suite execution including them.

## Independent verification actually performed

- Initial focused run: **24 passed, 1 failed**. The failure was the real generated-project re-export loading regression described above, not ignored.
- Read the root-generated `work/e2e-final-candidate.log`: **8 production browser tests passed in 58.0 seconds**, including early console/pageerror checks, backup/CSV/delete, stale-detail response regression, recovery, and static subdirectory CRUD/refresh. This is reviewed execution evidence from the root, not a test run performed by this reviewer.
- After c11c22c, Node **20.20.0**: `npm test -- tests/tooling/cli.test.ts tests/domain/store.test.ts tests/integration/api.test.ts tests/domain/form-values.test.ts` — **4 files, 29 tests passed**, 56.40 seconds.
- Independently generated the colliding slugs in a temporary project to reproduce TS2300; temporary files were removed. The simultaneous root edit caused a separate transient missing form-values file in that early copied snapshot; that was not reported as a product defect.
- Executed the actual extracted detail-request function before/after the token change with controlled response completion order; wrong-record history reproduced before and absent after.
- Visually inspected the actual desktop and 390px mobile images under `work/`: coherent hierarchy, visible mobile navigation and action controls, explicit horizontal-scroll hint, and the table contained within its card. No overlap/clipping blocker was visible. These images were not represented as screenshots of the final still-changing build.
- Read delivery code and fixture assertions: quality command nonzero exits prevent package creation; skip-e2e marks incomplete; actual command outputs/timestamps/exit codes and SHA-256 inventory are recorded; dependencies, Git, .env files, local work, and symlinks are excluded. New module generation rejects existing targets and rolls back ordinary synchronous write failures. Documented concurrent generator execution remains unsupported.

## Declined-to-judge items and limits

- Did not run full verify/E2E/deliver concurrently with the root agent, inspect the not-yet-generated final archive, or claim pending tests passed. Root must record final command results and inspect packaged successful screenshots and checksums.
- Did not certify screen-reader behavior, a complete keyboard-only audit, WCAG conformance, all browser engines, or every future customized module. Static screenshots support a narrower layout assessment.
- Did not require authentication, server permissions, production locking, multi-process atomic transactions, backend persistence, unlimited audit retention, deployment, or a generalized schema/workflow engine. This is explicitly a local B-level simulation.
- Did not independently prove every red-before-green historical development step from Git snapshots. Focused failures and reruns observed during this review are recorded above.

## Final release evidence added by implementer

After independent review, the implementer completed full verify (34 tests) and production-browser delivery (8 tests), extracted the archive, checked every manifest SHA-256 and required visual evidence. See verification.md and the release manifest. This postscript is implementer verification, not a second independent review.
