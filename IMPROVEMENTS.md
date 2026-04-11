# Cashio Improvements Tracker

Analysis date: 2026-04-05

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
