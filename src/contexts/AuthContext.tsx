import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, nickname: string, referralCode?: string, fingerprint?: string, phoneNumber?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to get client IP
const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch {
    return "unknown";
  }
};

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

  const signUp = async (email: string, password: string, nickname: string, referralCode?: string, fingerprint?: string, phoneNumber?: string) => {
    const ipAddress = await getClientIP();

    // Security check before registration
    if (fingerprint) {
      const { data: securityCheck, error: secError } = await supabase.rpc("check_registration_allowed_v2" as any, {
        p_device_fingerprint: fingerprint,
        p_ip_address: ipAddress,
        p_telegram_id: null,
        p_phone_number: phoneNumber || null,
      });

      if (secError) {
        console.error("Security check error:", secError);
        throw new Error("უსაფრთხოების შემოწმება ვერ მოხერხდა");
      }

      const checkResult = securityCheck as any;
      if (!checkResult.allowed) {
        // Log blocked attempt
        await supabase.rpc("log_registration_attempt" as any, {
          p_ip_address: ipAddress,
          p_device_fingerprint: fingerprint,
          p_was_blocked: true,
          p_block_reason: checkResult.reason,
        });
        throw new Error(checkResult.message || "რეგისტრაცია დაბლოკილია");
      }
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
      // Create profile with device fingerprint, IP, and phone number
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id: data.user.id,
          nickname,
          referrer_id: referrerId,
          device_fingerprint: fingerprint || null,
          registration_ip: ipAddress,
          phone_number: phoneNumber || null,
        });

      if (profileError) throw profileError;

      // Log successful registration attempt
      if (fingerprint) {
        await supabase.rpc("log_registration_attempt" as any, {
          p_ip_address: ipAddress,
          p_device_fingerprint: fingerprint,
          p_was_blocked: false,
          p_block_reason: null,
        });
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Log IP for the profile on login
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", currentUser.id)
        .single();

      if (profile) {
        const ipAddress = await getClientIP();
        await supabase.rpc("log_profile_ip" as any, {
          p_profile_id: profile.id,
          p_ip_address: ipAddress,
        });
      }
    }
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
