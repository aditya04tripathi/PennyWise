# Security

## Storage

- The database is encrypted with SQLCipher (AES-256). The key is 32 random bytes in SecureStore with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, so it is not included in device backups or migrated to another device.
- If SQLCipher is not available, the app refuses to start. A plaintext database is only allowed when `__DEV__` is true **and** `EXPO_PUBLIC_ALLOW_PLAINTEXT_DEV_DATABASE=1` is set.
- Android `allowBackup` is `false`.
- Receipt photos are encrypted files. See [Receipts](#receipts).

## Receipts

- Each receipt is encrypted with AES-256-GCM using a separate 32-byte key in SecureStore (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`). Each file gets a random 12-byte nonce. The file name is bound as associated data, so swapping files between transactions fails to decrypt.
- Files are stored as `<name>.enc` with a `PWR1` header. The database keeps the logical name, such as `abc.jpg`.
- Receipts are decrypted in memory and shown from a `data:` URI. Plaintext is never written back to disk.
- Receipts saved by earlier builds in plaintext are encrypted at startup, and the plaintext file is deleted.
- If the receipt key is missing while encrypted files exist, the app will not create a new key. Those receipts show as unavailable and are reported as missing in backups instead of being overwritten.
- In v2 backups, receipts are decrypted and included as base64 inside the encrypted backup. Restoring re-encrypts them with this device's key.
- Erasing all local data deletes the receipt files and the receipt key.
- Not verified on a device yet. The cipher is covered by unit tests; the file storage and the startup migration are not.

## App lock

- The PIN is 4 digits. Only a PBKDF2-SHA256 verifier (random salt, 20,000 iterations) is stored. Comparison is constant-time.
- After 5 failures, PIN entry pauses with increasing delays: 30 s, 60 s, 5 min, 15 min, then 1 h. The lockout state survives app restarts.
- Biometric unlock uses `expo-local-authentication` (strong biometrics only, no device-passcode fallback).
- A forgotten PIN can only be recovered by erasing all local data.
- The app locks when it returns from the background after the configured delay. System pickers and share sheets don't trigger the lock.
- While the lock is enabled, an overlay hides the app's contents in the app switcher. On Android, `FLAG_SECURE` is also applied.
- Changing or turning off the PIN in Settings first asks for the current PIN, or biometrics if enabled. Failed attempts count towards the same lockout.
- Known limitation: a 4-digit PIN only has 10,000 possible values. The lockout throttles guessing in the app, but anyone who can read the keychain could brute-force the verifier offline. The PIN protects against casual access to an unlocked phone. It does not protect the data at rest; SQLCipher does that.

## Backups

- v2 backups use PBKDF2-HMAC-SHA256 (310,000 iterations, random salt) and AES-256-GCM, with the header authenticated as associated data. Passwords must be at least 8 characters.
- Every export is decrypted again and verified before it is shared.
- CSV exports are **not encrypted**, and the UI says so. Cells that start with a formula character are neutralised.

## PennyWise 1 data

PennyWise 1 stored the PIN in plaintext and also put it in backups. The importer **ignores** it, and the import report tells the user to set a new PIN.

## Logging and network

The app has no analytics. Free users see one banner ad from Google AdMob on the five main tabs. Pro removes it, and the ad SDK is not started while Pro is active. Ads are non-personalised: the request does not ask Google to build an ad profile, and no transaction, amount, note, receipt or category is sent with the request. In regions that require it, Google's consent form is shown before any ad loads. Settings has an entry to change those choices. RevenueCat, used for Pro, receives an anonymous app user ID, store receipts, and device and app metadata. It never receives ledger data. The RevenueCat keys in `.env` are public SDK keys, not secrets. The Pro status is cached in SecureStore so it still works offline. No amounts, notes, PINs, keys, or receipts are ever logged.
