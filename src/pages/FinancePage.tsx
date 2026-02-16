import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, ArrowDownCircle, ArrowUpCircle, Copy, Check, AlertCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile } from "@/hooks/useProfile";
import { useSecurityCheck } from "@/hooks/useSecurityCheck";
import { DEPOSIT_ADDRESS, MIN_WITHDRAWAL_AMOUNT } from "@/lib/constants";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function FinancePage() {
  const { profile } = useProfile();
  const { checkWithdrawal } = useSecurityCheck();
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [copied, setCopied] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);

  const copyAddress = () => {
    navigator.clipboard.writeText(DEPOSIT_ADDRESS);
    setCopied(true);
    toast.success("მისამართი დაკოპირდა!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);
    
    if (!profile) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("გთხოვთ შეიყვანოთ სწორი თანხა");
      return;
    }

    if (amount < MIN_WITHDRAWAL_AMOUNT) {
      toast.error(`მინიმალური გატანის თანხა: $${MIN_WITHDRAWAL_AMOUNT}`);
      return;
    }

    if (amount > Number(profile.balance)) {
      toast.error("არასაკმარისი ბალანსი");
      return;
    }

    const trimmedAddress = withdrawAddress.trim();
    if (!trimmedAddress) {
      toast.error("გთხოვთ შეიყვანოთ USDT მისამართი");
      return;
    }

    // Validate TRC20 address format
    const TRC20_ADDRESS_REGEX = /^T[A-Za-z1-9]{33}$/;
    if (!TRC20_ADDRESS_REGEX.test(trimmedAddress)) {
      toast.error("არასწორი USDT TRC20 მისამართის ფორმატი");
      return;
    }

    setIsSubmitting(true);
    try {
      // Security check before withdrawal
      const securityResult = await checkWithdrawal(profile.id, trimmedAddress);
      
      if (!securityResult.allowed) {
        setSecurityError(securityResult.message || "უსაფრთხოების შემოწმება ვერ მოხერხდა");
        toast.error(securityResult.message || "გატანა დაბლოკილია უსაფრთხოების მიზეზით");
        return;
      }

      // Insert withdrawal - balance is deducted by database trigger
      const { error } = await supabase.from("withdrawals").insert({
        profile_id: profile.id,
        amount,
        usdt_address: withdrawAddress,
      });

      if (error) {
        // Handle insufficient balance error from trigger
        if (error.message?.includes("Insufficient balance")) {
          toast.error("არასაკმარისი ბალანსი");
          return;
        }
        throw error;
      }

      toast.success("გატანის მოთხოვნა წარმატებით გაიგზავნა!");
      setWithdrawAddress("");
      setWithdrawAmount("");
    } catch (error) {
      toast.error("შეცდომა მოთხოვნის გაგზავნისას");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentBalance = Number(profile?.balance || 0);
  const canWithdraw = currentBalance >= MIN_WITHDRAWAL_AMOUNT;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4 gradient-primary shadow-primary">
          <Wallet className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1">ფინანსები</h1>
        <p className="text-muted-foreground text-sm">
          ბალანსი: ${currentBalance.toFixed(2)}
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-secondary/50">
        <button
          onClick={() => setActiveTab("deposit")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all",
            activeTab === "deposit"
              ? "gradient-primary shadow-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ArrowDownCircle className="h-5 w-5" />
          შეტანა
        </button>
        <button
          onClick={() => setActiveTab("withdraw")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all",
            activeTab === "withdraw"
              ? "gradient-primary shadow-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ArrowUpCircle className="h-5 w-5" />
          გატანა
        </button>
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="gradient-card rounded-2xl p-5 shadow-card border border-border/30"
      >
        {activeTab === "deposit" ? (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold text-foreground mb-2">USDT TRC20 მისამართი</h3>
              <p className="text-muted-foreground text-sm mb-4">
                გადარიცხეთ USDT (TRC20) ქვემოთ მოცემულ მისამართზე
              </p>
            </div>

            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
              <p className="text-sm font-mono text-foreground break-all text-center">
                {DEPOSIT_ADDRESS}
              </p>
            </div>

            <Button
              onClick={copyAddress}
              className="w-full gradient-primary shadow-primary text-primary-foreground hover:opacity-90"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  დაკოპირდა!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  მისამართის კოპირება
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              ⚠️ გთხოვთ გადარიცხოთ მხოლოდ USDT TRC20 ქსელით
            </p>
          </div>
        ) : (
          <form onSubmit={handleWithdraw} className="space-y-4">
            {/* Security error alert */}
            {securityError && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                <ShieldAlert className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">უსაფრთხოების გაფრთხილება</p>
                  <p className="text-xs text-destructive/80 mt-1">{securityError}</p>
                </div>
              </div>
            )}

            {/* Minimum withdrawal notice */}
            <div className={cn(
              "flex items-center gap-2 p-3 rounded-xl",
              canWithdraw ? "bg-secondary/50" : "bg-destructive/10 border border-destructive/30"
            )}>
              <AlertCircle className={cn(
                "h-5 w-5",
                canWithdraw ? "text-muted-foreground" : "text-destructive"
              )} />
              <p className={cn(
                "text-sm",
                canWithdraw ? "text-muted-foreground" : "text-destructive"
              )}>
                მინიმალური გატანის თანხა: ${MIN_WITHDRAWAL_AMOUNT}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">USDT მისამართი (TRC20)</Label>
              <Input
                id="address"
                placeholder="შეიყვანეთ თქვენი USDT მისამართი"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                className="bg-secondary/50"
                disabled={!canWithdraw}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">თანხა ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min={MIN_WITHDRAWAL_AMOUNT}
                placeholder={`მინიმუმ $${MIN_WITHDRAWAL_AMOUNT}`}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="bg-secondary/50"
                disabled={!canWithdraw}
              />
              <p className="text-xs text-muted-foreground">
                ხელმისაწვდომი: ${currentBalance.toFixed(2)}
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !canWithdraw}
              className={cn(
                "w-full hover:opacity-90",
                canWithdraw && "gradient-primary shadow-primary text-primary-foreground"
              )}
            >
              {isSubmitting ? "იგზავნება..." : `გატანის მოთხოვნა (მინ. $${MIN_WITHDRAWAL_AMOUNT})`}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              * გატანა მუშავდება 24 საათის განმავლობაში
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}
