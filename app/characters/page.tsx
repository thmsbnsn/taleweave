'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { VoicePreview } from '@/components/VoicePreview';

interface Character {
  id: string;
  name: string;
  age: number;
  appearance: string | null;
  personality: string | null;
  image_url: string | null;
  voice_settings: any;
  voice_id: string | null;
  created_at: string;
}

export default function CharactersPage() {
  const router = useRouter();
  const supabase = createClient();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [userHasSubscription, setUserHasSubscription] = useState(false);

  useEffect(() => {
    async function loadCharacters() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Check subscription status
      const { data: userData } = await supabase
        .from('users')
        .select('subscription_active, is_admin')
        .eq('id', user.id)
        .single();

      setUserHasSubscription(userData?.subscription_active || userData?.is_admin || false);

      // Load characters
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading characters:', error);
      } else {
        setCharacters(data || []);
      }

      setLoading(false);
    }

    loadCharacters();
  }, [supabase, router]);

  const canCreateMore = userHasSubscription || characters.length < 1;

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-mint via-white to-lemon flex items-center justify-center">
        <div className="text-center">
          <div className="font-fredoka text-3xl text-coral mb-4">Loading characters...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-coral mx-auto"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-mint via-white to-lemon py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-fredoka text-5xl text-coral">
            My Characters
          </h1>
          <Link href="/characters/create" className="btn-primary">
            {canCreateMore ? 'Create New Character' : 'Upgrade to Create More'}
          </Link>
        </div>

        {!canCreateMore && characters.length >= 1 && (
          <div className="card bg-lemon border-2 border-yellow-300 mb-6">
            <p className="font-nunito text-center">
              Free accounts can only have 1 saved character.{' '}
              <Link href="/pricing" className="text-coral font-bold underline">
                Upgrade to create unlimited characters!
              </Link>
            </p>
          </div>
        )}

        {characters.length === 0 ? (
          <div className="card text-center py-12">
            <h2 className="font-fredoka text-3xl text-turquoise mb-4">No Characters Yet</h2>
            <p className="font-nunito text-lg mb-6">
              Create your first character to use in stories and games!
            </p>
            <Link href="/characters/create" className="btn-primary">
              Create Your First Character
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((character) => (
              <div key={character.id} className="card p-6">
                {character.image_url && (
                  <Image
                    src={character.image_url}
                    alt={character.name}
                    width={200}
                    height={200}
                    className="rounded-lg mx-auto mb-4"
                  />
                )}
                <h3 className="font-fredoka text-2xl text-coral mb-2">{character.name}</h3>
                <p className="font-nunito text-gray-600 mb-2">Age: {character.age}</p>
                
                {character.appearance && (
                  <p className="font-nunito text-sm mb-2">
                    <strong>Appearance:</strong> {character.appearance}
                  </p>
                )}
                
                {character.personality && (
                  <p className="font-nunito text-sm mb-4">
                    <strong>Personality:</strong> {character.personality}
                  </p>
                )}

                {character.voice_settings && (
                  <div className="mb-4">
                    <VoicePreview
                      url={`/voices/${character.voice_settings.baseVoice || character.voice_id || 'boy_bright'}.wav`}
                      label="Hear Voice"
                    />
                  </div>
                )}

                <Link
                  href={`/create?character=${character.id}`}
                  className="btn-secondary w-full text-center block"
                >
                  Use in Story
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

