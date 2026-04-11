# Cashio Improvements Tracker

Analysis date: 2026-04-05

---

## LOW

### 26. No JWT Refresh Token Mechanism

- **File:** `backend/app/security/user_security.py`
- **Fix:** Implement refresh token flow — short-lived access token (15-30min) + long-lived refresh token. Avoids constant re-login.
