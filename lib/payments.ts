import { createClient } from '@/lib/supabase/server'

export async function checkUserAccess(userId: string): Promise<{
  hasAccess: boolean
  reason?: string
}> {
  const supabase = await createClient()

  // First, verify we can access Supabase properly
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser || authUser.id !== userId) {
    console.error('Auth user mismatch:', { authUserId: authUser?.id, requestedId: userId })
    return {
      hasAccess: false,
      reason: 'Authentication error. Please try logging out and back in.',
    }
  }

  // Check if user is admin or has active subscription
  // Use explicit public schema reference if needed
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('subscription_active, is_admin, email')
    .eq('id', userId)
    .maybeSingle() // Use maybeSingle instead of single to handle not found gracefully

  // Handle errors - PGRST116 means no rows found, PGRST106 is schema error
  if (userError) {
    console.error('User query error:', {
      code: userError.code,
      message: userError.message,
      details: userError.details,
      hint: userError.hint
    })
    
    // If it's a schema error (PGRST106), try using service role as fallback
    if (userError.code === 'PGRST106') {
      console.error('Schema error detected, trying service role fallback...')
      const { checkUserAccessWithServiceRole } = await import('./payments-service')
      return checkUserAccessWithServiceRole(userId, authUser?.email || '')
    }
  }

  // If user doesn't exist in users table yet, create it
  if (!user) {
    // User doesn't exist in users table - create it (might be new signup)
    if (authUser) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: authUser.email,
          is_admin: false,
          subscription_active: false,
        })
      
      if (insertError) {
        console.error('Error creating user record:', insertError)
        return {
          hasAccess: false,
          reason: 'Unable to create user account. Please contact support.',
        }
      }
      
      // After creating, try fetching again (or just return false for now)
      // They'll need to purchase/subscribe first
      return {
        hasAccess: false,
        reason: 'Please purchase a story or subscribe to create stories.',
      }
    }
    
    // No auth user found
    return {
      hasAccess: false,
      reason: 'Please purchase a story or subscribe to create stories.',
    }
  }

  // Admins have unlimited free access - check this FIRST
  if (user?.is_admin === true) {
    console.log('✅ Admin access granted for user:', userId, 'email:', user.email)
    return { hasAccess: true }
  }

  if (user?.subscription_active === true) {
    console.log('✅ Subscription access granted for user:', userId)
    return { hasAccess: true }
  }

  // Log what we found for debugging
  if (user) {
    console.log('User access check result:', {
      userId,
      is_admin: user.is_admin,
      subscription_active: user.subscription_active,
      email: user.email
    })
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

