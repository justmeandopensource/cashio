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

### 31. Raw SQL Migrations Without Alembic

- **Files:** `backend/migrations/`, `backend/run_migrations.py`
- **Problem:** Manual numbering, no rollback scripts, no tracking of which migrations ran.
- **Fix:** Migrate to Alembic for version-controlled, reversible migrations.

### 32. Missing Pydantic Validators on Schemas

- **Files:** `backend/app/schemas/transaction_schema.py`, other schemas
- **Fix:** Add `field_validator` for credit/debit mutual exclusion, positive amounts, budget amount > 0, etc.

### 34. CORS Too Permissive

- **File:** `backend/app/main.py` (lines ~38-44)
- **Problem:** `allow_methods=["*"]`, `allow_headers=["*"]` — wider than needed.
- **Fix:** Whitelist specific methods (GET, POST, PUT, DELETE) and headers (Authorization, Content-Type).
