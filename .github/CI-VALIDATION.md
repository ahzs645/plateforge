# Validation scope and local commands

Core unit/build/browser checks remain automatic. Typography validation shares its exact Node 24 / /plateforge/ build with all three browser engines, stamped and checked against github.sha. The separate Iraq/Iran preview and specimen-comparison generation are manual artifact reviews; they no longer duplicate automatic app tests or automatically commit generated reports to a draft branch. The original browser/visual correctness suites remain.

## Local entry points

```sh
npm ci
npm run typecheck
npm test
BASE_PATH=/plateforge/ npm run build
# Full browser/overlay checks: Typography validation → Run workflow.
# Deliberate preview/comparison artifacts: Check Iraq and Iran plates / Compare Iraq and Iran typography.
```

Feature branches without an open PR use local commands. A local pass does not replace validation of the submitted revision. Main/release publication keeps the workflow's existing authorization and artifact conditions.

CI optimization batch: November 7, 2026. Workflow syntax and focused orchestration/selection checks are separate from complete application, native-platform and research validation.
