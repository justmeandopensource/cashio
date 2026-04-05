# Cashio Improvements Tracker

Analysis date: 2026-04-05

---

## CRITICAL

### 5. Broken Datetime Defaults in Models

- **File:** `backend/app/models/model.py` (line ~33)
- **Problem:** `default=datetime.now(timezone.utc)` evaluates once at module import time. Every row gets the server start timestamp.
- **Fix:** Change to `default=func.now()` (server-side) or `default=lambda: datetime.now(timezone.utc)` (client-side). Apply to all timestamp default fields across all models.

---

## HIGH

### 6. Duplicate Charting Libraries (Nivo + Recharts)

- **File:** `frontend/package.json`
- **Problem:** Ships both `@nivo/*` (5 packages) and `recharts` — ~700KB combined bundle weight.
- **Fix:** Audit which charts use which library. Consolidate to one. Migrate the minority usage to the majority library, then remove the other.

### 8. No List Virtualization for Large Tables

- **Files:** `frontend/src/features/transactions/TransactionTable.tsx`, `frontend/src/features/mutual-funds/MutualFundsTable.tsx`, `frontend/src/features/physical-assets/PhysicalAssetsTable.tsx`
- **Problem:** All render full page of items directly to DOM. Slow with 50+ rows, especially with popover hover triggers.
- **Fix:** Add `@tanstack/react-virtual` for row virtualization. Only render visible rows + buffer.

### 9. Missing Database Indexes

- **File:** `backend/app/models/model.py`
- **Problem:** No index on `User.email`, `User.username` (login full-scans). No index on `Transaction.transfer_id`. No composite index on `Transaction(account_id, date)`.
- **Fix:** Add `index=True` to User.email, User.username. Add index to Transaction.transfer_id. Add composite `Index('ix_transaction_account_date', 'account_id', 'date')`.

### 10. Float Instead of Decimal in Pydantic Schemas

- **Files:** `backend/app/schemas/transaction_schema.py` (lines ~12, 45-46), other schema files
- **Problem:** Uses `float` for credit/debit/amount fields. Floating-point arithmetic causes precision loss with currency values.
- **Fix:** Change to `Decimal` type in all financial Pydantic schemas. Add proper serialization config for JSON responses.

---

## MEDIUM

### 12. Repeated Ledger Ownership Validation

- **Files:** All routers in `backend/app/routers/` (~15 endpoints)
- **Problem:** Every endpoint manually checks `if ledger.user_id != user.user_id: raise HTTPException(403)`.
- **Fix:** Create a FastAPI dependency `get_validated_ledger(ledger_id, current_user)` that fetches the ledger and raises 403 if not owned. Use it in all router function signatures.

### 13. State Bloat in Transactions.tsx

- **File:** `frontend/src/features/transactions/Transactions.tsx`
- **Problem:** 11 separate `useState` calls for filter, pagination, modal, and selection state.
- **Fix:** Consolidate into `useReducer` with typed actions, or extract into a `useTransactionPageState()` custom hook.

### 14. `any` Types in Frontend (~20 instances)

- **Files:** `frontend/src/features/account/Account.tsx` (lines ~72, 75), various modal prop types
- **Problem:** Modal data props typed as `any` — breaks type safety.
- **Fix:** Create discriminated union types for modal data (e.g., `TransactionModalData = { mode: 'edit', tx: Transaction } | { mode: 'copy', tx: Transaction } | null`).

### 16. No React Error Boundaries

- **File:** `frontend/src/App.tsx`
- **Problem:** No error boundaries around feature routes. A crash in one feature unmounts the whole app.
- **Fix:** Add `react-error-boundary` package. Wrap each lazy-loaded route in an ErrorBoundary with a fallback UI and reset capability.

### 20. Outdated/Abandoned Python Dependencies

- **File:** `backend/requirements.txt`
- **Problem:** `passlib==1.7.4` (2017, deprecated) — you already import `bcrypt` directly, passlib may be redundant. `python-jose==3.3.0` — abandoned, no security patches.
- **Fix:** Remove passlib if only used as a bcrypt wrapper (use bcrypt directly). Replace python-jose with `PyJWT` + `cryptography`.

---

## LOW

### 25. No Rate Limiting on Auth Endpoints

- **File:** `backend/app/routers/user_router.py`
- **Fix:** Add rate limiting middleware (e.g., `slowapi`) on login/register endpoints to prevent brute force.

### 26. No JWT Refresh Token Mechanism

- **File:** `backend/app/security/user_security.py`
- **Fix:** Implement refresh token flow — short-lived access token (15-30min) + long-lived refresh token. Avoids constant re-login.

### 27. Popover Hover Request Storms in TransactionTable

- **File:** `frontend/src/features/transactions/TransactionTable.tsx`
- **Problem:** Popover triggers on hover with 250ms delay. 20 rows x 3 popovers = 60 potential requests on mouse movement.
- **Fix:** Batch-prefetch details on page load, or use intersection observer, or fetch on click instead of hover.

### 30. No Structured Logging

- **File:** Backend-wide
- **Fix:** Add `structlog` or `loguru`. Replace ad-hoc error messages with structured, leveled logging. Add request logging middleware.

### 31. Raw SQL Migrations Without Alembic

- **Files:** `backend/migrations/`, `backend/run_migrations.py`
- **Problem:** Manual numbering, no rollback scripts, no tracking of which migrations ran.
- **Fix:** Migrate to Alembic for version-controlled, reversible migrations.

### 32. Missing Pydantic Validators on Schemas

- **Files:** `backend/app/schemas/transaction_schema.py`, other schemas
- **Fix:** Add `field_validator` for credit/debit mutual exclusion, positive amounts, budget amount > 0, etc.

### 33. Overly Broad Exception Handling in Routers

- **Files:** `backend/app/routers/transaction_router.py` (~172-173), `ledger_router.py` (~43-46), `account_router.py` (~84-90)
- **Problem:** Catching generic `Exception` and converting to 400 masks real errors.
- **Fix:** Catch specific exceptions. Add global exception handlers in `main.py` for DB errors (IntegrityError, OperationalError) and validation errors.

### 34. CORS Too Permissive

- **File:** `backend/app/main.py` (lines ~38-44)
- **Problem:** `allow_methods=["*"]`, `allow_headers=["*"]` — wider than needed.
- **Fix:** Whitelist specific methods (GET, POST, PUT, DELETE) and headers (Authorization, Content-Type).
