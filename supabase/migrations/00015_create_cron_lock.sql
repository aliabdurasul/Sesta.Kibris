-- Migration: 00015_create_cron_lock
-- Provides a single-row lock for external cron jobs.
-- Prevents double-processing when cron-job.org fires overlapping requests.
--
-- Strategy: compare `last_run_at` before processing.
-- If last_run_at is less than (NOW - min_interval_seconds), allow execution.
-- Otherwise return early with 429-style response from the endpoint.

CREATE TABLE IF NOT EXISTS public.cron_lock (
  job_name       TEXT PRIMARY KEY,
  last_run_at    TIMESTAMPTZ NOT NULL DEFAULT '1970-01-01T00:00:00Z',
  last_run_by    TEXT,                         -- server instance / request id
  last_cancelled INTEGER NOT NULL DEFAULT 0,   -- orders cancelled in last run
  last_scanned   INTEGER NOT NULL DEFAULT 0,   -- orders scanned in last run
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the single row for the check-timeouts job
INSERT INTO public.cron_lock (job_name, last_run_at)
VALUES ('check-timeouts', '1970-01-01T00:00:00Z')
ON CONFLICT (job_name) DO NOTHING;

-- RLS: this table is service-role-only (cron endpoint uses service role key)
ALTER TABLE public.cron_lock ENABLE ROW LEVEL SECURITY;

-- No user-facing policies — all access is via service role key, which bypasses RLS
