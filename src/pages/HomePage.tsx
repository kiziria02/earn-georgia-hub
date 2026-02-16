import { motion } from "framer-motion";
import { Eye, UserPlus, DollarSign, Calendar, Shield } from "lucide-react";
import { BalanceCard } from "@/components/BalanceCard";
import { StatCard } from "@/components/StatCard";
import { useProfile } from "@/hooks/useProfile";
import { PLATFORM_STATS } from "@/lib/constants";

export function HomePage() {
  const { profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-foreground mb-1">
          გამარჯობა, {profile?.nickname || "მომხმარებელ"}! 👋
        </h1>
        <p className="text-muted-foreground text-sm">კეთილი იყოს თქვენი მობრძანება AutoEarn-ში</p>
      </motion.div>

      {/* Balance Card */}
      <BalanceCard
        balance={Number(profile?.balance) || 0}
        totalEarned={Number(profile?.total_earned) || 0}
        vipLevel={profile?.vip_level || 0}
      />

      {/* Stats Grid */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">პლატფორმის სტატისტიკა</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="დღევანდელი ვიზიტები"
            value={`${PLATFORM_STATS.dailyVisits.toLocaleString()}+`}
            icon={Eye}
            delay={0.1}
          />
          <StatCard
            title="დღევანდელი რეგისტრაციები"
            value={`${PLATFORM_STATS.dailyRegistrations}+`}
            icon={UserPlus}
            delay={0.2}
          />
          <StatCard
            title="სულ გაცემული თანხა"
            value={`$${PLATFORM_STATS.totalPaidOut.toLocaleString()}`}
            icon={DollarSign}
            delay={0.3}
          />
          <StatCard
            title="სამუშაო დღეები"
            value={`${PLATFORM_STATS.workingDays}+`}
            icon={Calendar}
            delay={0.4}
          />
        </div>
      </div>

      {/* About Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="gradient-card rounded-2xl p-5 shadow-card border border-border/30"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl gradient-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">ჩვენს შესახებ</h3>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          AutoEarn არის სანდო და უსაფრთხო პლატფორმა, რომელიც მომხმარებლებს საშუალებას აძლევს 
          გამოიმუშაონ ფული მარტივი დავალებების შესრულებით. ჩვენი პლატფორმა მუშაობს 24/7 რეჟიმში 
          და გარანტირებულად იხდის ყველა გამომუშავებულ თანხას. ჩვენ ვიყენებთ უახლეს უსაფრთხოების 
          ტექნოლოგიებს თქვენი მონაცემების და ფინანსების დასაცავად. შეუერთდით ათასობით 
          კმაყოფილ მომხმარებელს და დაიწყეთ შემოსავლის გამომუშავება დღესვე!
        </p>
      </motion.div>
    </div>
  );
}
