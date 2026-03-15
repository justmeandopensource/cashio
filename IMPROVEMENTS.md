# Cashio — Planned Improvements

This file tracks planned features and improvements to be implemented.

---

## 1. Budgeting

**Status:** Not started

The biggest gap in the current app. Allow users to set spending limits per category and track progress.

- Set monthly/yearly budget per category
- Budget vs actual comparison view
- Visual progress bars per category
- Alerts when approaching or exceeding budget

---

## 2. Net Worth Dashboard

**Status:** Not started

Accounts, mutual funds, and physical assets all live in separate sections. Add a single view that aggregates everything.

- Combine all asset types minus liabilities into one net worth number
- Net worth over time chart
- Asset allocation breakdown (cash, mutual funds, physical assets, etc.)

---

## 3. Global Search

**Status:** Not started

No global search currently. Users with large transaction histories have to use filters to find specific entries.

- Search bar across transaction notes, store, amount, and category
- Results should be fast and accessible from any page

---

## 4. PWA / Installable App

**Status:** Not started

The app is already responsive. Adding a service worker and web manifest would allow users to install it as a mobile app without an app store.

- Add web app manifest
- Add service worker for offline support
- Enable "Add to Home Screen" on mobile

---

## 5. Keyboard Shortcuts

**Status:** Not started

Power users managing large volumes of transactions would benefit from keyboard-driven navigation.

- Shortcut to open the "Add Transaction" modal
- Shortcuts to navigate between main pages (Transactions, Accounts, Insights, etc.)
- Document shortcuts in a help overlay (e.g., `?` key)
