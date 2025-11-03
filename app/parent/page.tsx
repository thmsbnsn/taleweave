// app/parent/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { VoicePreview } from '@/components/VoicePreview';

type Child = { id: string; name: string; avatar_url?: string };
type Report = { week: string; stars: number; comment: string; voice_url?: string };

export default function ParentDashboard() {
  const supabase = createClient();
  const [parent, setParent] = useState<any>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [locked, setLocked] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);

  // Load parent + children
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Parent profile
      const { data: p } = await supabase
        .from('parent_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setParent(p || { user_id: user.id });

      // Children linked via a simple join table or users table
      const { data: kids } = await supabase
        .from('users')
        .select('id, child_name as name, avatar_url')
        .eq('parent_id', user.id);
      setChildren(kids || []);

      // Lock status (stored on child user row)
      if (kids?.[0]) {
        const { data } = await supabase
          .from('users')
          .select('app_locked')
          .eq('id', kids[0].id)
          .single();
        setLocked(data?.app_locked ?? false);
        setSelectedChild(kids[0]);
      }
    }
    load();
  }, [supabase]);

  // Toggle lock
  const toggleLock = async () => {
    if (!selectedChild) return;
    const newLock = !locked;
    await supabase
      .from('users')
      .update({ app_locked: newLock })
      .eq('id', selectedChild.id);
    setLocked(newLock);
  };

  // Save parent voice
  const saveParentVoice = async (url: string) => {
    await supabase
      .from('parent_profiles')
      .upsert({ user_id: parent.user_id, voice_url: url }, { onConflict: 'user_id' });
  };

  // Load weekly reports (mock – replace with real query)
  useEffect(() => {
    if (selectedChild) {
      setReports([
        { week: 'Oct 28 – Nov 3', stars: 12, comment: 'Amazing progress in Math!', voice_url: parent?.voice_url },
        { week: 'Oct 21 – Oct 27', stars: 9, comment: 'Keep practicing spelling!' },
      ]);
    }
  }, [selectedChild, parent]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-mint via-white to-lemon py-12 px-6">
      <div className="max-w-5xl mx-auto">

        <h1 className="font-fredoka text-5xl text-coral text-center mb-10">
          Parent Portal
        </h1>

        {/* ==== Avatar + Voice ==== */}
        <section className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="card p-6">
            <h2 className="font-fredoka text-2xl text-turquoise mb-4">Your Avatar</h2>
            {parent?.avatar_url ? (
              <Image src={parent.avatar_url} alt="Parent avatar" width={120} height={120} className="rounded-full mx-auto" />
            ) : (
              <div className="bg-gray-200 border-2 border-dashed rounded-full w-32 h-32 mx-auto" />
            )}
            <label className="block mt-4 font-nunito">Upload photo</label>
            <input type="file" accept="image/*" className="input-field" />
          </div>

          <div className="card p-6">
            <h2 className="font-fredoka text-2xl text-turquoise mb-4">Your Voice</h2>
            <VoiceRecorder userId={parent?.user_id || ''} onSave={saveParentVoice} />
            {parent?.voice_url && <VoicePreview url={parent.voice_url} label="Play your voice" />}
          </div>
        </section>

        {/* ==== Child Selector + Lock ==== */}
        <section className="card p-6 mb-8">
          <h2 className="font-fredoka text-2xl text-coral mb-4">Manage Access</h2>
          <div className="flex flex-wrap gap-4 items-center">
            {children.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedChild(c)}
                className={`px-4 py-2 rounded-lg font-nunito ${selectedChild?.id === c.id ? 'bg-coral text-white' : 'bg-gray-100'}`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {selectedChild && (
            <div className="mt-6 flex items-center gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!locked}
                  onChange={toggleLock}
                  className="w-6 h-6 text-coral"
                />
                <span className="font-nunito text-lg">
                  {locked ? 'App Locked' : 'App Unlocked'}
                </span>
              </label>
            </div>
          )}
        </section>

        {/* ==== Weekly Report Cards ==== */}
        <section className="space-y-6">
          <h2 className="font-fredoka text-3xl text-coral">Weekly Report Cards</h2>
          {reports.map((r, i) => (
            <div key={i} className="card p-6 flex items-center justify-between">
              <div>
                <p className="font-fredoka text-xl">{r.week}</p>
                <p className="font-nunito">{r.stars} ⭐ {r.comment}</p>
              </div>
              {r.voice_url && <VoicePreview url={r.voice_url} label="Hear Mom/Dad" />}
            </div>
          ))}
        </section>

        <div className="mt-12 text-center">
          <Link href="/" className="btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}