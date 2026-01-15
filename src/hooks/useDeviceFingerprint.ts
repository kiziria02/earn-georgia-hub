import { useState, useEffect, useCallback } from "react";
import FingerprintJS, { GetResult } from "@fingerprintjs/fingerprintjs";

interface DeviceFingerprintResult {
  fingerprint: string | null;
  components: Record<string, unknown> | null;
  isLoading: boolean;
  error: string | null;
}

export function useDeviceFingerprint(): DeviceFingerprintResult {
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [components, setComponents] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getFingerprint = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result: GetResult = await fp.get();
        
        setFingerprint(result.visitorId);
        
        // Extract useful components for anti-bot detection
        const extractedComponents: Record<string, unknown> = {};
        
        result.components && Object.entries(result.components).forEach(([key, value]) => {
          if (value && typeof value === "object" && "value" in value) {
            extractedComponents[key] = value.value;
          }
        });

        // Add extra detection data
        extractedComponents.userAgent = navigator.userAgent;
        extractedComponents.platform = navigator.platform;
        extractedComponents.language = navigator.language;
        extractedComponents.languages = navigator.languages;
        extractedComponents.cookieEnabled = navigator.cookieEnabled;
        extractedComponents.doNotTrack = navigator.doNotTrack;
        extractedComponents.hardwareConcurrency = navigator.hardwareConcurrency;
        extractedComponents.maxTouchPoints = navigator.maxTouchPoints;
        
        // Screen info
        extractedComponents.screenResolution = [screen.width, screen.height];
        extractedComponents.availableScreenResolution = [screen.availWidth, screen.availHeight];
        extractedComponents.colorDepth = screen.colorDepth;
        extractedComponents.pixelRatio = window.devicePixelRatio;

        // WebGL info for emulator detection
        try {
          const canvas = document.createElement("canvas");
          const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
          if (gl && gl instanceof WebGLRenderingContext) {
            const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
            if (debugInfo) {
              extractedComponents.webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
              extractedComponents.webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            }
          }
        } catch {
          // WebGL not available
        }

        // Timezone
        extractedComponents.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        extractedComponents.timezoneOffset = new Date().getTimezoneOffset();

        setComponents(extractedComponents);
      } catch (err) {
        console.error("Fingerprint error:", err);
        setError("მოწყობილობის იდენტიფიკაცია ვერ მოხერხდა");
      } finally {
        setIsLoading(false);
      }
    };

    getFingerprint();
  }, []);

  return { fingerprint, components, isLoading, error };
}

export async function getDeviceFingerprint(): Promise<{
  fingerprint: string;
  components: Record<string, unknown>;
}> {
  const fp = await FingerprintJS.load();
  const result = await fp.get();

  const extractedComponents: Record<string, unknown> = {};
  
  result.components && Object.entries(result.components).forEach(([key, value]) => {
    if (value && typeof value === "object" && "value" in value) {
      extractedComponents[key] = value.value;
    }
  });

  extractedComponents.userAgent = navigator.userAgent;
  extractedComponents.platform = navigator.platform;
  extractedComponents.language = navigator.language;
  extractedComponents.hardwareConcurrency = navigator.hardwareConcurrency;
  extractedComponents.maxTouchPoints = navigator.maxTouchPoints;
  extractedComponents.screenResolution = [screen.width, screen.height];
  extractedComponents.colorDepth = screen.colorDepth;
  extractedComponents.pixelRatio = window.devicePixelRatio;
  extractedComponents.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl && gl instanceof WebGLRenderingContext) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        extractedComponents.webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        extractedComponents.webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
  } catch {
    // WebGL not available
  }

  return {
    fingerprint: result.visitorId,
    components: extractedComponents,
  };
}