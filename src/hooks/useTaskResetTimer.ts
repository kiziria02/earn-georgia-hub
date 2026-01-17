import { useState, useEffect, useMemo } from "react";

interface TaskResetTimer {
  hours: number;
  minutes: number;
  seconds: number;
  formattedTime: string;
  nextResetTime: Date | null;
}

export function useTaskResetTimer(taskCompletions: Array<{ completed_at: string }> | undefined): TaskResetTimer {
  const [now, setNow] = useState(new Date());

  // Update every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate the next reset time based on the oldest task completion in the last 24h
  const nextResetTime = useMemo(() => {
    if (!taskCompletions || taskCompletions.length === 0) {
      return null; // No tasks completed, no reset needed
    }

    // Find the oldest completion time from the current day's tasks
    const completionTimes = taskCompletions.map(tc => new Date(tc.completed_at).getTime());
    const oldestCompletion = new Date(Math.min(...completionTimes));
    
    // Reset time is 24 hours after the oldest completion
    const resetTime = new Date(oldestCompletion);
    resetTime.setHours(resetTime.getHours() + 24);
    
    return resetTime;
  }, [taskCompletions]);

  // Calculate time remaining
  const timeRemaining = useMemo(() => {
    if (!nextResetTime) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }

    const diff = nextResetTime.getTime() - now.getTime();
    
    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  }, [nextResetTime, now]);

  const formattedTime = `${String(timeRemaining.hours).padStart(2, '0')}:${String(timeRemaining.minutes).padStart(2, '0')}:${String(timeRemaining.seconds).padStart(2, '0')}`;

  return {
    ...timeRemaining,
    formattedTime,
    nextResetTime,
  };
}
