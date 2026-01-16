import { motion } from "framer-motion";
import { Crown, Check, Star, Percent, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { VIP_LEVELS, FREE_VIP_REQUIREMENT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function VipPage() {
  const { profile, referrals } = useProfile();
  const currentVipLevel = profile?.vip_level || 0;

  // Calculate how many referrals have purchased each VIP level
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

  const handleUpgrade = (level: number) => {
    if (level <= currentVipLevel) {
      toast.info("თქვენ უკვე გაქვთ ეს VIP დონე");
      return;
    }
    toast.info("VIP-ის შესაძენად შეავსეთ ბალანსი ფინანსების განყოფილებაში");
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
          <Crown className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1">VIP ცენტრი</h1>
        <p className="text-muted-foreground text-sm">
          განაახლეთ VIP და მიიღეთ მეტი ჯილდო
        </p>
      </motion.div>

      {/* Current VIP Status */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl p-5 text-center"
        style={{
          background: "linear-gradient(135deg, #8B0000 0%, #000000 100%)",
          boxShadow: "0 4px 20px -4px rgba(139, 0, 0, 0.4)"
        }}
      >
        <p className="text-white/80 text-sm mb-1">თქვენი VIP სტატუსი</p>
        <p className="text-white font-bold text-2xl">
          {VIP_LEVELS[currentVipLevel].name}
        </p>
        <div className="flex justify-center gap-6 mt-3">
          <div>
            <p className="text-white/80 text-xs">ჯილდო/დავალება</p>
            <p className="text-white font-bold">${VIP_LEVELS[currentVipLevel].reward.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-white/80 text-xs">რეფერალ კომისია</p>
            <p className="text-white font-bold">{VIP_LEVELS[currentVipLevel].commission}%</p>
          </div>
        </div>
      </motion.div>

      {/* Free VIP Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="gradient-card rounded-2xl p-4 shadow-card border border-border/30"
      >
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">უფასო VIP განახლება</h3>
        </div>
        <p className="text-muted-foreground text-sm">
          მოიწვიე {FREE_VIP_REQUIREMENT} მეგობარი, რომლებიც შეიძენენ VIP-ს და მიიღე იგივე VIP დონე უფასოდ!
        </p>
      </motion.div>

      {/* VIP Levels */}
      <div className="space-y-4">
        {VIP_LEVELS.slice(1).map((vip, index) => {
          const isOwned = currentVipLevel >= vip.level;
          const isCurrent = currentVipLevel === vip.level;
          const referralsWithThisVip = referralVipCounts[vip.level] || 0;
          const canGetFree = referralsWithThisVip >= FREE_VIP_REQUIREMENT && !isOwned;
          
          return (
            <motion.div
              key={vip.level}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "gradient-card rounded-2xl p-5 shadow-card border",
                isCurrent ? "border-primary" : canGetFree ? "border-success" : "border-border/30",
                isOwned && "opacity-80"
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-xl bg-gradient-to-br", vip.color)}>
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      {vip.name}
                      {isCurrent && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          აქტიური
                        </span>
                      )}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      ფასი: ${vip.price}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">ჯილდო</p>
                  <p className="text-success font-bold text-lg">${vip.reward.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Check className="h-4 w-4 text-success" />
                  <span>1 დავალება = ${vip.reward.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Percent className="h-4 w-4 text-success" />
                  <span>რეფერალ კომისია: {vip.commission}%</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Users className="h-4 w-4 text-success" />
                  <span>უფასოდ: {referralsWithThisVip}/{FREE_VIP_REQUIREMENT} მეგობარი შეიძინა</span>
                </div>
              </div>

              {canGetFree ? (
                <Button
                  onClick={() => toast.success("თქვენ მიიღეთ უფასო VIP განახლება!")}
                  className="w-full bg-success text-white hover:bg-success/90"
                >
                  <Check className="h-4 w-4 mr-2" />
                  მიიღე უფასოდ!
                </Button>
              ) : (
                <Button
                  onClick={() => handleUpgrade(vip.level)}
                  disabled={isOwned}
                  className={cn(
                    "w-full",
                    !isOwned && "text-white hover:opacity-90"
                  )}
                  variant={isOwned ? "secondary" : "default"}
                  style={!isOwned ? {
                    background: "linear-gradient(135deg, #8B0000 0%, #000000 100%)",
                    boxShadow: "0 4px 20px -4px rgba(139, 0, 0, 0.4)"
                  } : undefined}
                >
                  {isOwned ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      შეძენილია
                    </>
                  ) : (
                    `შეიძინე $${vip.price}-ად`
                  )}
                </Button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
