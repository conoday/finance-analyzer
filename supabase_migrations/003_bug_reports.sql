-- Migration: Create bug_reports table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS bug_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_chat_id TEXT,
    username TEXT,
    user_id UUID REFERENCES auth.users(id),
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created ON bug_reports(created_at DESC);

-- RLS: service role can do everything, regular users can only insert
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON bug_reports
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can insert bug reports" ON bug_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own reports" ON bug_reports
    FOR SELECT USING (
        user_id = auth.uid()
        OR telegram_chat_id IS NOT NULL
    );
