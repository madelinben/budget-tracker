# Budget Tracker

Split holiday, night-out and house-share costs, then settle up in the fewest transfers.

- Any number of groups, any number of people, late joiners welcome
- Log who paid and who shares each cost (everyone or a selection)
- Balances to the penny: amounts are stored as whole pence, leftovers never lost
- Settle up suggests who pays who (at most one fewer transfer than people); mark each as paid
- Copy a summary for the group chat
- Data stays in the browser (localStorage). Download a backup file and restore it on any device.

Two ways this repo ships, from the same `src/`:

| Target | How |
|---|---|
| **GitHub Pages** (`madelinben.github.io/budget-tracker/`) | `pnpm build:demo` builds `demo/` into `docs/` (Pages source: `main` / `/docs`) |
| **get-out-there** (Cloudflare) | imported as workspace package `@get-out-there/budget` (`BudgetApp`) |

```bash
pnpm install
pnpm dev          # demo at http://localhost:3104/budget-tracker/
pnpm test         # logic unit tests
pnpm build:demo   # static site -> docs/
```

Package rules: no router/auth/app imports; Tailwind default palette only (no custom tokens); host must `@source` this folder. Peer deps: react, react-dom, lucide-react.

Host hook: `<BudgetApp beforeExport={gate} />` runs `gate(label)` before a backup download or restore (e.g. an ad gate); reject to cancel.
