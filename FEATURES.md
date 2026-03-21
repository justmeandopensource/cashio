# Cashio — Feature Overview

Cashio is a full-stack personal finance management application supporting multi-ledger tracking, investment management, and detailed analytics.

---

## Authentication & User Management
- Register, login, and logout with JWT-based sessions
- Update profile (name, email) and change password

---

## Ledgers
- Create and manage **multiple independent ledgers** (e.g., personal, family, business)
- Configure per-ledger currency symbol, description, and notes
- Set NAV service (India/UK) for mutual fund price fetching

---

## Accounts
- Create **asset** and **liability** accounts within a ledger
- View balance per account with color-coded indicators
- Filter accounts by type; view creation/update timestamps

---

## Transactions
- Add **income**, **expense**, or **transfer** transactions
- **Split transactions** across multiple categories in a single entry
- **Copy** an existing transaction for quick re-entry
- Edit and delete transactions
- **Advanced filtering:** date range, category, tags (any/all), store, location, type, notes keyword
- Paginated list (50/page); responsive table (desktop) / card (mobile) views
- **Autocomplete suggestions** for notes, store names, and locations based on history

---

## Categories
- Create **income** and **expense** categories
- Hierarchical structure: group categories → subcategories

---

## Tags
- Tag any transaction with one or more tags
- Search/autocomplete while typing; filter transactions by tag combinations

---

## Mutual Funds
- Organize funds under **AMCs** (Asset Management Companies)
- Buy, sell, switch, and transfer units between funds
- Auto-fetch latest NAV from external services (India AMFI / UK)
- Bulk NAV update for all funds at once
- **XIRR** (Internal Rate of Return) calculated per fund
- View full transaction history; edit/delete MF transactions
- Filter by AMC, owner, asset class; hide zero-balance funds
- **Fund Analytics Drawer** — per-fund deep-dive with performance summary cards, cost basis range indicator, NAV timeline with color-coded transaction markers, cumulative investment vs value area chart, and bidirectional transaction history bar chart
- Charts: value by AMC, asset class allocation, yearly investments, corpus growth

---

## Physical Assets
- Create **asset types** (e.g., Gold, Real Estate, Silver)
- Track assets with quantity and price; buy/sell with transaction history
- Update current price; filter by type, owner, name
- Edit/delete asset transactions

---

## Budgets
- Set **monthly or yearly spending limits** per expense category
- Monthly and yearly budgets shown side by side on a single page
- **Progress bars** with colour coding: green (< 75%), orange (75–90%), red (≥ 90%)
- Period summary card showing total budgeted, total spent, and remaining
- Tracks actual spend from both regular and **split transactions**
- Create, edit (amount only), and delete budgets
- Duplicate budget prevention (one budget per category + period)

---

## Insights & Analytics

10+ built-in visualizations:

| Chart | What it shows |
|---|---|
| Income vs Expense Trend | Monthly/yearly income vs spending |
| Current Month Overview | Income, expenses, net balance |
| Category Trend | Spending over time per category |
| Tag Trend | Spending over time per tag |
| Expense by Store | Breakdown by merchant |
| Expense by Location | Breakdown by place |
| Expense Calendar Heatmap | Daily spending density |
| MF Value by AMC | Fund distribution across AMCs |
| MF Asset Class Allocation | Equity/debt/hybrid split |
| MF Yearly Investments | Annual investment amounts |
| MF Corpus Growth | Cumulative investment value over time |

---

## Profile & System
- Update name, email; change password
- **Database backup:** create, list, download, delete, and upload backups
- **Database restore:** restore from any saved backup file (runs as background task)
- View API and system version info

---

## Platform Capabilities
- **Multi-ledger isolation** — data is fully scoped per ledger per user
- **Dark mode** — full light/dark theme support
- **Responsive design** — works on mobile and desktop
- **Optimistic UI** — instant feedback on deletions with rollback on error
- **PWA** — installable as a native-like app on desktop and mobile with auto-updating service worker
