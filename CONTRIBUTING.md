# Contributing

## Branches

`main` holds released code, and `dev` is for integration. Work on `feature/*` or `fix/*` branches and open pull requests into `dev`. Never commit directly to `main`.

## Commits

Use Conventional Commits (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`) and keep each commit small and atomic. Reference issues as `#<number>`.

## Before opening a pull request

```bash
pnpm lint && pnpm typecheck && pnpm test:coverage
```

In the pull request description, explain what changed and how you tested it. If you touched anything native, list the devices or simulators you tried.

## Rules

- Money is always an integer in minor units (see `src/domain/money`). Never use floating-point arithmetic on amounts.
- Never log amounts, notes, PINs, keys, or receipt data.
- Layers: `domain` (pure logic) → `data` (SQL, import and export formats) → `features` (services and state) → `app` and `components` (UI). Lower layers never import from higher ones.
- Prettier formats the code (tabs, single quotes, width 80).
