// Auth context: holds the current session, profile, and NGO profile.
// Provides signIn, signUp, signOut, and a loading flag.

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { NgoProfile, Profile, UserRole } from "@/lib/types";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  ngoProfile: NgoProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (params: {
    email: string;
    password: string;
    role: UserRole;
    fullName: string;
    phone: string;
  }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ngoProfile, setNgoProfile] = useState<NgoProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string) => {
    const { data: prof, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();
    if (error) {
      setProfile(null);
      setNgoProfile(null);
      return;
    }
    setProfile(prof as Profile | null);
    if (prof && prof.role === "ngo") {
      const { data: ngo } = await supabase
        .from("ngo_profiles")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();
      setNgoProfile((ngo as NgoProfile | null) ?? null);
    } else {
      setNgoProfile(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadProfile(data.session.user.id).finally(() => active && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        loadProfile(sess.user.id);
      } else {
        setProfile(null);
        setNgoProfile(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  function friendlyError(msg: string | null): string | null {
    if (!msg) return null;
    const m = msg.toLowerCase();
    if (m.includes("failed to fetch") || m.includes("networkerror") || m.includes("network request failed")) {
      return "Unable to reach the MealMitra server. Please check your internet connection and try again.";
    }
    return msg;
  }

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: friendlyError(error?.message ?? null) };
    } catch {
      return { error: "Unable to reach the MealMitra server. Please check your internet connection and try again." };
    }
  }, []);

  const signUp = useCallback(
    async (params: {
      email: string;
      password: string;
      role: UserRole;
      fullName: string;
      phone: string;
    }) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: params.email,
          password: params.password,
          options: {
            data: {
              role: params.role,
              full_name: params.fullName,
              phone: params.phone,
            },
          },
        });
        if (error) return { error: friendlyError(error.message) };
        if (data.user) {
          await loadProfile(data.user.id);
        }
        return { error: null };
      } catch {
        return { error: "Unable to reach the MealMitra server. Please check your internet connection and try again." };
      }
    },
    [loadProfile]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setNgoProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, user, profile, ngoProfile, loading, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
