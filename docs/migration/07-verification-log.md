# 07 · Verification log

| Check | Result | Evidence |
| --- | --- | --- |
| Plain PennyWise 1 fixture import | PASS | `tests/integration/legacy-import.test.ts` |
| Encrypted fixture (real Dart `cryptography` 2.9.0 output) | PASS | same |
| Wrong password rejected | PASS | same |
| Reconciliation totals (11 rows, 10 accepted; expense 145879, balance 174121 minor units) | PASS | same |
| Write failure mid-import rolls back completely | PASS | same |
| Tampered or truncated encrypted files rejected | PASS | same |
| Duplicate import detection | PASS | same |
| Import on a physical device | NOT RUN | |
| Import of a real user backup | NOT RUN | |
