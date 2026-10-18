# 04 · Reconciliation

These checks run after the writes and before the commit (`replaceWithLegacySnapshot`):

- The transaction, category, and card counts in the database equal the accepted counts.
- The income total and the expense total equal the sum of the exact decimal amounts.
- The balance (excluding future-dated items) equals PennyWise 1's balance rule applied to the same rows.

The UI shows every check. If PennyWise 1's displayed balance, which was computed with doubles, differs from the exact total, the app explains why.

Any mismatch raises `ImportVerificationError`. The transaction rolls back and the user's existing data is left unchanged.
