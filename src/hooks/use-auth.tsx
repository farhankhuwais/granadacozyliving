import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type UserRole =
  | "super_admin"
  | "investor_only"
  | "manager_only"
  | "investor_manager";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  });

  async function fetchProfile(userId: string) {
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
    return null;
  }

  async function refreshProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const profile = await fetchProfile(user.id);
      setState((prev) => ({ ...prev, profile }));
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      let profile: Profile | null = null;
      if (user) {
        profile = await fetchProfile(user.id);
      }
      setState({ user, session, profile, loading: false });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user ?? null;
        let profile: Profile | null = null;
        if (user) {
          profile = await fetchProfile(user.id);
        }
        setState({ user, session, profile, loading: false });
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };
    return {};
  }

  async function signOut() {
    await supabase.auth.signOut();
    setState({ user: null, session: null, profile: null, loading: false });
  }

  return (
    <AuthContext.Provider
      value={{ ...state, signIn, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function hasRole(
  profile: Profile | null,
  roles: UserRole[]
): boolean {
  if (!profile) return false;
  return roles.includes(profile.role);
}

export function canManage(profile: Profile | null): boolean {
  if (!profile) return false;
  return ["super_admin", "manager_only", "investor_manager"].includes(
    profile.role
  );
}

export function canInvest(profile: Profile | null): boolean {
  if (!profile) return false;
  return ["super_admin", "investor_only", "investor_manager"].includes(
    profile.role
  );
}
