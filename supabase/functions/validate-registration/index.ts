import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegistrationValidationRequest {
  deviceFingerprint: string;
  telegramId?: string;
  components?: Record<string, unknown>;
}

interface SuspiciousSignals {
  isEmulator: boolean;
  isCloner: boolean;
  hasInconsistentData: boolean;
  reasons: string[];
}

function detectSuspiciousSignals(components: Record<string, unknown>): SuspiciousSignals {
  const reasons: string[] = [];
  let isEmulator = false;
  let isCloner = false;
  let hasInconsistentData = false;

  if (components) {
    // Detect emulator signals
    const platform = String(components.platform || "").toLowerCase();
    const vendor = String(components.vendor || "").toLowerCase();
    const userAgent = String(components.userAgent || "").toLowerCase();

    // Common emulator indicators
    if (
      platform.includes("linux") && 
      (userAgent.includes("android") || userAgent.includes("mobile")) &&
      vendor === ""
    ) {
      isEmulator = true;
      reasons.push("Possible emulator detected (Linux platform with mobile UA)");
    }

    // BlueStacks, NOX, LDPlayer signatures
    if (
      userAgent.includes("bluestacks") ||
      userAgent.includes("nox") ||
      userAgent.includes("ldplayer") ||
      userAgent.includes("memu") ||
      userAgent.includes("genymotion")
    ) {
      isEmulator = true;
      reasons.push("Known emulator user agent detected");
    }

    // Check for cloner apps (multiple instances)
    const screenResolution = components.screenResolution as number[] | undefined;
    const availableScreenResolution = components.availableScreenResolution as number[] | undefined;
    
    if (screenResolution && availableScreenResolution) {
      // Cloner apps often have unusual screen ratios
      const ratio = screenResolution[0] / screenResolution[1];
      if (ratio < 0.4 || ratio > 3) {
        isCloner = true;
        reasons.push("Unusual screen ratio detected");
      }
    }

    // Check for WebGL anomalies (common in emulators)
    const webglVendor = String(components.webglVendor || "").toLowerCase();
    const webglRenderer = String(components.webglRenderer || "").toLowerCase();
    
    if (
      webglVendor.includes("swiftshader") ||
      webglVendor.includes("llvmpipe") ||
      webglRenderer.includes("swiftshader") ||
      webglRenderer.includes("llvmpipe")
    ) {
      isEmulator = true;
      reasons.push("Software rendering detected (possible emulator)");
    }

    // Check for timezone inconsistencies
    const timezone = String(components.timezone || "");
    const language = String(components.language || "").toLowerCase();
    
    // Simple check - you might want to expand this
    if (timezone && !timezone.includes("/") && timezone !== "UTC") {
      hasInconsistentData = true;
      reasons.push("Unusual timezone format");
    }

    // Check canvas fingerprint anomalies
    const canvas = components.canvas;
    if (!canvas || canvas === "") {
      hasInconsistentData = true;
      reasons.push("Canvas fingerprinting blocked or unavailable");
    }

    // Check for headless browser
    if (
      userAgent.includes("headless") ||
      userAgent.includes("phantomjs") ||
      userAgent.includes("selenium")
    ) {
      isEmulator = true;
      reasons.push("Headless browser detected");
    }

    // Check plugins count (desktop browsers usually have plugins)
    const plugins = components.plugins as unknown[] | undefined;
    if (
      !userAgent.includes("mobile") && 
      !userAgent.includes("android") && 
      (!plugins || plugins.length === 0)
    ) {
      hasInconsistentData = true;
      reasons.push("No plugins detected on desktop browser");
    }
  }

  return {
    isEmulator,
    isCloner,
    hasInconsistentData,
    reasons,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP from headers
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") ||
                     req.headers.get("x-real-ip") ||
                     "unknown";

    const body: RegistrationValidationRequest = await req.json();
    const { deviceFingerprint, telegramId, components } = body;

    if (!deviceFingerprint) {
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          reason: "missing_fingerprint",
          message: "მოწყობილობის იდენტიფიკაცია ვერ მოხერხდა" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check for suspicious signals (anti-bot)
    const suspiciousSignals = detectSuspiciousSignals(components || {});
    
    if (suspiciousSignals.isEmulator || suspiciousSignals.isCloner) {
      // Log blocked attempt
      await supabase.rpc("log_registration_attempt", {
        p_ip_address: clientIp,
        p_device_fingerprint: deviceFingerprint,
        p_was_blocked: true,
        p_block_reason: suspiciousSignals.reasons.join("; "),
      });

      return new Response(
        JSON.stringify({ 
          allowed: false, 
          reason: "suspicious_device",
          message: "საეჭვო მოწყობილობა აღმოჩენილია" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call database function to check if registration is allowed
    const { data: validationResult, error: validationError } = await supabase.rpc(
      "check_registration_allowed",
      {
        p_device_fingerprint: deviceFingerprint,
        p_ip_address: clientIp,
        p_telegram_id: telegramId || null,
      }
    );

    if (validationError) {
      console.error("Validation error:", validationError);
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          reason: "validation_error",
          message: "ვალიდაციის შეცდომა" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const result = validationResult as { allowed: boolean; reason?: string; message?: string };

    // Log the attempt
    await supabase.rpc("log_registration_attempt", {
      p_ip_address: clientIp,
      p_device_fingerprint: deviceFingerprint,
      p_was_blocked: !result.allowed,
      p_block_reason: result.reason || null,
    });

    return new Response(
      JSON.stringify({
        ...result,
        clientIp, // Return IP so frontend can store it in profile
        suspiciousLevel: suspiciousSignals.hasInconsistentData ? "medium" : "low",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        allowed: false, 
        reason: "server_error",
        message: "სერვერის შეცდომა" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});