'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);

  useEffect(() => {
    // Check if user is logged in
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please login first to accept this invitation.');
      } else if (token) {
        // Optionally fetch invitation details to show child name
        const { data } = await supabase
          .from('parent_invitations')
          .select(`
            *,
            child:child_id (
              display_name,
              username
            )
          `)
          .eq('invitation_token', token)
          .single();

        if (data) {
          setInvitation(data);
        }
      }
    }
    checkAuth();
  }, [supabase, token]);

  const handleAccept = async () => {
    if (!token) {
      setError('Invalid invitation link');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/parents/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/parent');
        }, 2000);
      } else {
        setError(data.error || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-mint via-white to-lemon flex items-center justify-center py-20 px-6">
        <div className="card max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="font-fredoka text-4xl text-coral mb-4">
            Invitation Accepted!
          </h1>
          <p className="font-nunito text-gray-600 mb-6">
            You can now manage this child account. Redirecting...
          </p>
          <Link href="/parent" className="btn-primary">
            Go to Parent Portal
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-mint via-white to-lemon flex items-center justify-center py-20 px-6">
      <div className="card max-w-md w-full">
        <h1 className="font-fredoka text-4xl text-coral text-center mb-2">
          Co-Parent Invitation
        </h1>

        {invitation?.child && (
          <p className="font-nunito text-center text-gray-600 mb-8">
            You&apos;ve been invited to help manage{' '}
            <strong>{invitation.child.display_name || invitation.child.username}</strong>&apos;s account
          </p>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 font-nunito">{error}</p>
            {error.includes('login') && (
              <Link href={`/login?redirect=/parents/accept-invite?token=${token}`} className="btn-primary mt-4 w-full">
                Login Now
              </Link>
            )}
          </div>
        )}

        {!error && (
          <>
            <p className="font-nunito text-center text-gray-600 mb-8">
              Accept this invitation to gain access to manage this child&apos;s account, view their progress, and set preferences.
            </p>

            <button
              onClick={handleAccept}
              disabled={loading || !token}
              className="btn-primary w-full text-xl py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Accepting...' : 'Accept Invitation'}
            </button>

            <div className="mt-6 text-center">
              <Link href="/" className="text-coral font-bold hover:underline font-nunito">
                Cancel
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-mint via-white to-lemon flex items-center justify-center py-20 px-6">
        <div className="card max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-coral mx-auto mb-4"></div>
          <p className="font-nunito text-gray-600">Loading...</p>
        </div>
      </main>
    }>
      <AcceptInviteForm />
    </Suspense>
  );
}

