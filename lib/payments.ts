import { createClient } from '@/lib/supabase/server'

export async function checkUserAccess(userId: string): Promise<{
  hasAccess: boolean
  reason?: string
}> {
  const supabase = await createClient()

  // Check if user is admin or has active subscription
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('subscription_active, is_admin')
    .eq('id', userId)
    .single()

  // If user doesn't exist in users table yet, create it
  if (userError && userError.code === 'PGRST116') {
    // User doesn't exist in users table - create it (might be new signup)
    const { data: authUser } = await supabase.auth.getUser()
    if (authUser.user) {
      await supabase
        .from('users')
        .insert({
          id: userId,
          email: authUser.user.email,
          is_admin: false,
          subscription_active: false,
        })
    }
    // New user, no access yet - they need to purchase or subscribe
    return {
      hasAccess: false,
      reason: 'Please purchase a story or subscribe to create stories.',
    }
  }

  // If there's another error, log it but continue checking
  if (userError && userError.code !== 'PGRST116') {
    console.error('Error checking user:', userError)
  }

  // Admins have unlimited free access
  if (user?.is_admin) {
    return { hasAccess: true }
  }

  if (user?.subscription_active) {
    return { hasAccess: true }
  }

  // Check if user has available credits
  const { data: credits } = await supabase
    .from('user_credits')
    .select('id, credits')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (credits && credits.credits > 0) {
    // Deduct credit
    await supabase
      .from('user_credits')
      .update({ credits: credits.credits - 1 })
      .eq('id', credits.id)

    return { hasAccess: true }
  }

  return {
    hasAccess: false,
    reason: 'No active subscription or credits available. Please purchase a story or subscribe.',
  }
}

