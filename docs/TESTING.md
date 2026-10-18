# Testing

## Automated (runs in CI)

`pnpm test:coverage` runs 130 tests in 15 suites:

- **Unit tests:** money parsing, arithmetic, and banker's rounding; currency exponents; ledger, budget, and trend calculations; recurrence (month-end clamping, leap years); the recurring schedule and backlog cap; PIN hashing and lockout; transaction-draft validation; the CSV parser and encoder; theme contrast (WCAG); auto-lock timing; safe-to-spend, subscription detection, and account balances; amount-input parsing; and the receipt cipher (round trip, file-name binding, tampering).
- **Integration tests:** these run the real SQL migrations and repositories on `node:sqlite`:
  - Repository queries, filters, totals, and foreign-key behaviour.
  - PennyWise 1 import from fixtures produced by the real Dart code (`tool/legacy_fixture` in the Flutter repo), both plain and AES-GCM encrypted. They cover reconciliation, duplicate detection, rejected rows, and rollback when verification fails.
  - The v2 backup round trip, wrong passwords, tampering, and the atomic restore.
  - Schema v2: the default account, account-integrity triggers, per-account totals including transfers, goal contributions and cascade delete, and a backup round trip of accounts, transfers, and goals.

Coverage is measured for `src/domain` and `src/data` only (89% of lines at the last run). UI and Expo-native modules are not covered by Jest.

The CI pipeline also runs `pnpm lint`, `pnpm typecheck`, and `expo export` for iOS and Android. All of these passed locally.

## Not yet verified

| Area | Status |
| --- | --- |
| iOS simulator dev build | The build succeeded and the app installed on an iPhone 17 simulator. The UI was **not** exercised. |
| Android build | NOT RUN |
| SQLCipher active on device | NOT RUN (only native evidence can confirm `PRAGMA cipher_version`) |
| Biometrics, notifications, camera, share sheet | NOT RUN |
| E2E (Maestro) | Five flows are written in `.maestro/` (onboarding, add expense, accounts and transfer, savings goal, app-lock re-authentication). NOT RUN. Run with `maestro test .maestro` against a dev build; set `APP_ID` for Android. |
| Receipt encryption on device, including migration of existing plaintext receipts | NOT RUN |
| Accounts, goals, category limits, safe-to-spend, and subscription screens | NOT RUN (type-checked and linted only) |
| Import of a real user's PennyWise 1 backup on device | NOT RUN |

## Manual release checklist

1. Fresh install: complete onboarding, set a PIN, then kill and reopen the app. It should be locked.
2. Add an expense with a receipt photo, a future-dated income, and a monthly recurring payment. Check that the overview excludes the future item.
3. Set a budget below the current spending. You should get exactly one notification.
4. Export an encrypted backup, erase all data, and restore it. The counts and receipts should match.
5. Import a PennyWise 1 backup (plain and encrypted). All reconciliation checks should pass.
6. Switch to JPY and then back. Amounts should keep their value, and the confirmation should mention rounding.
7. Enter five wrong PINs. The pause should start, and it should survive an app restart.
8. Add a second account with an opening balance, record an expense on it, and transfer between accounts. Balances should match the formula in the roadmap, and the Home income and spending figures should not change.
9. Give a category a limit below this month's spending. Planning should show it as over, and the next expense in that category should send one alert.
10. Attach a receipt, then check that the file in the app's `receipts` folder ends in `.enc` and is not a readable image.
11. In Settings, change the PIN. It should ask for the current PIN first.
