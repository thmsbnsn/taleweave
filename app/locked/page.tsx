// app/locked/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LockedScreen() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function checkLock() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('users')
        .select('app_locked')
        .eq('id', user.id)
        .single();

      if (!data?.app_locked) {
        setIsUnlocked(true);
        // Auto-redirect after animation
        setTimeout(() => router.push('/'), 2500);
      }
    }
    checkLock();
  }, [supabase, router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-mint to-lemon flex flex-col items-center justify-center px-6 text-center">
      <Image
        src={isUnlocked ? "/dragon-waking.svg" : "/dragon-sleeping.svg"}
        alt={isUnlocked ? "Waking dragon" : "Sleeping dragon"}
        width={240}
        height={240}
        className="mb-8"
      />

      {isUnlocked ? (
        <>
          <h1 className="font-fredoka text-5xl text-coral mb-4 animate-bounce">
            Welcome Back!
          </h1>
          <p className="font-nunito text-lg">Let’s go on an adventure!</p>
        </>
      ) : (
        <>
          <h1 className="font-fredoka text-5xl text-coral mb-4">
            Zzz… App is Locked
          </h1>
          <p className="font-nunito text-lg max-w-md mb-8">
            Your parent turned off playtime for now. Come back later!
          </p>
          <button 
            onClick={() => router.push('/login')}
            className="btn-secondary text-lg px-6 py-3"
          >
            Log In as Parent
          </button>
        </>
      )}
    </main>
  );
}