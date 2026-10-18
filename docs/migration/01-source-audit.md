# 01 · Source audit (PennyWise 1)

PennyWise 1 is a Flutter app that uses GetX and Hive. Its Hive boxes are **not encrypted**.

| Area | Behaviour in PennyWise 1 |
| --- | --- |
| Amounts | Dart `double` values. Totals accumulate floating-point error |
| Balance | All-time income minus expense, excluding future-dated records |
| Dashboard "Income/Expenses" | All-time figures, shown with a hardcoded `$` |
| Daily average | Current month's expense divided by today's day of the month |
| Recurring | Frequency, day, and month are stored on the transaction, but occurrences are never generated |
| Category `budgetLimit` | Stored but never used |
| PIN | Stored **in plaintext** in secure storage, and included in backups |
| Backup | CSV rows of `type,data` with JSON payloads and CRLF line endings. Optionally prefixed with `ENC` plus a 12-byte nonce, the ciphertext, and a 16-byte GCM tag. The key is PBKDF2-SHA256 with 60,000 iterations, using the UTF-8 bytes of a static hex string as the salt |
| Receipts | Image paths that are not included in backups |
| Ads | An AdMob banner, plus an interstitial when switching tabs |
| IDs | Android `com.adityatripathi.penny_wise`, iOS `com.adityatripathi.penny-wise` |

The Flutter source is left untouched in the repository root.
