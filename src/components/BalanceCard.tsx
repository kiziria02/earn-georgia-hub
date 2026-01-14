import { motion } from "framer-motion";
import { Wallet, TrendingUp } from "lucide-react";

interface BalanceCardProps {
  balance: number;
  totalEarned: number;
  vipLevel: number;
}

export function BalanceCard({ balance, totalEarned, vipLevel }: BalanceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl gradient-gold p-6 shadow-gold"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="h-5 w-5 text-primary-foreground/80" />
          <span className="text-primary-foreground/80 text-sm font-medium">ბალანსი</span>
          {vipLevel > 0 && (
            <span className="ml-auto px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold text-primary-foreground">
              VIP {vipLevel}
            </span>
          )}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <span className="text-4xl font-bold text-primary-foreground">
            ${balance.toFixed(2)}
          </span>
        </motion.div>
        
        <div className="flex items-center gap-2 text-primary-foreground/80">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm">სულ გამომუშავებული: ${totalEarned.toFixed(2)}</span>
        </div>
      </div>
    </motion.div>
  );
}
