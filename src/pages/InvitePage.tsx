import { motion } from "framer-motion";
import { Users, Copy, Gift, UserPlus, Target, Crown, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { VIP_LEVELS, REFERRAL_MILESTONES, FREE_VIP_REQUIREMENT } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function InvitePage() {
  const { profile, referrals } = useProfile();
  const currentVipLevel = profile?.vip_level || 0;
  const commissionRate = VIP_LEVELS[currentVipLevel].commission;

  const copyCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast.success("კოდი დაკოპირდა!");
    }
  };

  // Calculate milestone progress
  const getNextMilestone = () => {
    for (const milestone of REFERRAL_MILESTONES) {
      if (referrals.length < milestone.count) {
        return milestone;
      }
    }
    return null;
  };

  const nextMilestone = getNextMilestone();

  // Calculate completed milestones
  const completedMilestones = REFERRAL_MILESTONES.filter(
    (m) => referrals.length >= m.count
  );

  // Calculate referral VIP counts for free VIP display
  const getReferralVipCounts = () => {
    const counts: Record<number, number> = {};
    referrals.forEach((ref) => {
      const vipLevel = ref.vip_level || 0;
      if (vipLevel > 0) {
        counts[vipLevel] = (counts[vipLevel] || 0) + 1;
      }
    });
    return counts;
  };

  const referralVipCounts = getReferralVipCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4 gradient-primary shadow-primary">
          <Users className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1">მოიწვიე მეგობრები</h1>
        <p className="text-muted-foreground text-sm">
          მიიღე კომისია რეფერალების დავალებებიდან
        </p>
      </motion.div>

      {/* Referral Stats */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl p-5 gradient-primary shadow-primary"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">
              <Gift className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-primary-foreground/80 text-sm">მოწვეული მეგობრები</p>
              <p className="text-primary-foreground font-bold text-2xl">{referrals.length}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-primary-foreground/80 text-sm">თქვენი კომისია</p>
            <p className="text-primary-foreground font-bold text-2xl">{commissionRate}%</p>
          </div>
        </div>
      </motion.div>

      {/* Commission Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="gradient-card rounded-2xl p-4 shadow-card border border-border/30"
      >
        <div className="flex items-center gap-2 mb-3">
          <Percent className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">რეფერალ კომისია</h3>
        </div>
        <p className="text-muted-foreground text-sm mb-3">
          მიიღე {commissionRate}% თქვენი რეფერალების ყოველი დავალების შემოსავლიდან
        </p>
        <div className="grid grid-cols-5 gap-1 text-center">
          {VIP_LEVELS.slice(1).map((vip) => (
            <div 
              key={vip.level}
              className={cn(
                "p-2 rounded-lg",
                currentVipLevel === vip.level ? "bg-primary/20 border border-primary" : "bg-secondary/50"
              )}
            >
              <p className="text-xs text-muted-foreground">{vip.name}</p>
              <p className="font-bold text-foreground">{vip.commission}%</p>
            </div>
          ))}
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

      {/* Milestone Bonuses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="gradient-card rounded-2xl p-5 shadow-card border border-border/30"
      >
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          მილსტოუნ ბონუსები
        </h3>
        <div className="space-y-3">
          {REFERRAL_MILESTONES.map((milestone) => {
            const isCompleted = referrals.length >= milestone.count;
            const progress = Math.min((referrals.length / milestone.count) * 100, 100);
            
            return (
              <div key={milestone.count} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-sm",
                    isCompleted ? "text-success font-medium" : "text-muted-foreground"
                  )}>
                    {milestone.count} მოწვევა
                  </span>
                  <span className={cn(
                    "font-bold",
                    isCompleted ? "text-success" : "text-foreground"
                  )}>
                    +${milestone.bonus}
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all",
                      isCompleted ? "bg-success" : "bg-primary"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {referrals.length}/{milestone.count} მოწვეული
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Free VIP Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="gradient-card rounded-2xl p-5 shadow-card border border-border/30"
      >
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Crown className="h-5 w-5" />
          უფასო VIP პროგრესი
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          მოიწვიე {FREE_VIP_REQUIREMENT} მეგობარი, რომლებიც შეიძენენ VIP-ს და მიიღე იგივე VIP დონე უფასოდ
        </p>
        <div className="space-y-2">
          {VIP_LEVELS.slice(1).map((vip) => {
            const count = referralVipCounts[vip.level] || 0;
            const canClaim = count >= FREE_VIP_REQUIREMENT && (profile?.vip_level || 0) < vip.level;
            
            return (
              <div 
                key={vip.level}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl",
                  canClaim ? "bg-success/20 border border-success" : "bg-secondary/30"
                )}
              >
                <span className="font-medium text-foreground">{vip.name}</span>
                <span className={cn(
                  "text-sm",
                  canClaim ? "text-success font-bold" : "text-muted-foreground"
                )}>
                  {count}/{FREE_VIP_REQUIREMENT} შეძენილი
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Invited Users List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
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
                  <div className="w-10 h-10 rounded-full flex items-center justify-center gradient-primary">
                    <span className="text-primary-foreground font-bold">
                      {referral.nickname.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground block">{referral.nickname}</span>
                    {referral.vip_level > 0 && (
                      <span className="text-xs text-primary">VIP {referral.vip_level}</span>
                    )}
                  </div>
                </div>
                <span className="text-success font-semibold text-sm">
                  {commissionRate}% კომისია
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
