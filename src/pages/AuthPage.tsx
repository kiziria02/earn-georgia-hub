import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Coins, User, Lock, Mail, Gift, ShieldAlert, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useFingerprint } from "@/hooks/useFingerprint";
import { useSecurityCheck } from "@/hooks/useSecurityCheck";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const { signUp, signIn } = useAuth();
  const { fingerprint, fingerprintLoading } = useFingerprint();
  const { checkRegistration } = useSecurityCheck();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSecurityError(null);

    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success("წარმატებით შეხვედით!");
      } else {
        if (!nickname.trim()) {
          toast.error("გთხოვთ შეიყვანოთ მეტსახელი");
          setIsLoading(false);
          return;
        }

        // Pre-registration security check
        if (fingerprint) {
          const securityResult = await checkRegistration(undefined, phoneNumber || undefined);
          
          if (!securityResult.allowed) {
            setSecurityError(securityResult.message || "რეგისტრაცია დაბლოკილია");
            toast.error(securityResult.message || "რეგისტრაცია დაბლოკილია უსაფრთხოების მიზეზით");
            setIsLoading(false);
            return;
          }
        }

        await signUp(email, password, nickname, referralCode, fingerprint || undefined, phoneNumber || undefined);
        toast.success("წარმატებით დარეგისტრირდით!");
      }
    } catch (error: any) {
      setSecurityError(error.message);
      toast.error(error.message || "შეცდომა მოხდა");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center"
      >
        <div 
          className="inline-flex items-center justify-center p-4 rounded-3xl mb-4 animate-float"
          style={{
            background: "linear-gradient(135deg, #8B0000 0%, #000000 100%)",
            boxShadow: "0 4px 20px -4px rgba(139, 0, 0, 0.4)"
          }}
        >
          <Coins className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gradient-gold">AutoEarn</h1>
        <p className="text-muted-foreground mt-2">გამოიმუშავე ფული მარტივად</p>
      </motion.div>

      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md gradient-card rounded-3xl p-6 shadow-card border border-border/30"
      >
        <h2 className="text-xl font-bold text-foreground text-center mb-6">
          {isLogin ? "შესვლა" : "რეგისტრაცია"}
        </h2>

        {/* Security error alert */}
        {securityError && !isLogin && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 mb-4">
            <ShieldAlert className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">უსაფრთხოების გაფრთხილება</p>
              <p className="text-xs text-destructive/80 mt-1">{securityError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="nickname" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                მეტსახელი
              </Label>
              <Input
                id="nickname"
                placeholder="თქვენი მეტსახელი"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              ელ-ფოსტა
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-secondary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              პაროლი
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-secondary/50"
            />
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                ტელეფონის ნომერი (არასავალდებულო)
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+995 XXX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
          )}

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="referral" className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-muted-foreground" />
                რეფერალ კოდი (არასავალდებულო)
              </Label>
              <Input
                id="referral"
                placeholder="მეგობრის კოდი"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || (!isLogin && fingerprintLoading)}
            className="w-full py-6 text-lg font-semibold text-white hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #8B0000 0%, #000000 100%)",
              boxShadow: "0 4px 20px -4px rgba(139, 0, 0, 0.4)"
            }}
          >
            {isLoading ? "იტვირთება..." : fingerprintLoading && !isLogin ? "უსაფრთხოების შემოწმება..." : isLogin ? "შესვლა" : "რეგისტრაცია"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {isLogin ? (
              <>
                არ გაქვს ანგარიში?{" "}
                <span className="text-primary font-medium">დარეგისტრირდი</span>
              </>
            ) : (
              <>
                უკვე გაქვს ანგარიში?{" "}
                <span className="text-primary font-medium">შესვლა</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 text-muted-foreground text-xs text-center"
      >
        რეგისტრაციით თქვენ ეთანხმებით ჩვენს პირობებს
      </motion.p>
    </div>
  );
}
