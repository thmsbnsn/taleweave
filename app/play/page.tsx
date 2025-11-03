'use client';

import dynamic from 'next/dynamic';

// Dynamically import the game component with SSR disabled
// This completely prevents Next.js from trying to prerender this page
const PlayGame = dynamic(() => import('./PlayGame'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-gradient-to-br from-mint via-white to-lemon flex items-center justify-center z-50">
      <div className="text-center">
        <div className="font-fredoka text-3xl text-coral mb-4">Loading Game...</div>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-coral mx-auto"></div>
      </div>
    </div>
  ),
});

export default function PlayPage() {
  return <PlayGame />;
}
