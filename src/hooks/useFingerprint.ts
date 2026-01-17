import { useEffect, useState } from "react";

interface FingerprintData {
  fingerprint: string | null;
  isLoading: boolean;
  fingerprintLoading: boolean;
}

export function useFingerprint(): FingerprintData {
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFingerprint = async () => {
      try {
        const FingerprintJS = await import("@fingerprintjs/fingerprintjs");
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        setFingerprint(result.visitorId);
      } catch (error) {
        console.error("Error loading fingerprint:", error);
        // Generate a fallback fingerprint
        const fallback = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setFingerprint(fallback);
      } finally {
        setIsLoading(false);
      }
    };

    loadFingerprint();
  }, []);

  return { fingerprint, isLoading, fingerprintLoading: isLoading };
}
