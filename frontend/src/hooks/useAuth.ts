"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UserProfile {
  avatar_url: string | null;
  full_name: string | null;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(async (userId?: string | null) => {
    if (!userId) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("avatar_url,full_name")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) {
      setProfile({
        avatar_url: (data.avatar_url as string | null) ?? null,
        full_name: (data.full_name as string | null) ?? null,
      });
      return;
    }

    setProfile(null);
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      await fetchProfile(currentUser?.id ?? null);
      if (isMounted) {
        setLoading(false);
      }
    };

    void bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      void fetchProfile(currentUser?.id ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile(user?.id ?? null);
  }, [fetchProfile, user?.id]);

  return { user, profile, loading, signOut, refreshProfile };
}
