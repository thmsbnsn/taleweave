'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { VoiceDial } from '@/components/VoiceDial';
import type { VoiceSettings } from '@/lib/voice-player';

export default function CreateCharacterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    age: 7,
    appearance: '',
    personality: '',
  });

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings | null>(null);
  const [baseVoice, setBaseVoice] = useState('boy_bright');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Check character limit (Free = 1, Paid = Unlimited)
      const { data: userData } = await supabase
        .from('users')
        .select('subscription_active, is_admin')
        .eq('id', user.id)
        .single();

      if (!userData?.subscription_active && !userData?.is_admin) {
        const { count } = await supabase
          .from('characters')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if ((count || 0) >= 1) {
          setError('Free accounts can only have 1 saved character. Upgrade to create more!');
          setLoading(false);
          return;
        }
      }

      // Create character with voice settings
      const { data: character, error: charError } = await supabase
        .from('characters')
        .insert({
          user_id: user.id,
          name: formData.name,
          age: formData.age,
          appearance: formData.appearance,
          personality: formData.personality,
          voice_settings: voiceSettings || {
            baseVoice: baseVoice,
            pitch: 0,
            speed: 1,
            reverb: 0,
          },
          voice_id: baseVoice,
        })
        .select()
        .single();

      if (charError) {
        throw charError;
      }

      router.push(`/characters`);
    } catch (err: any) {
      console.error('Error creating character:', err);
      setError(err.message || 'Failed to create character');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-mint via-white to-lemon py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-fredoka text-5xl text-coral text-center mb-8">
          Create Your Character
        </h1>

        {error && (
          <div className="card bg-red-50 border-2 border-red-200 p-4 mb-6">
            <p className="text-red-600 font-nunito">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Character Info */}
            <div className="card p-6 space-y-4">
              <h2 className="font-fredoka text-2xl text-turquoise mb-4">
                Character Info
              </h2>

              <div>
                <label className="block font-nunito mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Enter character name"
                />
              </div>

              <div>
                <label className="block font-nunito mb-2">Age *</label>
                <input
                  type="number"
                  required
                  min="3"
                  max="12"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block font-nunito mb-2">Base Voice</label>
                <select
                  value={baseVoice}
                  onChange={(e) => setBaseVoice(e.target.value)}
                  className="input-field"
                >
                  <option value="boy_bright">Bright Boy</option>
                  <option value="girl_sweet">Sweet Girl</option>
                  <option value="hero_bold">Heroic</option>
                  <option value="whisper_soft">Gentle Whisper</option>
                  <option value="robot_fun">Playful Robot</option>
                </select>
              </div>

              <div>
                <label className="block font-nunito mb-2">Appearance</label>
                <textarea
                  value={formData.appearance}
                  onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Describe how they look..."
                />
              </div>

              <div>
                <label className="block font-nunito mb-2">Personality</label>
                <textarea
                  value={formData.personality}
                  onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Describe their personality..."
                />
              </div>
            </div>

            {/* Voice Customization */}
            <div>
              <VoiceDial
                baseVoice={baseVoice}
                onSave={(settings) => {
                  setVoiceSettings(settings);
                  setBaseVoice(settings.baseVoice);
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Creating...' : 'Create Character'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

