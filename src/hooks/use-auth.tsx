import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type UserRole = "super_admin" | "investor_only" | "manager_only" | "investor_manager";

interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  propertyId: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) {
      return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        role: data.role as UserRole,
        propertyId: data.property_id,
      };
    }
  } catch (err) {
    console.error("[CozyLiving] fetchProfile error:", err);
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        const user = session?.user ?? null;
        const profile = user ? await fetchProfile(user.id) : null;
        setState({ user, session, profile, loading: false });
      })
      .catch((err) => {
        console.error("[CozyLiving] Auth session error:", err);
        setState({ user: null, session: null, profile: null, loading: false });
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user ?? null;
        const profile = user ? await fetchProfile(user.id) : null;
        setState({ user, session, profile, loading: false });
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  }

  async function signOut() {
    await supabase.auth.signOut();
    setState({ user: null, session: null, profile: null, loading: false });
  }

  async function refreshProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const profile = await fetchProfile(user.id);
        setState((prev) => ({ ...prev, profile }));
      }
    } catch (err) {
      console.error("[CozyLiving] refreshProfile error:", err);
    }
  }

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
