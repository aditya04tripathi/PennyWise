# 05 · Known gaps

- **Receipts** are not part of PennyWise 1 backups, so they cannot be migrated.
- **No automatic migration:** reading the Hive data in place has not been built. Users must export a backup from PennyWise 1 first.
- **Recurring settings** (frequency, day, month) are imported as schedules. PennyWise 1 never generated occurrences, so the past ones appear as due under Recurring for the user to confirm. Items marked recurring without a valid frequency are imported as one-off transactions and reported.
- **PIN** is intentionally not migrated.
- The **all-time Income/Expenses** cards from PennyWise 1 are replaced by figures for the current month, labelled with the month name.
