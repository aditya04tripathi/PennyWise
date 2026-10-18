# 03 · Migration strategy

PennyWise 2 cannot read PennyWise 1's Hive files in place yet, so migration goes through a backup file:

1. In PennyWise 1, the user exports a backup (encrypted or plain).
2. In PennyWise 2, they choose **Import or restore a backup**, either during onboarding or under Settings → Backup & import.
3. The app detects the format, asks for the password if needed, and parses and validates every row (`parseLegacyBackup`).
4. It shows a preview with counts, rejected rows, and notes. Nothing has been written at this point.
5. Once the user confirms, everything is written in **one exclusive transaction**, which replaces the current data.
6. Reconciliation runs inside that same transaction (see 04). If any check fails, the transaction rolls back.
7. A fingerprint of the file (SHA-256) is recorded. Importing the same file again needs explicit confirmation.
