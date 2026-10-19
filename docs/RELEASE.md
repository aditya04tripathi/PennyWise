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

## PennyWise Pro (RevenueCat)

1. In App Store Connect and Google Play, create three products: a non-consumable `lifetime`, and auto-renewing subscriptions `yearly` and `monthly`.
2. In RevenueCat, attach all three to the entitlement `penny_wise_pro`. Put them in the current offering as packages whose identifiers are exactly `lifetime`, `yearly` and `monthly`. Design a paywall for that offering, and turn on Customer Center.
3. Copy `.env.example` to `.env` and fill in the public SDK keys. The Test Store key works for both platforms. Restart Metro after changing `.env`.
4. Rebuild the native app. Expo Go cannot show the paywall. Without keys, the Pro screen says purchases are not set up.
5. Test with a sandbox account: buy each plan from the paywall, restore, cancel or refund (Pro should drop when the entitlement ends), manage the subscription in Customer Center, and launch offline (the cached Pro status should still apply).

## Ads

The native project currently uses Google's sample AdMob app IDs, so a development build shows test ads. Before a store release, replace `androidAppId` and `iosAppId` in `app.json` with the app's own AdMob app IDs and rebuild. Set `EXPO_PUBLIC_ADMOB_IOS_BANNER_UNIT_ID` and `EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID` for the release banner units. A release build with those variables empty shows no ad. Confirm that buying Pro removes the banner and that a fresh Pro install never initialises the ad SDK.
