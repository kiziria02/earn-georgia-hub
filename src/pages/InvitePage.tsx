import { motion } from "framer-motion";
import { Users, Copy, Gift, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

export function InvitePage() {
  const { profile, referrals } = useProfile();
  const referralLink = profile?.referral_code 
    ? `${window.location.origin}?ref=${profile.referral_code}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("ბმული დაკოპირდა!");
  };

  const copyCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast.success("კოდი დაკოპირდა!");
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
        <div 
          className="inline-flex items-center justify-center p-3 rounded-2xl mb-4"
          style={{
            background: "linear-gradient(135deg, #8B0000 0%, #000000 100%)",
            boxShadow: "0 4px 20px -4px rgba(139, 0, 0, 0.4)"
          }}
        >
          <Users className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1">მოიწვიე მეგობრები</h1>
        <p className="text-muted-foreground text-sm">
          მიიღეთ $0.25 ყოველი მოწვეული მეგობრისთვის
        </p>
      </motion.div>

      {/* Referral Stats */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl p-5"
        style={{
          background: "linear-gradient(135deg, #8B0000 0%, #000000 100%)",
          boxShadow: "0 4px 20px -4px rgba(139, 0, 0, 0.4)"
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">
              <Gift className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-white/80 text-sm">მოწვეული მეგობრები</p>
              <p className="text-white font-bold text-2xl">{referrals.length}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm">გამომუშავებული</p>
            <p className="text-white font-bold text-2xl">
              ${(referrals.length * 0.25).toFixed(2)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Referral Code */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="gradient-card rounded-2xl p-5 shadow-card border border-border/30"
      >
        <h3 className="font-semibold text-foreground mb-4">თქვენი რეფერალ კოდი</h3>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
          <code className="flex-1 font-mono text-lg text-primary">
            {profile?.referral_code || "..."}
          </code>
          <Button onClick={copyCode} variant="ghost" size="sm">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>


      {/* Invited Users List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="gradient-card rounded-2xl p-5 shadow-card border border-border/30"
      >
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          მოწვეული მომხმარებლები
        </h3>
        {referrals.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            ჯერ არავინ არ მოგიწვევიათ
          </p>
        ) : (
          <div className="space-y-3">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between p-3 rounded-xl bg-secondary/30"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #8B0000 0%, #000000 100%)" }}
                  >
                    <span className="text-white font-bold">
                      {referral.nickname.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium text-foreground">{referral.nickname}</span>
                </div>
                <span className="text-success font-semibold">+$0.25</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
