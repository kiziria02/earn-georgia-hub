import { Home, ListTodo, Crown, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface NavItem {
  id: string;
  label: string;
  icon: typeof Home;
}

const navItems: NavItem[] = [
  { id: "home", label: "მთავარი", icon: Home },
  { id: "tasks", label: "დავალებები", icon: ListTodo },
  { id: "vip", label: "VIP", icon: Crown },
  { id: "invite", label: "მოწვევა", icon: Users },
  { id: "finance", label: "ფინანსები", icon: Wallet },
];

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50">
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-300 relative min-w-[60px]",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl opacity-20"
                  style={{ background: "linear-gradient(135deg, #8B0000 0%, #000000 100%)" }}
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
              <Icon className={cn("h-5 w-5 mb-1", isActive && "drop-shadow-lg")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
