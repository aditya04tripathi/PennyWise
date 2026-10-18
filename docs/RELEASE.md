# Release

PennyWise 2.0 keeps the PennyWise 1 store identifiers so that it ships as an update rather than a new app:

- iOS: `com.adityatripathi.penny-wise`
- Android: `com.adityatripathi.penny_wise`
- version `2.0.0`, build number / version code `6`

## Gate before release

1. Complete every item in the manual checklist in [TESTING.md](TESTING.md) on a physical iPhone and a physical Android device.
2. Confirm that SQLCipher is active in the release build. The app must start; if encryption were missing, it would show the "Encrypted storage is unavailable" screen.
3. Test the update path: install PennyWise 1, add data, export a backup, install 2.0 over it, then import that backup. See [migration/06-rollback.md](migration/06-rollback.md).
4. Update the store listings: no ads, and on-device storage only. Update the App Privacy and Data Safety forms to say no data is collected.

## Build

Building with EAS is not configured yet and needs an account decision. Local builds:

```bash
npx expo run:ios --configuration Release
npx expo run:android --variant release
```
