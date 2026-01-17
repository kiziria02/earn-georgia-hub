import { supabase } from "@/integrations/supabase/client";
import { useFingerprint } from "./useFingerprint";

interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
  message?: string;
}

export function useSecurityCheck() {
  const { fingerprint, isLoading: fingerprintLoading } = useFingerprint();

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch {
      return "unknown";
    }
  };

  const checkRegistration = async (
    telegramId?: string,
    phoneNumber?: string
  ): Promise<SecurityCheckResult> => {
    if (!fingerprint) {
      return { allowed: false, message: "იტვირთება უსაფრთხოების შემოწმება..." };
    }

    const ipAddress = await getClientIP();

    const { data, error } = await supabase.rpc("check_registration_allowed_v2" as any, {
      p_device_fingerprint: fingerprint,
      p_ip_address: ipAddress,
      p_telegram_id: telegramId || null,
      p_phone_number: phoneNumber || null,
    });

    if (error) {
      console.error("Security check error:", error);
      return { allowed: false, message: "უსაფრთხოების შემოწმება ვერ მოხერხდა" };
    }

    return data as unknown as SecurityCheckResult;
  };

  const checkWithdrawal = async (
    profileId: string,
    usdtAddress: string
  ): Promise<SecurityCheckResult> => {
    const { data, error } = await supabase.rpc("check_withdrawal_allowed" as any, {
      p_profile_id: profileId,
      p_usdt_address: usdtAddress,
    });

    if (error) {
      console.error("Withdrawal check error:", error);
      return { allowed: false, message: "უსაფრთხოების შემოწმება ვერ მოხერხდა" };
    }

    return data as unknown as SecurityCheckResult;
  };

  const logRegistrationAttempt = async (wasBlocked: boolean, blockReason?: string) => {
    if (!fingerprint) return;

    const ipAddress = await getClientIP();

    await supabase.rpc("log_registration_attempt" as any, {
      p_ip_address: ipAddress,
      p_device_fingerprint: fingerprint,
      p_was_blocked: wasBlocked,
      p_block_reason: blockReason || null,
    });
  };

  const logProfileIP = async (profileId: string) => {
    const ipAddress = await getClientIP();

    await supabase.rpc("log_profile_ip" as any, {
      p_profile_id: profileId,
      p_ip_address: ipAddress,
    });
  };

  return {
    fingerprint,
    fingerprintLoading,
    checkRegistration,
    checkWithdrawal,
    logRegistrationAttempt,
    logProfileIP,
    getClientIP,
  };
}
