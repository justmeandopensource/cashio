# Cashio UI Enrichment Plan

> **Purpose:** This document captures a comprehensive analysis of the Cashio UI and lists all recommended improvements to make it more information-rich, intuitive, and comparable to commercial finance apps. Each item is self-contained so it can be picked up independently.
>
> **Date:** 2026-04-01
>
> **How to use:** Share this file with Claude Code when ready to implement any item. Each recommendation includes the current state, what to change, which files/APIs are involved, and whether backend work is needed.

---

## Table of Contents

1. [Home Page Dashboard](#1-home-page-dashboard)
2. [Ledger Accounts Tab](#2-ledger-accounts-tab)
3. [Account Detail Page](#3-account-detail-page)
4. [Transactions](#4-transactions)
5. [Categories Page](#5-categories-page)
6. [Budget Page](#6-budget-page)
7. [Net Worth Page](#7-net-worth-page)
8. [Insights Page](#8-insights-page)
9. [Mutual Funds](#9-mutual-funds)
10. [Physical Assets](#10-physical-assets)
11. [Global / Cross-Cutting Improvements](#11-global--cross-cutting-improvements)
12. [Priority Ranking](#12-priority-ranking)

---

## 1. Home Page Dashboard

**Current state:** The home page (`frontend/src/features/home/`) shows only a grid of ledger cards. Each card displays the ledger name, currency symbol badge, description, and creation date. There is no financial data shown.

**Key files:** `Home.tsx`, `HomeMain.tsx`, `HomeLedgerCards.tsx`, `HomeMainHeader.tsx`

**Recommendations:**

### 1.1 Net Worth Summary Banner

- Display a banner at the top of the home page showing total assets, total liabilities, and net worth across the user's primary ledger (or a selected one).
- **API available:** `GET /ledger/{ledgerId}/net-worth` returns `net_worth`, `total_assets`, `total_liabilities`.
- **Backend changes:** None required. Frontend needs to call net-worth endpoint on home page load for the user's default/first ledger.

### 1.2 Current Month Snapshot

- Show a card with: total income this month, total expenses this month, net savings, and savings rate percentage.
- **API available:** `GET /ledger/{ledgerId}/insights/current-month-overview` returns `total_income`, `total_expense`, and category breakdowns.
- **Backend changes:** None. The data exists. Frontend needs to call this endpoint and display a summary card.

### 1.3 Recent Transactions List

- Show the last 5-10 transactions as a compact list below the summary, with date, category, amount, and account name. Each item links to the full transaction view.
- **API available:** `GET /ledger/{ledgerId}/transactions?page=1&per_page=10` returns paginated transactions.
- **Backend changes:** None.

### 1.4 Budget Alerts

- Show a small alert section listing any budget categories that are over budget or approaching their limit (e.g., >=80% used).
- **API available:** `GET /ledger/{ledgerId}/budgets?period=monthly` returns budgets with `amount` and `actual_spend` fields.
- **Backend changes:** None. Frontend filters budgets where `actual_spend / amount >= 0.8`.

### 1.5 Quick Action Buttons

- Add prominent "Add Transaction" and "Transfer Funds" buttons directly on the home page so users don't have to navigate into a ledger first.
- **Backend changes:** None. These modals already exist as shared components (`CreateTransactionModal`, `TransferFundsModal`).

### 1.6 Sparkline Mini-Charts on Ledger Cards

- On each ledger card, show a tiny sparkline (last 6 months income vs expense trend).
- **API available:** `GET /ledger/{ledgerId}/insights/income-expense-trend?period_type=last_12_months` returns `trend_data` array of `{period, income, expense}`.
- **Backend changes:** None. Frontend needs to call this per ledger and render a small SVG sparkline or use a lightweight chart lib.

---

## 2. Ledger Accounts Tab

**Current state:** The accounts tab (`frontend/src/features/ledger/components/LedgerMainAccounts.tsx`) groups accounts by type (asset/liability) and shows each account as a row with name, owner initials, balance, and hover action icons (add transaction, transfer).

**Key files:** `LedgerMainAccounts.tsx`, `LedgerAccountSection.tsx`, `LedgerAccountCard.tsx`

**Recommendations:**

### 2.1 Summary Row Per Account Group

- At the top of each account group (Assets, Liabilities), show a summary: "Assets: 5 accounts | Total: $XX,XXX" and "Liabilities: 3 accounts | Total: $YY,YYY".
- **API available:** `GET /ledger/{ledgerId}/accounts` returns all accounts with `net_balance`. Sum client-side per type.
- **Backend changes:** None.

### 2.2 Account Subtype Icons

- Add small icons to visually distinguish account subtypes: a credit card icon for credit_card, a piggy bank for savings_account, a building for fixed_deposit, a banknote for cash, etc. Currently all accounts look the same visually.
- The account `subtype` field is already returned by the API. Use lucide-react icons mapped to each subtype.
- **Backend changes:** None.

### 2.3 Last Activity Indicator

- Show how recently the account had a transaction. Display as "3d ago", "2mo ago" or a colored dot (green = active in last 30 days, yellow = 30-90 days, gray = 90+ days).
- **API available:** `GET /ledger/{ledgerId}/account/{accountId}/summary` returns `last_transaction_date`. However, calling this per account would be N+1 queries.
- **Backend changes:** Consider adding `last_transaction_date` to the accounts list endpoint response to avoid N+1 calls. Alternatively, create a batch summary endpoint.

### 2.4 Mini Balance Trend Indicator

- Show a tiny up/down arrow or sparkline next to the balance indicating the balance direction vs last month.
- **Backend changes:** Would need a lightweight endpoint or field returning balance change delta. Could compute from recent transactions.

---

## 3. Account Detail Page

**Current state:** The account detail page (`frontend/src/features/account/`) shows a header with account name, balance badge, type/subtype, and owner. Below that: summary stats cards (total credit, total debit, transaction count, first/last transaction dates), insights charts (income/expense trend, top categories), and transaction list.

**Key files:** `Account.tsx`, `AccountMain.tsx`, `AccountSummaryStats.tsx`, `AccountInsights.tsx`, `AccountMainTransactions.tsx`

**Recommendations:**

### 3.1 Monthly Average Spend/Income

- Derive from existing summary data: total_credit / number_of_months_active and total_debit / number_of_months_active. Display as "Avg monthly income: $X | Avg monthly expense: $Y".
- **API available:** `AccountSummary` already returns `total_credit`, `total_debit`, `first_transaction_date`, `last_transaction_date`. Compute months from date range.
- **Backend changes:** None. Pure frontend calculation.

### 3.2 Running Balance Chart

- A line chart showing the account balance over time (cumulative). This is different from the income/expense trend -- it shows the actual balance progression.
- **Backend changes:** New endpoint needed: `GET /ledger/{ledgerId}/account/{accountId}/balance-history` returning `[{date, balance}]` computed by cumulating transactions chronologically from opening_balance.

### 3.3 Top Recurring Transactions

- Detect repeated patterns: same store + same category + similar amount appearing monthly. Surface as "Recurring: Netflix ($15/mo), Rent ($2,000/mo)".
- **Backend changes:** New endpoint or computation needed. Could analyze transactions server-side for store+category+amount patterns with monthly frequency. Alternatively, do client-side analysis of loaded transactions.

### 3.4 Account Health Indicator

- Contextual per account subtype:
  - **Credit card:** Utilization % (balance / credit limit if tracked, or just show balance with a warning color if high)
  - **Savings:** Growth rate (% change over last 3 months)
  - **Loan:** Payoff progress (original amount vs current balance, if opening_balance is set)
- **Backend changes:** Minimal. Most can be derived from existing data. Credit limit would need a new field on the account model.

---

## 4. Transactions

**Current state:** Transactions (`frontend/src/features/transactions/`) are shown as cards (mobile) or table rows (desktop). Each shows date, category, amount, notes, and expandable details for splits/transfers. Filters include date range, category, account, tags, type, store, location. Tags and store/location are present but not visually prominent.

**Key files:** `Transactions.tsx`, `TransactionCard.tsx`, `TransactionTable.tsx`, `TransactionFilter/index.tsx`, `TransactionFilterStats.tsx`

**Recommendations:**

### 4.1 Transaction Stats Bar

- When viewing any filtered set of transactions, show a persistent summary bar: "Showing 47 transactions | Total credit: $X | Total debit: $Y | Net: $Z | Avg transaction: $W | Largest: $V".
- **API available:** The paginated transactions response already returns `total_credit`, `total_debit`, `net_amount`, `total_transactions`. Only avg and largest need client-side calculation.
- **Backend changes:** None (or optionally add `avg_amount` and `max_amount` to the response).

### 4.2 Store and Location Chips

- Make `store` and `location` fields more visible by rendering them as colored chips/badges in the transaction card/row rather than plain text.
- **Backend changes:** None. Pure styling change.

### 4.3 Prominent Tag Badges

- Render tags as colored badge pills (similar to GitHub labels) instead of small text. Use consistent colors per tag across the app.
- **Backend changes:** None. Could optionally add a `color` field to tags in future.

### 4.4 "Similar Transactions" Links

- When viewing/expanding a transaction, show quick links: "View all at this store", "View all in this category", "View all with this tag". These link to the transactions page with the appropriate filter pre-applied.
- **Backend changes:** None. These are just links with query parameters that map to existing filter functionality.

### 4.5 Calendar View Toggle

- Allow toggling between the list/table view and a calendar heatmap view directly within the transactions page. The calendar heatmap data already exists.
- **API available:** `GET /ledger/{ledgerId}/insights/expense-calendar` returns `[{date, amount}]`.
- **Backend changes:** None. The chart component `ExpenseCalendarHeatmap.tsx` already exists in insights -- reuse it.

---

## 5. Categories Page

**Current state:** The categories page (`frontend/src/features/categories/`) shows two columns: income categories and expense categories. Each displayed as a hierarchical tree with indentation. Only management operations (create, create subcategory) are available. No financial data shown.

**Key files:** `Categories.tsx`, `CategoriesMain.tsx`

**Recommendations:**

### 5.1 Spending Totals Per Category

- Next to each category name, show: "This month: $X | All time: $Y".
- **API available:** `GET /ledger/{ledgerId}/insights/current-month-overview` returns per-category breakdowns. For all-time, could use `GET /ledger/{ledgerId}/insights/category-trend?period_type=all_time`.
- **Backend changes:** May need a lightweight endpoint that returns total spend per category for a given period. Could also compute from existing endpoints.

### 5.2 Category Trend Sparkline

- A tiny inline sparkline chart next to each category showing spending trend for the last 6 months.
- **API available:** `GET /ledger/{ledgerId}/insights/category-trend` returns trend data, but for a single selected category. Would need to call per category or get a batch endpoint.
- **Backend changes:** Consider a batch endpoint returning monthly totals for all categories in one call.

### 5.3 Percentage of Total Spend

- Show each expense category's percentage of total expenses: "Groceries: 23% of total expenses".
- **API available:** `current-month-overview` returns values per category. Compute percentages client-side.
- **Backend changes:** None.

### 5.4 Click-to-Filter Navigation

- Clicking on a category name navigates to the transactions page filtered by that category: `/ledger?tab=transactions&category_id=XXX`.
- **Backend changes:** None. Just navigation with query params.

### 5.5 Unused Category Indicator

- Flag categories that have zero transactions with a subtle "No transactions" label or a dimmed style. Helps users clean up unused categories.
- **Backend changes:** Need category usage counts. Could be a new endpoint or added to the category list response.

---

## 6. Budget Page

**Current state:** The budget page (`frontend/src/features/budget/`) shows two columns: monthly budgets and yearly budgets. Each budget card shows category name, spent/limit ratio, remaining amount, and a progress bar. A summary card shows total budgeted and total spent.

**Key files:** `Budget.tsx`, `BudgetList.tsx`, `BudgetItem.tsx`, `BudgetProgressBar.tsx`, `BudgetSummaryCard.tsx`, `BudgetModal.tsx`

**Recommendations:**

### 6.1 Enhanced Summary Card

- Expand the summary to include: "Total budgeted: $X | Total spent: $Y | Total remaining: $Z | Categories over budget: N | Categories at risk (>80%): M".
- **API available:** All data already returned by the budgets endpoint. Compute counts client-side.
- **Backend changes:** None.

### 6.2 Historical Budget Comparison

- Show "vs last month" delta for each budget category: "Dining: $450 spent vs $380 last month (+18%)".
- **Backend changes:** Need a new endpoint or parameter to return previous period's actual spend for comparison. E.g., `GET /ledger/{ledgerId}/budgets?period=monthly&compare_previous=true`.

### 6.3 Projected End-of-Month Spend

- Extrapolate from current spending rate: if today is the 15th and $500 spent, project ~$1,000 by month end. Display as "Projected: $1,000 (over budget by $200)".
- **Backend changes:** None. Pure frontend calculation using current date and spend rate.

### 6.4 Unbudgeted Spending Alert

- Identify expense categories that have transactions this month but no budget set. Show a section: "Unbudgeted categories with spending: Transport ($120), Subscriptions ($45)".
- **API available:** Compare budget category IDs against current-month-overview expense categories.
- **Backend changes:** None. Cross-reference two existing endpoints client-side.

### 6.5 Sort by Urgency

- Default sort budgets by % used (descending) so the most at-risk categories appear first. Add a toggle to switch between "By urgency" and "Alphabetical".
- **Backend changes:** None. Client-side sort.

---

## 7. Net Worth Page

**Current state:** The net worth page (`frontend/src/features/net-worth/`) shows three summary cards (net worth, total assets, total liabilities) using a hero card design. Below that: an asset allocation pie chart and portfolio composition breakdown.

**Key files:** `NetWorth.tsx`, `NetWorthMain.tsx`, `NetWorthSummary.tsx`, `AssetAllocationChart.tsx`, `PortfolioComposition.tsx`

**Recommendations:**

### 7.1 Net Worth Trend Over Time

- The most impactful addition: a line chart showing monthly net worth progression. This is the #1 most requested feature in personal finance apps.
- **Backend changes:** **New endpoint required.** `GET /ledger/{ledgerId}/net-worth/history` would need to compute historical net worth snapshots. Options:
  - Compute retroactively from transaction history (reconstruct balance at each month-end).
  - Or store periodic snapshots (a new table `net_worth_snapshots` with `{date, net_worth, total_assets, total_liabilities}`).
  - The retroactive approach is more accurate but compute-intensive. Snapshotting is simpler but requires a scheduled job.

### 7.2 Asset Allocation Drill-Down

- Make the asset allocation pie chart interactive: clicking "Bank Accounts" expands to show individual account contributions, clicking "Mutual Funds" shows per-fund values.
- **API available:** The net-worth response already includes `asset_accounts`, `mutual_funds`, `physical_assets` arrays with individual values.
- **Backend changes:** None. Frontend interactivity only.

### 7.3 Liability Payoff Timeline

- For loan-type accounts, project when they'll be paid off at the current monthly payment rate. Show as "Estimated payoff: March 2028 (23 months)".
- **Backend changes:** Needs average monthly payment computed from transaction history for loan accounts. Could be a new computed field.

### 7.4 Month-over-Month Net Worth Change

- On the net worth hero card, show "+$2,340 from last month (+3.2%)" or the equivalent delta.
- **Backend changes:** Requires either the history endpoint from 7.1, or a simpler endpoint returning just the previous month's net worth for comparison.

### 7.5 Goal Tracking

- Allow users to set a net worth target and show progress: "Target: $100,000 | Current: $67,500 | Progress: 67.5%".
- **Backend changes:** New model/table for financial goals. New CRUD endpoints for goals. Frontend goal-setting modal and progress bar.

---

## 8. Insights Page

**Current state:** The insights page (`frontend/src/features/insights/`) has a dropdown selector to choose 1 of 11 visualization types. Only one chart is visible at a time. A ledger selector is at the top.

**Key files:** `Insights.tsx`, `InsightsMain.tsx`, `InsightsMainCharts.tsx`, and 11 chart components in `insights/components/charts/`

**Recommendations:**

### 8.1 Multi-Chart Dashboard Layout

- Show 3-4 key charts simultaneously instead of one at a time. Suggested layout:
  - **Top row:** Income/expense trend (half width) + Current month overview (half width)
  - **Bottom row:** Top spending categories (half width) + Calendar heatmap (half width)
- Keep the single-chart drill-down view accessible via "Expand" or "View details" on each chart.
- **Backend changes:** None. Multiple API calls in parallel.

### 8.2 Key Metrics Banner

- A persistent stats bar at the top: "This month: Income $X | Expenses $Y | Net savings $Z | Savings rate: W%".
- **API available:** `current-month-overview` provides the data.
- **Backend changes:** None.

### 8.3 Period Comparison

- Side-by-side comparison: "This month vs last month" or "This year vs last year" showing income, expense, and savings deltas with % change.
- **API available:** `income-expense-trend` returns multiple periods. Extract and compare adjacent periods.
- **Backend changes:** None for basic comparison. A dedicated comparison endpoint would be cleaner.

### 8.4 Anomaly Highlighting

- In the income/expense trend chart, visually highlight months with unusually high spending (e.g., >1.5x the average). Use a different color or an annotation marker.
- **Backend changes:** None. Compute mean and standard deviation client-side from the trend data. Flag outliers.

### 8.5 Chart-to-Transactions Drill-Down

- Clicking on a bar/slice in any chart navigates to the transactions page with appropriate filters pre-applied. E.g., clicking "March 2026" bar in the trend chart goes to `/ledger?tab=transactions&from_date=2026-03-01&to_date=2026-03-31`.
- **Backend changes:** None. Navigation with query parameters.

---

## 9. Mutual Funds

**Current state:** The mutual funds section (`frontend/src/features/mutual-funds/`) has an Overview tab (funds grouped by AMC with cards showing name, plan, code, NAV, units, value, P&L) and a Transactions tab (buy/sell/switch history). Filters by AMC, owner, asset class, zero balance, and search.

**Key files:** `MutualFunds.tsx`, `MutualFundsOverview.tsx`, `FundCard.tsx`, `MfTransactions.tsx`, `FundAnalyticsDrawer.tsx`

**Recommendations:**

### 9.1 Portfolio Summary Header

- A prominent header card: "Total invested: $X | Current value: $Y | Total P&L: $Z (W%) | Overall XIRR: V%".
- **API available:** `GET /ledger/{ledgerId}/mutual-funds` returns all funds with `total_invested_cash`, `current_value`, `total_realized_gain`, `xirr_percentage` per fund. Aggregate client-side.
- **Backend changes:** None for basic aggregation. A portfolio-level XIRR would need a new computation (the current XIRR is per-fund).

### 9.2 Asset Class Allocation Pie (Inline)

- Show the asset class allocation pie chart directly on the MF overview page, not only in Insights. The data and chart component already exist.
- **API available:** Mutual funds have `asset_class` and `asset_sub_class` fields. Group and sum `current_value` by asset class.
- **Backend changes:** None. Reuse existing `MutualFundsAssetClassAllocation` chart component.

### 9.3 Individual Fund NAV Sparklines

- On each fund card, show a tiny sparkline of NAV history over the last 6-12 months.
- **Backend changes:** Would need a NAV history endpoint per fund: `GET /ledger/{ledgerId}/mutual-fund/{fundId}/nav-history`. Could derive from MF transaction dates + NAV values, or store NAV update history.

### 9.4 Day/Recent Change Indicator

- If NAV was recently updated, show the change: "+2.3% since last update" or "NAV updated 3 days ago".
- **API available:** Funds have `latest_nav` and `last_nav_update`. Would need previous NAV to compute change.
- **Backend changes:** Store previous NAV on update, or derive from transaction history.

### 9.5 SIP Pattern Detection

- Detect regular monthly investments in a fund and surface: "Monthly SIP: ~$5,000/month since Jan 2024".
- **Backend changes:** Analyze buy transaction frequency and amounts for regularity patterns. Could be a backend service or client-side analysis of transaction data.

### 9.6 Fund Comparison Table

- A table view showing all funds side-by-side with columns: Name, Invested, Current Value, P&L, XIRR, Holding Period, Asset Class.
- **API available:** All data already in the mutual funds list response.
- **Backend changes:** None. Pure frontend table component.

---

## 10. Physical Assets

**Current state:** The physical assets section (`frontend/src/features/physical-assets/`) has an Overview tab (asset types with assets listed showing name, quantity, unit price, current value) and a Transactions tab (buy/sell history). Filters by asset type, zero balance, search.

**Key files:** `PhysicalAssets.tsx`, `PhysicalAssetsOverview.tsx`, `PhysicalAssetsTable.tsx`, `AssetTransactionHistory.tsx`

**Recommendations:**

### 10.1 Portfolio Summary Header

- A summary card: "Total invested: $X | Current value: $Y | Unrealized P&L: $Z (W%)".
- **API available:** Physical assets have `total_quantity`, `average_cost_per_unit`, `latest_price_per_unit`, `current_value`. Compute total invested as `sum(total_quantity * average_cost_per_unit)` and total value as `sum(current_value)`.
- **Backend changes:** None. Or use the existing `PhysicalAssetSummary` which returns `total_value`, `total_unrealized_pnl`, `total_unrealized_pnl_percentage`.

### 10.2 Price History Chart Per Asset

- Show a chart of price changes over time for each asset (from price update records and transaction prices).
- **Backend changes:** Need a price history endpoint: `GET /ledger/{ledgerId}/physical-asset/{assetId}/price-history`. Could derive from asset transaction prices + explicit price updates.

### 10.3 Quantity Totals by Asset Type

- Show aggregated totals per asset type: "Gold: 50g across 3 items | Silver: 200g across 2 items".
- **API available:** Assets have `total_quantity` and `asset_type_id`. Group and sum client-side.
- **Backend changes:** None.

### 10.4 Stale Price Alert

- Flag assets whose price hasn't been updated recently: "Last updated: 45 days ago" with a warning icon if >30 days stale.
- **API available:** Assets have `last_price_update` field.
- **Backend changes:** None. Frontend compares `last_price_update` to current date.

---

## 11. Global / Cross-Cutting Improvements

These apply across the entire application.

### ~~11.1 Global Search~~ DONE

Implemented. `GET /search?q=term` endpoint searches across all user's ledgers. Command-palette style modal (`GlobalSearch.tsx`) accessible via sidebar search button, mobile header, and `⌘K` shortcut. Searches accounts (name, owner), transactions (notes, store, location), mutual funds (name, code, owner), and physical assets (name). Results grouped by type with ledger name badges. Clicking a result switches ledger context and navigates directly: accounts open the account page, transactions filter to matching results, mutual funds and physical assets auto-expand and scroll to the specific item.

### ~~11.2 Breadcrumb Navigation~~ DONE

Implemented. `Breadcrumbs.tsx` shared component integrated into `PageHeader`. All pages show contextual breadcrumbs (e.g., Home > Ledger Name > Account Name).

### 11.3 Keyboard Shortcuts

- Power-user shortcuts: `T` for new transaction, `S` or `/` for search, `B` for budgets, `Esc` to close modals, arrow keys for navigation.
- **Backend changes:** None. Frontend keyboard event handling.

### 11.4 Tooltips and Help Text

- Add informational tooltips to financial terms: hover over "XIRR" to see "Extended Internal Rate of Return -- annualized return accounting for the timing of cash flows". Hover over "Net Worth" to see "Total assets minus total liabilities".
- **Backend changes:** None. Static tooltip content.

### 11.5 Empty State Guidance

- Every section should have a helpful empty state explaining what it does and guiding the user. The app already does this well for ledgers (floating book icon + "Create your first ledger"). Extend this pattern to: accounts, transactions, categories, budgets, mutual funds, physical assets, and insights.
- **Backend changes:** None. Frontend only.

### 11.6 Loading Skeletons

- Replace any loading spinners with content-shaped skeleton placeholders (Chakra UI has a `Skeleton` component). This makes the app feel faster and less jumpy.
- **Backend changes:** None.

### 11.7 Notification / Alert System

- A notification bell or alert banner showing actionable insights:
  - "Budget exceeded: Dining is over by $50"
  - "Stale data: 3 physical assets haven't been price-updated in 30+ days"
  - "Large transaction: $2,500 expense detected at Store X"
  - "Unusual spending: This month's Transport spending is 2x your average"
- **Backend changes:** Could be a new endpoint `GET /notifications` that computes alerts from budget data, asset data, and transaction patterns. Or compute entirely client-side from already-fetched data.

### 11.8 Data Freshness Indicators

- On pages that use cached data (React Query 5-min stale time), show a subtle "Last updated: 5 min ago" with a refresh button.
- **Backend changes:** None. Use React Query's `dataUpdatedAt` metadata.

### 11.9 Export Everywhere

- Add CSV and/or PDF export buttons on all data tables: transactions list, budget summary, mutual fund portfolio, physical assets, net worth breakdown.
- **Backend changes:** None for CSV (generate client-side from displayed data). PDF export may benefit from a backend endpoint for formatted reports.

### 11.10 Summary Cards on Every List Page

- Every page that shows a list should have a summary strip at the top with key aggregates. This is the single most impactful pattern across the app. Specific instances:
  - **Transactions:** "47 transactions | Credit: $X | Debit: $Y | Net: $Z"
  - **Budgets:** "Total budgeted: $X | Spent: $Y | Remaining: $Z"
  - **MF Overview:** "Total invested: $X | Value: $Y | P&L: $Z"
  - **Physical Assets:** "Total value: $X | P&L: $Y"
  - **Categories:** "15 expense categories | 5 income categories"
  - **Accounts:** "Assets: $X (N accounts) | Liabilities: $Y (M accounts)"

---

## 12. Priority Ranking

Ordered by value-to-effort ratio. Items near the top deliver the most visible impact for the least implementation effort.

### Tier 1: High Value, Moderate Effort (Implement First)

| #   | Item                                                                     | Section               | Backend Needed? |
| --- | ------------------------------------------------------------------------ | --------------------- | --------------- |
| 1   | Home page dashboard (net worth + monthly snapshot + recent transactions) | 1.1, 1.2, 1.3         | No              |
| 2   | Summary cards/banners on every list page                                 | 11.10, 6.1, 9.1, 10.1 | No              |
| 3   | Insights page multi-chart dashboard layout                               | 8.1                   | No              |
| 4   | Category spending totals on categories page                              | 5.1, 5.3              | No              |
| 5   | Transaction stats bar                                                    | 4.1                   | No              |
| 6   | Budget alerts on home page                                               | 1.4                   | No              |
| 7   | Budget sort by urgency + projected spend                                 | 6.5, 6.3              | No              |
| 8   | Enhanced budget summary card                                             | 6.1                   | No              |
| 9   | Unbudgeted spending alert                                                | 6.4                   | No              |
| 10  | Account group summaries                                                  | 2.1                   | No              |

### Tier 2: High Value, Higher Effort

| #   | Item                                                   | Section    | Backend Needed?    |
| --- | ------------------------------------------------------ | ---------- | ------------------ |
| 11  | Net worth trend over time                              | 7.1        | Yes (new endpoint) |
| ~~12~~ | ~~Global search~~                                   | ~~11.1~~   | ~~DONE~~           |
| 13  | Chart-to-transactions drill-down                       | 8.5        | No                 |
| 14  | MF portfolio summary + asset class pie inline          | 9.1, 9.2   | No                 |
| 15  | MF fund comparison table                               | 9.6        | No                 |
| 16  | Calendar view toggle in transactions                   | 4.5        | No                 |
| 17  | Click-to-filter in categories                          | 5.4        | No                 |
| 18  | Period comparison in insights                          | 8.3        | No                 |
| 19  | Account subtype icons                                  | 2.2        | No                 |
| 20  | Physical assets portfolio summary + stale price alerts | 10.1, 10.4 | No                 |

### Tier 3: Nice to Have, Meaningful Polish

| #      | Item                                              | Section  | Backend Needed? |
| ------ | ------------------------------------------------- | -------- | --------------- |
| 21     | Sparklines on ledger cards                        | 1.6      | No              |
| ~~22~~ | ~~Breadcrumb navigation~~                         | ~~11.2~~ | ~~DONE~~        |
| 23     | Store/location chips + tag badges in transactions | 4.2, 4.3 | No              |
| 24     | Tooltips and help text                            | 11.4     | No              |
| 25     | Loading skeletons                                 | 11.6     | No              |
| 26     | Empty state guidance (extend to all sections)     | 11.5     | No              |
| 27     | "Similar transactions" links                      | 4.4      | No              |
| 28     | Anomaly highlighting in insights                  | 8.4      | No              |
| 29     | Insights key metrics banner                       | 8.2      | No              |
| 30     | Data freshness indicators                         | 11.8     | No              |

### Tier 4: Advanced Features (Significant Backend Work)

| #   | Item                                | Section | Backend Needed?      |
| --- | ----------------------------------- | ------- | -------------------- |
| 31  | Running balance chart per account   | 3.2     | Yes                  |
| 32  | Recurring transaction detection     | 3.3     | Yes                  |
| 33  | Account health indicators           | 3.4     | Partial              |
| 34  | Historical budget comparison        | 6.2     | Yes                  |
| 35  | Category trend sparklines (batch)   | 5.2     | Yes                  |
| 36  | Unused category indicator           | 5.5     | Yes                  |
| 37  | Month-over-month net worth change   | 7.4     | Yes (depends on 7.1) |
| 38  | Liability payoff timeline           | 7.3     | Yes                  |
| 39  | Net worth goal tracking             | 7.5     | Yes                  |
| 40  | MF NAV sparklines per fund          | 9.3     | Yes                  |
| 41  | MF day change indicator             | 9.4     | Yes                  |
| 42  | MF SIP pattern detection            | 9.5     | Yes                  |
| 43  | Physical asset price history chart  | 10.2    | Yes                  |
| 44  | Last activity indicator on accounts | 2.3     | Yes                  |
| 45  | Balance trend indicator on accounts | 2.4     | Yes                  |
| 46  | Notification/alert system           | 11.7    | Partial              |
| 47  | Export everywhere (CSV/PDF)         | 11.9    | Partial              |
| 48  | Keyboard shortcuts                  | 11.3    | No                   |

---

## Backend Endpoints Needed (Summary)

New backend work required for advanced features:

| Endpoint                                               | Purpose                                    | Used By       |
| ------------------------------------------------------ | ------------------------------------------ | ------------- |
| `GET /ledger/{id}/net-worth/history`                   | Monthly net worth snapshots over time      | 7.1, 7.4      |
| ~~`GET /search?q=term`~~                               | ~~Global cross-entity search~~             | ~~11.1 DONE~~ |
| `GET /ledger/{id}/account/{id}/balance-history`        | Running balance over time                  | 3.2           |
| `GET /ledger/{id}/account/{id}/recurring-transactions` | Detected recurring patterns                | 3.3           |
| `GET /ledger/{id}/budgets?compare_previous=true`       | Budget with previous period data           | 6.2           |
| `GET /ledger/{id}/categories/stats`                    | Per-category transaction counts and totals | 5.1, 5.2, 5.5 |
| `GET /ledger/{id}/mutual-fund/{id}/nav-history`        | NAV price history                          | 9.3           |
| `GET /ledger/{id}/physical-asset/{id}/price-history`   | Asset price history                        | 10.2          |
| `GET /notifications`                                   | Computed alerts and notifications          | 11.7          |
| Add `last_transaction_date` to accounts list response  | Avoid N+1 for activity indicators          | 2.3           |
| Financial goals CRUD                                   | Goal setting and tracking                  | 7.5           |

---

## Existing API Endpoints Already Available (No Backend Changes)

These existing endpoints can power many improvements without any backend work:

| Endpoint                                           | Can Power                                                                   |
| -------------------------------------------------- | --------------------------------------------------------------------------- |
| `GET /ledger/{id}/net-worth`                       | Home dashboard net worth banner (1.1)                                       |
| `GET /ledger/{id}/insights/current-month-overview` | Home monthly snapshot (1.2), category spending (5.1), insights banner (8.2) |
| `GET /ledger/{id}/transactions?page=1&per_page=10` | Home recent transactions (1.3)                                              |
| `GET /ledger/{id}/budgets?period=monthly`          | Home budget alerts (1.4), enhanced budget summary (6.1)                     |
| `GET /ledger/{id}/insights/income-expense-trend`   | Ledger card sparklines (1.6), period comparison (8.3)                       |
| `GET /ledger/{id}/accounts`                        | Account group summaries (2.1)                                               |
| `GET /ledger/{id}/account/{id}/summary`            | Monthly averages (3.1)                                                      |
| `GET /ledger/{id}/insights/expense-calendar`       | Calendar view toggle (4.5)                                                  |
| `GET /ledger/{id}/mutual-funds`                    | MF portfolio summary (9.1), fund comparison table (9.6)                     |
| Paginated transaction response fields              | Transaction stats bar (4.1)                                                 |
