-- Migration: admin logs + OCR metadata tables
-- Purpose:
--   1) Support /admin/logs endpoint (Log Explorer in admin console)
--   2) Support /admin/ocr-metadata endpoint and OCR metadata aggregation

-- ---------------------------------------------------------------------
-- 1) system_logs
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_logs (
  id          BIGSERIAL PRIMARY KEY,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level       TEXT NOT NULL DEFAULT 'INFO' CHECK (level IN ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL')),
  source      TEXT NOT NULL DEFAULT 'backend',
  message     TEXT NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip          TEXT,
  details     JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp_desc
  ON system_logs (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_system_logs_level_timestamp
  ON system_logs (level, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_system_logs_source_timestamp
  ON system_logs (source, timestamp DESC);

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- No public policies on purpose. Table is intended for service_role/admin flows.

-- ---------------------------------------------------------------------
-- 2) bank_ocr_metadata
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bank_ocr_metadata (
  id             BIGSERIAL PRIMARY KEY,
  bank_name      TEXT NOT NULL UNIQUE,
  detected_fields TEXT[] NOT NULL DEFAULT '{}',
  sample_count   INTEGER NOT NULL DEFAULT 0 CHECK (sample_count >= 0),
  last_sample_at TIMESTAMPTZ,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_ocr_metadata_last_sample
  ON bank_ocr_metadata (last_sample_at DESC);

CREATE OR REPLACE FUNCTION update_bank_ocr_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bank_ocr_metadata_updated_at ON bank_ocr_metadata;
CREATE TRIGGER trg_bank_ocr_metadata_updated_at
BEFORE UPDATE ON bank_ocr_metadata
FOR EACH ROW EXECUTE FUNCTION update_bank_ocr_metadata_updated_at();

ALTER TABLE bank_ocr_metadata ENABLE ROW LEVEL SECURITY;

-- No public policies on purpose. Reads/writes should go through backend admin/service role.