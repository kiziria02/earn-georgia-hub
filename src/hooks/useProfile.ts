import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: referrals } = useQuery({
    queryKey: ["referrals", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nickname, created_at, vip_level")
        .eq("referrer_id", profile.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const { data: taskCompletions } = useQuery({
    queryKey: ["taskCompletions", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("task_completions")
        .select("*")
        .eq("profile_id", profile.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const completeTask = useMutation({
    mutationFn: async ({ taskId, rewardAmount }: { taskId: string; rewardAmount: number }) => {
      if (!profile?.id) throw new Error("No profile");
      
      // Insert task completion
      const { error: completionError } = await supabase
        .from("task_completions")
        .insert({
          profile_id: profile.id,
          task_id: taskId,
          reward_amount: rewardAmount,
        });
      
      if (completionError) throw completionError;

      // Update profile balance
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          balance: profile.balance + rewardAmount,
          total_earned: profile.total_earned + rewardAmount,
        })
        .eq("id", profile.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["taskCompletions"] });
    },
  });

  return {
    profile,
    isLoading,
    error,
    referrals: referrals || [],
    taskCompletions: taskCompletions || [],
    completeTask,
  };
}
