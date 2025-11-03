'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface GameStats {
  gamesPlayed: number;
  totalPlayTime: number;
  highScores: any[];
  achievements: any[];
  recentRooms: any[];
}

export default function GameDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GameStats>({
    gamesPlayed: 0,
    totalPlayTime: 0,
    highScores: [],
    achievements: [],
    recentRooms: [],
  });
  const [characters, setCharacters] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        router.push('/login?redirect=/dashboard');
        return;
      }

      setUser(authUser);

      // Load user's characters
      const { data: chars } = await supabase
        .from('characters')
        .select('id, name, image_url, created_at')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (chars) {
        setCharacters(chars);
      }

      // Load recent game rooms
      const { data: rooms } = await supabase
        .from('game_rooms')
        .select('id, game_type, created_at, players')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(5);

      // Calculate stats from rooms
      const gameStats: GameStats = {
        gamesPlayed: rooms?.length || 0,
        totalPlayTime: 0, // TODO: Track play time
        highScores: [], // TODO: Implement scoring system
        achievements: [], // TODO: Implement achievements
        recentRooms: rooms || [],
      };

      setStats(gameStats);
      setLoading(false);
    }

    loadDashboard();
  }, [supabase, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-mint via-white to-lemon flex items-center justify-center">
        <div className="text-center">
          <div className="font-fredoka text-3xl text-coral mb-4">Loading Dashboard...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-coral mx-auto"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-mint via-white to-lemon py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="font-fredoka text-5xl text-coral">
            🎮 Game World Dashboard
          </h1>
          <Link href="/play" className="btn-primary">
            Play Now
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 text-center">
            <div className="text-5xl mb-4">🎯</div>
            <p className="font-fredoka text-3xl text-coral mb-2">{stats.gamesPlayed}</p>
            <p className="font-nunito text-gray-600">Games Played</p>
          </div>
          <div className="card p-6 text-center">
            <div className="text-5xl mb-4">⏱️</div>
            <p className="font-fredoka text-3xl text-turquoise mb-2">
              {Math.floor(stats.totalPlayTime / 60)}m
            </p>
            <p className="font-nunito text-gray-600">Total Play Time</p>
          </div>
          <div className="card p-6 text-center">
            <div className="text-5xl mb-4">🏆</div>
            <p className="font-fredoka text-3xl text-lemon mb-2">{stats.achievements.length}</p>
            <p className="font-nunito text-gray-600">Achievements</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Characters */}
          <div className="card p-6">
            <h2 className="font-fredoka text-2xl text-turquoise mb-4">Your Characters</h2>
            {characters.length === 0 ? (
              <div className="text-center py-8">
                <p className="font-nunito text-gray-600 mb-4">No characters yet!</p>
                <Link href="/characters/create" className="btn-primary">
                  Create Character
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {characters.map((char) => (
                  <Link
                    key={char.id}
                    href={`/characters/${char.id}`}
                    className="card p-4 text-center hover:scale-105 transition-transform"
                  >
                    {char.image_url && (
                      <Image
                        src={char.image_url}
                        alt={char.name}
                        width={80}
                        height={80}
                        className="rounded-full mx-auto mb-2 border-4 border-turquoise"
                      />
                    )}
                    <p className="font-fredoka text-lg">{char.name}</p>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4 text-center">
              <Link href="/characters" className="btn-secondary text-sm">
                View All Characters
              </Link>
            </div>
          </div>

          {/* Recent Games */}
          <div className="card p-6">
            <h2 className="font-fredoka text-2xl text-lemon mb-4">Recent Games</h2>
            {stats.recentRooms.length === 0 ? (
              <div className="text-center py-8">
                <p className="font-nunito text-gray-600 mb-4">No games played yet!</p>
                <Link href="/play" className="btn-primary">
                  Start Playing
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentRooms.map((room: any) => (
                  <div
                    key={room.id}
                    className="border rounded-lg p-3 hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-fredoka text-lg capitalize">{room.game_type}</p>
                        <p className="font-nunito text-sm text-gray-600">
                          {room.players?.length || 0} player{room.players?.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Link href={`/play?room=${room.id}`} className="btn-secondary text-sm">
                        Join
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="card p-6 md:col-span-2">
            <h2 className="font-fredoka text-2xl text-coral mb-4">Quick Links</h2>
            <div className="grid md:grid-cols-4 gap-4">
              <Link href="/play" className="card p-4 text-center hover:scale-105 transition-transform">
                <div className="text-4xl mb-2">🎮</div>
                <p className="font-fredoka">Play Game</p>
              </Link>
              <Link href="/characters" className="card p-4 text-center hover:scale-105 transition-transform">
                <div className="text-4xl mb-2">👤</div>
                <p className="font-fredoka">Characters</p>
              </Link>
              <Link href="/learn" className="card p-4 text-center hover:scale-105 transition-transform">
                <div className="text-4xl mb-2">📚</div>
                <p className="font-fredoka">Academy</p>
              </Link>
              <Link href="/profile" className="card p-4 text-center hover:scale-105 transition-transform">
                <div className="text-4xl mb-2">⚙️</div>
                <p className="font-fredoka">Profile</p>
              </Link>
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

