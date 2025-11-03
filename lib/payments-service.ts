import { createClient } from '@supabase/supabase-js'

/**
 * Alternative payment check using service role for admin verification
 * Use this when RLS or schema issues prevent normal checks
 */
export async function checkUserAccessWithServiceRole(
  userId: string,
  userEmail: string
): Promise<{
  hasAccess: boolean
  reason?: string
}> {
  // Only use service role if regular check fails
  // This bypasses RLS for admin checks only
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      hasAccess: false,
      reason: 'Server configuration error.',
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Check user with service role (bypasses RLS)
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('subscription_active, is_admin, email')
    .eq('id', userId)
    .maybeSingle()

  if (userError) {
    console.error('Service role check error:', userError)
    return {
      hasAccess: false,
      reason: 'Unable to verify access.',
    }
  }

  // Admins have unlimited free access
  if (user?.is_admin === true) {
    console.log('✅ Admin access granted (via service role) for user:', userId)
    return { hasAccess: true }
  }

  if (user?.subscription_active === true) {
    console.log('✅ Subscription access granted (via service role) for user:', userId)
    return { hasAccess: true }
  }

  // Check credits
  const { data: credits } = await supabase
    .from('user_credits')
    .select('id, credits')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (credits && credits.credits > 0) {
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

