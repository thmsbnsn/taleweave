'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        router.push('/login?redirect=/profile');
        return;
      }

      setUser(authUser);

      // Load user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
        setError('Failed to load profile');
      } else {
        setUserProfile(profile || {});
      }

      setLoading(false);
    }

    loadProfile();
  }, [supabase, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-mint via-white to-lemon flex items-center justify-center">
        <div className="text-center">
          <div className="font-fredoka text-3xl text-coral mb-4">Loading...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-coral mx-auto"></div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-mint via-white to-lemon flex items-center justify-center">
        <div className="card max-w-md text-center">
          <h1 className="font-fredoka text-3xl text-red-600 mb-4">Error</h1>
          <p className="font-nunito text-lg mb-6">{error}</p>
          <Link href="/" className="btn-primary">Back to Home</Link>
        </div>
      </main>
    );
  }

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 
                   user?.user_metadata?.first_name ||
                   user?.email?.split('@')[0].split('.')[0] || 
                   'User';

  return (
    <main className="min-h-screen bg-gradient-to-br from-mint via-white to-lemon py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-fredoka text-5xl text-coral text-center mb-10">
          Your Profile
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Account Info */}
          <div className="card p-6">
            <h2 className="font-fredoka text-2xl text-turquoise mb-4">Account Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-nunito text-sm text-gray-600 mb-1">Email</label>
                <p className="font-nunito text-lg">{user?.email}</p>
              </div>
              <div>
                <label className="block font-nunito text-sm text-gray-600 mb-1">Account Type</label>
                <p className="font-nunito text-lg">
                  {userProfile?.is_admin ? (
                    <span className="text-coral font-bold">Admin</span>
                  ) : userProfile?.subscription_active ? (
                    <span className="text-turquoise font-bold">Premium Member</span>
                  ) : (
                    <span className="text-gray-600">Free Account</span>
                  )}
                </p>
              </div>
              <div>
                <label className="block font-nunito text-sm text-gray-600 mb-1">Member Since</label>
                <p className="font-nunito text-lg">
                  {userProfile?.created_at 
                    ? new Date(userProfile.created_at).toLocaleDateString()
                    : 'Recently'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h2 className="font-fredoka text-2xl text-lemon mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/create" className="btn-primary w-full block text-center">
                Create New Story
              </Link>
              <Link href="/dashboard" className="btn-secondary w-full block text-center">
                🎮 Game Dashboard
              </Link>
              <Link href="/parent" className="btn-secondary w-full block text-center">
                Parent Portal
              </Link>
              {!userProfile?.subscription_active && (
                <Link href="/pricing" className="btn-secondary w-full block text-center">
                  Upgrade to Premium
                </Link>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="card p-6 md:col-span-2">
            <h2 className="font-fredoka text-2xl text-coral mb-4">Your Activity</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="font-fredoka text-3xl text-turquoise mb-2">
                  {userProfile?.stories_count || 0}
                </p>
                <p className="font-nunito text-gray-600">Stories Created</p>
              </div>
              <div>
                <p className="font-fredoka text-3xl text-lemon mb-2">
                  {userProfile?.characters_count || 0}
                </p>
                <p className="font-nunito text-gray-600">Characters</p>
              </div>
              <div>
                <p className="font-fredoka text-3xl text-coral mb-2">
                  {userProfile?.credits || 0}
                </p>
                <p className="font-nunito text-gray-600">Credits</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

