# 06 · Rollback and recoverability

- The import is atomic. On any failure, the device's existing PennyWise 2 data is left exactly as it was.
- Before an import or restore replaces existing data, the preview warns the user and recommends exporting a backup first.
- The PennyWise 1 backup file itself is never modified.
- Because 2.0 reuses the PennyWise 1 store IDs, installing it replaces PennyWise 1 on the device, and the Hive data is no longer reachable from the UI. **Before release**, decide whether to (a) ask users to export from 1.x before updating, using an in-app notice in a final 1.x release, or (b) build the in-place Hive reader. Until then, keep this risk listed in RELEASE.md.
