import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

export type StaffProfile = {
  id: string;
  full_name: string;
  email: string | null;
  job_title: string | null;
  active: boolean;
};

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: StaffProfile | null;
  roles: string[];
  isAdmin: boolean;
  isCoordination: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const COLUMNS = "id, full_name, email, job_title, active";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  const loadProfile = useCallback(async (uid: string | undefined) => {
    if (!uid) {
      setProfile(null);
      setRoles([]);
      return;
    }
    const { data: existing } = await supabase
      .from("staff_profiles")
      .select(COLUMNS)
      .eq("id", uid)
      .maybeSingle();

    let row = existing;
    if (!row) {
      // Cria o perfil da equipe no primeiro acesso (primeiro usuário vira administrador).
      await supabase.rpc("bootstrap_staff");
      const { data: created } = await supabase
        .from("staff_profiles")
        .select(COLUMNS)
        .eq("id", uid)
        .maybeSingle();
      row = created;
    }
    setProfile((row as StaffProfile) ?? null);

    const { data: roleRows } = await supabase.from("staff_roles").select("role").eq("user_id", uid);
    setRoles((roleRows ?? []).map((r) => r.role as string));
  }, []);

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!active) return;
      setSession(newSession);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      }
      if (!newSession) {
        setProfile(null);
        setRoles([]);
        return;
      }
      setTimeout(() => {
        void loadProfile(newSession.user.id).catch(() => undefined);
      }, 0);
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) await loadProfile(data.session.user.id).catch(() => undefined);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile, queryClient, router]);

  const refreshProfile = useCallback(async () => {
    if (session?.user.id) await loadProfile(session.user.id);
  }, [loadProfile, session]);

  const signOut = useCallback(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        roles,
        isAdmin: roles.includes("admin"),
        isCoordination: roles.includes("coordination") || roles.includes("admin"),
        loading,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}
