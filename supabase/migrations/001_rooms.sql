-- Migration: Shared Budget Rooms
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    room_id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    invite_code       text        UNIQUE NOT NULL,
    plan_type         text        NOT NULL DEFAULT 'couple',
    max_members       integer     NOT NULL DEFAULT 2,
    creator_member_id text        NOT NULL,
    shared_budgets    jsonb       NOT NULL DEFAULT '{}',
    created_at        timestamptz NOT NULL DEFAULT now()
);

-- 2. Room members table
CREATE TABLE IF NOT EXISTS room_members (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id       uuid        NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
    member_id     text        NOT NULL,
    display_name  text        NOT NULL,
    color         text        NOT NULL DEFAULT '#14b8a6',
    budgets       jsonb       NOT NULL DEFAULT '{}',
    summary       jsonb,
    by_category   jsonb       NOT NULL DEFAULT '[]',
    joined_at     timestamptz NOT NULL DEFAULT now(),
    UNIQUE(room_id, member_id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_rooms_invite_code ON rooms(invite_code);
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_member_id ON room_members(member_id);
