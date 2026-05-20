-- One-time: merchants with an owner should be platform-visible after admin assignment.
-- Safe to re-run (idempotent). Does not touch is_open (merchant controls that).

UPDATE merchants
SET is_active = true
WHERE user_id IS NOT NULL
  AND is_active = false;
