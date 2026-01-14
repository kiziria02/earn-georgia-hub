import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, ArrowDownCircle, ArrowUpCircle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile } from "@/hooks/useProfile";
import { DEPOSIT_ADDRESS } from "@/lib/constants";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function FinancePage() {
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [copied, setCopied] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(DEPOSIT_ADDRESS);
    setCopied(true);
    toast.success("მისამართი დაკოპირდა!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("გთხოვთ შეიყვანოთ სწორი თანხა");
      return;
    }

    if (amount > Number(profile.balance)) {
      toast.error("არასაკმარისი ბალანსი");
      return;
    }

    if (!withdrawAddress.trim()) {
      toast.error("გთხოვთ შეიყვანოთ USDT მისამართი");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("withdrawals").insert({
        profile_id: profile.id,
        amount,
        usdt_address: withdrawAddress,
      });

      if (error) throw error;

      // Update balance
      await supabase
        .from("profiles")
        .update({ balance: Number(profile.balance) - amount })
        .eq("id", profile.id);

      toast.success("გატანის მოთხოვნა წარმატებით გაიგზავნა!");
      setWithdrawAddress("");
      setWithdrawAmount("");
    } catch (error) {
      toast.error("შეცდომა მოთხოვნის გაგზავნისას");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center p-3 rounded-2xl gradient-gold shadow-gold mb-4">
          <Wallet className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1">ფინანსები</h1>
        <p className="text-muted-foreground text-sm">
          ბალანსი: ${Number(profile?.balance || 0).toFixed(2)}
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-secondary/50">
        <button
          onClick={() => setActiveTab("deposit")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all",
            activeTab === "deposit"
              ? "gradient-gold text-primary-foreground shadow-gold"
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
              ? "gradient-gold text-primary-foreground shadow-gold"
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
              className="w-full gradient-gold text-primary-foreground shadow-gold hover:opacity-90"
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
            <div className="space-y-2">
              <Label htmlFor="address">USDT მისამართი (TRC20)</Label>
              <Input
                id="address"
                placeholder="შეიყვანეთ თქვენი USDT მისამართი"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                className="bg-secondary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">თანხა ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="bg-secondary/50"
              />
              <p className="text-xs text-muted-foreground">
                ხელმისაწვდომი: ${Number(profile?.balance || 0).toFixed(2)}
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full gradient-gold text-primary-foreground shadow-gold hover:opacity-90"
            >
              {isSubmitting ? "იგზავნება..." : "გატანის მოთხოვნა"}
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
