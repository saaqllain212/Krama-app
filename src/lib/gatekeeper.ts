import { SupabaseClient } from '@supabase/supabase-js';

export async function checkEnrollmentEligibility(supabase: SupabaseClient, userId: string) {
  // 1. Get User Tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('user_id', userId)
    .single();

  const tier = profile?.tier || 'free';
  
  // 2. Get Current Enrollments
  const { count } = await supabase
    .from('enrolled_exams')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const currentCount = count || 0;

  // 3. Strict Limits
  const FREE_LIMIT = 1;
  const PRO_LIMIT = 2; 

  const limit = tier === 'pro' ? PRO_LIMIT : FREE_LIMIT;
  
  return {
    tier,
    currentCount,
    limit,
    canAdd: currentCount < limit
  };
}