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

  // Get task completions from the last 24 hours only (tasks reset daily)
  const { data: taskCompletions } = useQuery({
    queryKey: ["taskCompletions", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      // Calculate 24 hours ago
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      
      const { data, error } = await supabase
        .from("task_completions")
        .select("*")
        .eq("profile_id", profile.id)
        .gte("completed_at", twentyFourHoursAgo.toISOString());
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
    // Refetch every minute to keep countdown accurate
    refetchInterval: 60000,
  });

  const completeTask = useMutation({
    mutationFn: async ({ taskId }: { taskId: string }) => {
      if (!profile?.id) throw new Error("No profile");
      
      // Insert task completion - balance is updated by database trigger
      // The trigger validates and calculates reward based on VIP level
      const { error: completionError } = await supabase
        .from("task_completions")
        .insert({
          profile_id: profile.id,
          task_id: taskId,
          reward_amount: 0, // Server will override with correct amount
        });
      
      if (completionError) throw completionError;
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
