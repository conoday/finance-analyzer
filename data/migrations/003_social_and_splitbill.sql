-- Migration 003: Social & Split Bill Features
-- Adding 'scope' to transactions table and creating tables for Split Bill.

-- 1. Tambah Kolom Scope ke tabel transactions (jika belum ada)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'private';

-- 2. Buat tabel friends untuk sistem pertemanan
CREATE TABLE IF NOT EXISTS public.friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_nickname TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- 3. Header patungan (Split Bills)
CREATE TABLE IF NOT EXISTS public.split_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'active', -- active, settled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Item dari struk/bayaran
CREATE TABLE IF NOT EXISTS public.split_bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES public.split_bills(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(15, 2) NOT NULL,
    qty INTEGER DEFAULT 1
);

-- 5. Penugasan / Tugasan bayar ke tiap teman
CREATE TABLE IF NOT EXISTS public.split_bill_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES public.split_bills(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.split_bill_items(id) ON DELETE CASCADE,
    assigned_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_to_friend_id UUID REFERENCES public.friends(id) ON DELETE SET NULL, -- jika murni teman lokal
    amount_owed NUMERIC(15, 2) NOT NULL,
    status TEXT DEFAULT 'pending' -- pending, paid
);

-- Enable RLS
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_bill_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for RLS
CREATE POLICY "Users can manage own friends" ON public.friends FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Creator can manage split bills" ON public.split_bills FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Creator can manage split bill items" ON public.split_bill_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.split_bills WHERE id = bill_id AND creator_id = auth.uid())
);
CREATE POLICY "Owner/assigned can view assignments" ON public.split_bill_assignments FOR ALL USING (
    assigned_to_user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.split_bills WHERE id = bill_id AND creator_id = auth.uid())
);
