-- Migration: ai_api_keys table
-- Run this in Supabase Dashboard → SQL Editor
-- Purpose: Store GLM/DeepSeek/Gemini API keys managed via Admin Console

CREATE TABLE IF NOT EXISTS ai_api_keys (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        text        NOT NULL DEFAULT 'glm',        -- 'glm' | 'deepseek' | 'gemini'
  label           text        NOT NULL DEFAULT '',            -- e.g. "Key 1 - Akun A"
  api_key         text        NOT NULL,                       -- actual API key
  priority        integer     NOT NULL DEFAULT 0,             -- lower = tried first
  is_active       boolean     NOT NULL DEFAULT true,
  is_rate_limited boolean     NOT NULL DEFAULT false,
  rate_limited_at timestamptz,
  last_used_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Lock down: only service_role can access this table (no public/anon read)
ALTER TABLE ai_api_keys ENABLE ROW LEVEL SECURITY;
-- No public policies → all public access is denied by default.
-- Backend uses service_role key which bypasses RLS.

-- Index for fast ordered fetch
CREATE INDEX IF NOT EXISTS ai_api_keys_provider_priority_idx
  ON ai_api_keys (provider, priority ASC)
  WHERE is_active = true AND is_rate_limited = false;
