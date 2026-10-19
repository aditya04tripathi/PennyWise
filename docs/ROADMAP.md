# Roadmap and implementation matrix

Status labels: **DONE** means implemented and covered by automated tests. **BUILT** means implemented and type-checked, but not yet exercised on a device. **DEFERRED** means not started.

## Core (feature parity)

| Feature                                        | Status                                   | Notes                                  |
| ---------------------------------------------- | ---------------------------------------- | -------------------------------------- |
| Money in integer minor units                   | DONE                                     |                                        |
| Encrypted SQLite and schema migrations         | DONE (SQL) / BUILT (SQLCipher on device) |                                        |
| PennyWise 1 backup import and reconciliation   | DONE                                     | Tested against Dart-generated fixtures |
| v2 encrypted backup and restore                | DONE                                     |                                        |
| CSV export                                     | DONE (encoder) / BUILT (share sheet)     |                                        |
| Onboarding                                     | BUILT                                    |                                        |
| PIN, lockout, and biometrics                   | DONE (hashing and lockout) / BUILT (UI)  |                                        |
| Auto-lock and privacy overlay                  | DONE (timing rule) / BUILT               |                                        |
| Overview                                       | DONE (calculations) / BUILT              |                                        |
| Transactions: create, edit, delete, and detail | BUILT                                    |                                        |
| Search, filters, sort, pagination              | DONE (queries) / BUILT                   |                                        |
| Receipts                                       | BUILT                                    | Not included in PennyWise 1 backups    |
| Categories, archiving, and reassignment        | DONE (repository) / BUILT                |                                        |
| Cards (metadata only)                          | DONE (validation) / BUILT                |                                        |
| Monthly budget and alerts                      | DONE (one alert per crossing) / BUILT    |                                        |
| Calendar                                       | DONE (day summaries) / BUILT             |                                        |
| Recurring transactions (confirm-to-post)       | DONE (schedule) / BUILT                  |                                        |
| Currency change with rescaling                 | DONE / BUILT                             | No exchange-rate conversion            |
| Appearance and hidden amounts                  | BUILT                                    |                                        |
| Delete all data                                | BUILT                                    |                                        |

## Enhancements

| Item                                              | Priority | Status                                                                 |
| ------------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| E2E suite (Maestro)                               | P1       | WRITTEN, NOT RUN (`.maestro/`, five flows)                             |
| Per-category budgets                              | P1       | DONE (alert log, limit query) / BUILT (editor, Planning, notification) |
| Encrypting receipt files at rest                  | P1       | DONE (cipher) / BUILT (file storage, migration of existing files)      |
| Re-authentication before changing the PIN         | P1       | BUILT                                                                  |
| Multiple accounts and transfers                   | P2       | DONE (schema, repository, balances, backup) / BUILT (screens)          |
| Savings goals                                     | P2       | DONE (repository, backup) / BUILT (screens)                            |
| Subscription detection                            | P2       | DONE (detector) / BUILT (Planning list, make recurring)                |
| Safe-to-spend                                     | P2       | DONE (calculation) / BUILT (Home)                                      |
| PennyWise Pro (RevenueCat paywall)                | —        | DONE (entitlement rules, plan selection) / BUILT (paywall, Customer Center, gates), NOT RUN on a store |
| Reading the Hive data in place (no manual backup) | P2       | DEFERRED                                                               |
| Home-screen widgets                               | P3       | DEFERRED                                                               |
| Localisation                                      | P3       | DEFERRED                                                               |

### How the enhancements behave

- **Accounts and transfers.** Schema version 2 adds an `accounts` table with a `main` account. Every existing transaction is assigned to `main`. Triggers reject transactions that point at unknown accounts, and stop an account with history from being deleted (it can be archived instead). An account balance is its opening balance plus income, minus expenses, plus transfers in, minus transfers out. Transfers never count as income or spending, so the Home balance and monthly totals are unchanged. Account pickers and filters only appear once a second account exists.
- **Savings goals.** Contributions and withdrawals are recorded against a goal and do not move money between accounts. Deleting a goal deletes its history.
- **Per-category budgets.** Set an optional monthly limit in the category editor. Planning shows progress for each limited category. When budget alerts are on, saving an expense that crosses the threshold or the limit sends one notification per category, level, and month.
- **Safe-to-spend.** This is the budget (or, with no budget, this month's income) minus spending so far and minus recurring expenses still due this month, divided by the days left including today. It rounds down and shows zero once overspent. Without a budget or income it is hidden.
- **Subscription detection.** Groups expenses from the last 400 days by normalised description. A group needs at least three charges, amounts within 10% of each other, and every gap weekly (6–8 days), monthly (27–33), or yearly (355–375). Items that are already recurring are excluded. Choosing "Make recurring" turns the latest charge into a recurring item. Later charges are suggested for confirmation and never posted automatically.
- **Receipt encryption.** See [SECURITY.md](SECURITY.md#receipts).
- **Re-authentication.** Changing the PIN or turning off app lock requires the current PIN, or biometrics if enabled. Wrong entries count towards the same lockout as the lock screen.

### PennyWise Pro

Pro is sold through RevenueCat as a monthly subscription, a yearly subscription, or a lifetime purchase. The paywall is RevenueCat's, and subscribers manage or cancel it in Customer Center. It unlocks more than one account, new savings goals, new or changed category limits, safe-to-spend, and the subscription list. Everything from PennyWise 1 stays free, and data the user already created stays usable without Pro. Existing accounts, goals, and limits keep working and can be edited or removed. The rules live in `domain/entitlements.ts` and are enforced in the services as well as the UI.

### Deferred, with reasons

- **Reading Hive in place.** PennyWise 1 stored data with custom Hive type adapters in a binary format. Reading it needs a reimplementation of those adapters plus file access to the old app's sandbox, which a separate app cannot get on iOS. The supported path is the CSV backup from PennyWise 1.
- **Home-screen widgets.** These need native widget extensions (WidgetKit and Glance), an app group, and a way to share data while the database stays keychain-locked. That is a separate native project.
- **Localisation.** This needs every user-facing string extracted and translated, plus locale-aware date and number review. It is too large to fold into this pass without risking regressions.
