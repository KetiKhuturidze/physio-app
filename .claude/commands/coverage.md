Show current test coverage and phase gate status.

## Steps

1. Run Jest coverage in silent mode:
```bash
npx jest --coverage --coverageReporters=json-summary --silent 2>/dev/null
```

2. Read `coverage/coverage-summary.json` and extract:
   - Overall statement coverage %
   - Branch coverage %
   - Function coverage %
   - Line coverage %

3. Read `tasks/` to determine current phase (check which phase tasks are in_progress)

4. Output a coverage report:

```
Coverage Report — Phase [N]
──────────────────────────
Statements : XX%   [gate: YY%]  ✓ / ✗
Branches   : XX%   [gate: YY%]  ✓ / ✗
Functions  : XX%   [gate: YY%]  ✓ / ✗
Lines      : XX%   [gate: YY%]  ✓ / ✗

Status: GATE PASSED / GATE FAILED
```

5. If gate failed, list files with lowest coverage that are in current phase scope.
