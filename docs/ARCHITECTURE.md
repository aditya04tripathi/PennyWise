# Architecture

## Layers

```
src/
  domain/      Pure TypeScript: money, dates, recurrence, ledger/budget/trend calculations, validation, PIN hashing
  data/        SQLite schema and migrations, repositories, PennyWise 1 importer, v2 backup format
  features/    Services and state: session, security, transactions, catalog, backup, recurring, settings, notifications
  hooks/       React bindings (useLedgerQuery, useSettings, useMoneyFormatter, …)
  components/  Design-system UI, finance widgets, charts, forms
  theme/       Tokens and useTheme
  app/         Expo Router routes
```

Dependencies only point downward. `domain` has no React and no Expo imports. It is fully unit-tested.

## Routing

`app/_layout.tsx` opens the encrypted database (`bootstrapSession`) and then picks one of three `Stack.Protected` groups:

| Guard | Route |
| --- | --- |
| Onboarding not completed | `onboarding` |
| Onboarded and locked | `lock` |
| Onboarded and unlocked | `(app)` (native tabs plus pushed and modal screens) |

If the database fails to open, the app shows `DatabaseErrorScreen` instead of falling back to anything.

## Data

- A single SQLCipher database (`pennywise.db`), with a 256-bit random key in SecureStore.
- Versioned migrations through `PRAGMA user_version`. The app refuses to open a database whose schema is newer than it knows.
- Amounts are `INTEGER` minor units, and dates are local wall-clock strings (`YYYY-MM-DDTHH:mm:ss.SSS`).
- Transactions reference a category (`ON DELETE RESTRICT`), a card (`ON DELETE SET NULL`), an account, and optionally a recurring source (`SET NULL`). Account integrity is enforced by triggers. SQLite can't add a column with both `REFERENCES` and a non-null default to an existing table while foreign keys are on.
- Schema version 2 adds `accounts`, `transfers`, `savings_goals`, `goal_contributions`, and `category_budget_alert_log`. Transfers and goal contributions are kept out of income and expense totals.
- Receipt photos are AES-GCM encrypted files beside the database (see `SECURITY.md`).
- Every multi-row write (import, restore, category reassignment, currency rescale) runs in one exclusive transaction.

## State

Zustand (`session-store`) holds the database handle, settings, security configuration, lock state, and a `dataVersion` counter. Screens query through `useLedgerQuery`, which re-runs whenever `dataVersion` changes after a write.

## Insights

`domain/calculations/insights.ts` holds the pure safe-to-spend, subscription-detection, and account-balance functions. `features/insights` and `features/accounts` load data for them from the repositories.

## Recurring transactions

A recurring transaction is a template. `scheduleFor` lists due dates after the latest recorded occurrence. Each occurrence is inserted only when the user confirms it, and a unique index on `(recurrence_source_id, occurrence_date)` prevents duplicates.
