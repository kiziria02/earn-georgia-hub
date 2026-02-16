import { motion } from "framer-motion";
import { Send, Facebook, Instagram, ExternalLink, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useTaskResetTimer } from "@/hooks/useTaskResetTimer";
import { TASKS, VIP_LEVELS } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const iconMap: Record<string, typeof Send> = {
  Send,
  Facebook,
  Instagram,
};

export function TasksPage() {
  const { profile, taskCompletions, completeTask } = useProfile();
  const { formattedTime, nextResetTime } = useTaskResetTimer(taskCompletions);
  const vipLevel = profile?.vip_level || 0;
  const reward = VIP_LEVELS[vipLevel].reward;

  const completedTasksCount = taskCompletions.length;
  const totalTasks = TASKS.length;
  const allTasksCompleted = completedTasksCount === totalTasks;

  const handleTaskClick = async (task: typeof TASKS[0]) => {
    const isCompleted = taskCompletions.some((tc) => tc.task_id === task.id);
    
    if (isCompleted) {
      toast.info("ეს დავალება უკვე შესრულებულია");
      return;
    }

    // Open the link
    window.open(task.url, "_blank");

    // Complete the task after a short delay
    setTimeout(async () => {
      try {
        // Server calculates reward based on VIP level
        await completeTask.mutateAsync({ taskId: task.id });
        toast.success(`დავალება შესრულდა! მიიღეთ $${reward.toFixed(2)}`);
      } catch (error) {
        toast.error("დავალება უკვე შესრულებულია");
      }
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-foreground mb-1">დავალებები</h1>
        <p className="text-muted-foreground text-sm">
          შეასრულეთ დავალებები და მიიღეთ ${reward.toFixed(2)} თითოეულზე
        </p>
      </motion.div>

      {/* Task Refresh Notice */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/30"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4" />
          <span className="text-sm font-medium">დავალებები განახლდება ყოველ 24 საათში</span>
        </div>
        
        {/* Show countdown only if there are completed tasks */}
        {nextResetTime && completedTasksCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg gradient-primary">
            <Clock className="h-4 w-4 text-primary-foreground" />
            <span className="text-primary-foreground font-mono text-sm font-bold">{formattedTime}</span>
          </div>
        )}
      </motion.div>

      {/* VIP Info Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl p-4 gradient-primary shadow-primary"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/80 text-sm">თქვენი VIP დონე</p>
            <p className="text-primary-foreground font-bold text-lg">
              {VIP_LEVELS[vipLevel].name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-primary-foreground/80 text-sm">ჯილდო დავალებაზე</p>
            <p className="text-primary-foreground font-bold text-lg">${reward.toFixed(2)}</p>
          </div>
        </div>
      </motion.div>

      {/* Progress Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between px-2"
      >
        <span className="text-sm text-muted-foreground">
          შესრულებული დავალებები
        </span>
        <span className="text-sm font-semibold text-foreground">
          {completedTasksCount}/{totalTasks}
        </span>
      </motion.div>

      {/* All Tasks Completed Banner */}
      {allTasksCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-success/10 border border-success/30 text-center"
        >
          <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
          <p className="text-success font-semibold">ყველა დავალება შესრულებულია!</p>
          <p className="text-muted-foreground text-sm mt-1">
            შემდეგი განახლება: {formattedTime}
          </p>
        </motion.div>
      )}

      {/* Tasks List */}
      <div className="space-y-4">
        {TASKS.map((task, index) => {
          const Icon = iconMap[task.icon];
          const isCompleted = taskCompletions.some((tc) => tc.task_id === task.id);
          
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + index * 0.1 }}
              className={cn(
                "gradient-card rounded-2xl p-4 shadow-card border border-border/30",
                isCompleted && "opacity-70"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-xl bg-gradient-to-br", task.color)}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    {task.name}
                    {isCompleted && (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    )}
                  </h3>
                  <p className="text-muted-foreground text-sm">{task.description}</p>
                </div>
                <Button
                  onClick={() => handleTaskClick(task)}
                  disabled={isCompleted || completeTask.isPending}
                  variant={isCompleted ? "secondary" : "default"}
                  size="sm"
                  className={cn(
                    !isCompleted && "gradient-primary shadow-primary text-primary-foreground hover:opacity-90"
                  )}
                >
                  {isCompleted ? (
                    "შესრულდა"
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      გახსნა
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-muted-foreground text-xs"
      >
        * დავალების შესრულების შემდეგ ჯილდო ავტომატურად ჩაირიცხება თქვენს ბალანსზე
      </motion.p>
    </div>
  );
}
