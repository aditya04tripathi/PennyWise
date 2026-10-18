# 02 · Data mapping

| PennyWise 1 | PennyWise 2 | Rule |
| --- | --- | --- |
| `amount: double` | `amount_minor INTEGER` | `legacyDoubleToMinor`: uses Dart's shortest round-trip string (`String(num)`) and then decimal parsing, never `x * 100` |
| `date` ISO string (microseconds) | Local `YYYY-MM-DDTHH:mm:ss.SSS` | Microseconds are trimmed; the local wall-clock time is kept |
| `isIncome` | `type` | `income` or `expense` |
| Category `icon` (Material codepoint) | `icon` key | Mapped table, with `tag` as the fallback; the codepoint is kept in `legacy_icon_code` |
| Category ARGB `int` | `#RRGGBB` | Alpha is dropped |
| Card number fields | `last_four` only | Anything beyond the last 4 digits is discarded |
| Missing category reference | A recovered category is created | Reported as a warning |
| Missing card reference | `card_id = NULL` | Reported |
| Duplicate IDs | The second one is renamed with a `-2` suffix | Reported |
| Zero or negative amount | Row rejected | Reported |
| PIN | Not imported | Reported; the user sets a new PIN |
| Currency code | `currency_code` | Validated against the registry |
