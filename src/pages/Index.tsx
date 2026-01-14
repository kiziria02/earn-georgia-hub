import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { AuthPage } from "./AuthPage";
import { HomePage } from "./HomePage";
import { TasksPage } from "./TasksPage";
import { VipPage } from "./VipPage";
import { InvitePage } from "./InvitePage";
import { FinancePage } from "./FinancePage";
import { BottomNav } from "@/components/BottomNav";
import { LogOut, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export default function Index() {
  const { user, isLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("home");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-4 rounded-3xl gradient-gold shadow-gold mb-4 animate-pulse">
            <Coins className="h-12 w-12 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">იტვირთება...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case "home":
        return <HomePage />;
      case "tasks":
        return <TasksPage />;
      case "vip":
        return <VipPage />;
      case "invite":
        return <InvitePage />;
      case "finance":
        return <FinancePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg gradient-gold">
              <Coins className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-gradient-gold">AutoEarn</span>
          </div>
          <Button
            onClick={() => signOut()}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
