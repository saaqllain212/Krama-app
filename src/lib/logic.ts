import { SupabaseClient } from '@supabase/supabase-js';

export type Topic = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
  next_review: string;
  last_gap: number;
  origin_id?: string;
  custom_intervals?: string; 
};

// HELPER: Calculate next gap
// Returns 'number' for next interval, or 'null' if the topic is COMPLETED.
function getNextGapFromSchedule(currentGap: number, scheduleStr: string | undefined | null): number | null {
  const DEFAULT = [0, 1, 3, 7, 14, 30, 60];
  let schedule = DEFAULT;
  let isCustom = false;

  // 1. Parse Custom Schedule
  if (scheduleStr) {
    try {
      // Clean string: "0, 1, 3" -> [0, 1, 3]
      const parsed = scheduleStr.split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n));
      
      if (parsed.length > 0) {
        schedule = parsed;
        isCustom = true;
      }
    } catch (e) {
      console.error("Schedule error, using default");
    }
  }

  // 2. Find current position
  const current = Number(currentGap);
  // Use lastIndexOf to handle duplicate intervals (like 0, 0, 1) correctly
  let currentIndex = schedule.lastIndexOf(current);
  
  // SCENARIO A: Current gap isn't in list (User changed schedule?)
  // Find the next largest number
  if (currentIndex === -1) {
     const nextLargestIndex = schedule.findIndex(n => n > current);
     if (nextLargestIndex !== -1) return schedule[nextLargestIndex];
     return schedule[schedule.length - 1];
  }

  // SCENARIO B: We are at the end of the schedule
  if (currentIndex >= schedule.length - 1) {
    const lastValue = schedule[schedule.length - 1];

    // THE FIX: If it's a custom schedule and ends in 0, 
    // it means "Do once and finish". Do NOT repeat.
    if (isCustom && lastValue === 0) {
      return null; // Signal to Mark as Completed
    }

    // Otherwise (Normal SRS), repeat the max interval (Maintenance Mode)
    return lastValue; 
  }

  // SCENARIO C: Normal progression
  return schedule[currentIndex + 1];
}

export async function reviewTopic(supabase: SupabaseClient, topic: Topic) {
  // 1. Calculate New Gap
  const newGap = getNextGapFromSchedule(topic.last_gap, topic.custom_intervals);
  
  // SCENARIO: COMPLETED (One-off task or End of Cycle)
  if (newGap === null) {
    const { error } = await supabase
      .from('topics')
      .update({ 
        status: 'completed',
        next_review: null // Remove from calendar
      })
      .eq('id', topic.id);

    if (error) throw error;
    return;
  }

  // SCENARIO: ACTIVE (Next Review)
  const nextDate = new Date();
  
  if (newGap === 0) {
    // If gap is 0, it is due Today (Immediately)
  } else {
    // If gap is > 0, push to future
    nextDate.setDate(nextDate.getDate() + newGap);
    nextDate.setHours(6, 0, 0, 0); // Reset to morning
  }
  
  // 3. Update DB
  const { error } = await supabase
    .from('topics')
    .update({ 
      last_gap: newGap, 
      next_review: nextDate.toISOString(),
      status: 'active' 
    })
    .eq('id', topic.id);

  if (error) throw error;
}