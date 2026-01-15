import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceFingerprint } from "@/hooks/useDeviceFingerprint";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, nickname: string, referralCode?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

interface ValidationResult {
  allowed: boolean;
  reason?: string;
  message?: string;
  clientIp?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, nickname: string, referralCode?: string) => {
    // Get device fingerprint first
    let deviceFingerprint: string;
    let components: Record<string, unknown>;
    
    try {
      const fpResult = await getDeviceFingerprint();
      deviceFingerprint = fpResult.fingerprint;
      components = fpResult.components;
    } catch {
      throw new Error("მოწყობილობის იდენტიფიკაცია ვერ მოხერხდა. გთხოვთ სცადოთ თავიდან.");
    }

    // Validate registration with anti-fraud system
    const validationResponse = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-registration`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          deviceFingerprint,
          components,
        }),
      }
    );

    const validationResult: ValidationResult = await validationResponse.json();

    if (!validationResult.allowed) {
      throw new Error(validationResult.message || "რეგისტრაცია დაბლოკილია");
    }

    // Check if referral code is valid
    let referrerId: string | null = null;
    if (referralCode) {
      const { data: referrer } = await supabase
        .from("profiles")
        .select("id")
        .eq("referral_code", referralCode)
        .single();
      
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      // Create profile with anti-fraud data
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id: data.user.id,
          nickname,
          referrer_id: referrerId,
          device_fingerprint: deviceFingerprint,
          registration_ip: validationResult.clientIp || null,
        });

      if (profileError) throw profileError;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}