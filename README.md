# PennyWise 2.0

An offline, private personal finance tracker for iOS and Android. It is a rebuild of the Flutter PennyWise 1 app in Expo, React Native, and strict TypeScript.

Everything stays on the device. There is no account, no server, and no analytics.

## Features

- Income and expense tracking with categories, optional cards, encrypted receipt photos, and search, filters, and sorting
- Multiple accounts with opening balances and transfers between them, which are not counted as income or spending
- Savings goals with contributions and withdrawals
- An overview with the balance, this month's income and spending, a daily average, a budget meter, and a safe-to-spend amount per day
- Planning: month-by-month category breakdown, a 30-day net trend, the monthly budget and per-category limits with notification alerts, and possible subscriptions detected from repeated charges
- A calendar with daily totals and future-dated (scheduled) items
- Recurring transactions (daily, weekly, monthly, yearly). Each due occurrence is recorded only when you confirm it
- Categories with safe removal: archive the category, or move its transactions elsewhere and then delete it
- Cards stored as metadata only: issuer, label, and last four digits
- Encrypted backup and restore (including receipts), CSV export, and import of PennyWise 1 backups with reconciliation checks
- PIN app lock with lockout, the current PIN required before changing or turning off the lock, biometric unlock, auto-lock timing, a privacy overlay in the app switcher, and hidden amounts
- Light and dark appearance

## Tech stack

Expo SDK 57, React Native 0.86, and Expo Router (native tabs and protected stacks). Storage is expo-sqlite with SQLCipher, and keys are kept in expo-secure-store. The app also uses Zustand, Zod, @noble/hashes, @noble/ciphers, Jest, and jest-expo.

## Setup

```bash
pnpm install
pnpm ios        # or: pnpm android  (builds a development client; Expo Go is not supported)
```

SQLCipher and native tabs need a development build. Release builds refuse to start without encryption. If you want an unencrypted database while debugging in development, set `EXPO_PUBLIC_ALLOW_PLAINTEXT_DEV_DATABASE=1` in `.env`.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm lint` | ESLint (Expo config) |
| `pnpm typecheck` | Type-check the app and the tests |
| `pnpm test` / `pnpm test:coverage` | Unit and integration tests |

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Security](docs/SECURITY.md)
- [Testing](docs/TESTING.md)
- [Release](docs/RELEASE.md)
- [Roadmap and implementation matrix](docs/ROADMAP.md)
- [Migration from PennyWise 1](docs/migration/01-source-audit.md)
- [Contributing](CONTRIBUTING.md)

## Screenshots

Not captured yet. Screenshots will be added once the app has been verified on a device (see [Testing](docs/TESTING.md)).
