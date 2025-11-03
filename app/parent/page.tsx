// app/parent/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { VoicePreview } from '@/components/VoicePreview';
import { ChildProfileEditor } from '@/components/ChildProfileEditor';

type Child = { 
  id: string; 
  name: string; 
  username?: string;
  display_name?: string;
  avatar_url?: string;
  is_locked?: boolean;
  favorite_color?: string;
};

type ParentRole = {
  id: string;
  parent_id: string;
  role: 'primary_parent' | 'co_parent' | 'guardian';
  permissions: any;
  parent_email?: string;
  parent_name?: string;
};

type Report = { week: string; stars: number; comment: string; voice_url?: string };

export default function ParentDashboard() {
  const supabase = createClient();
  const [parent, setParent] = useState<any>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [locked, setLocked] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [showCreateChild, setShowCreateChild] = useState(false);
  const [showInviteParent, setShowInviteParent] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showRoleManagement, setShowRoleManagement] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parentRoles, setParentRoles] = useState<ParentRole[]>([]);
  const [userRole, setUserRole] = useState<'primary_parent' | 'co_parent' | 'guardian' | null>(null);
  const [childProfile, setChildProfile] = useState<any>(null);
  const [childPreferences, setChildPreferences] = useState<any>(null);

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

      // Load children via parent_children table (supports co-parents)
      const { data: parentLinks, error: linksError } = await supabase
        .from('parent_children')
        .select('child_id, relationship_type')
        .eq('parent_id', user.id)
        .eq('status', 'active');

      if (linksError) {
        console.error('Error loading children links:', linksError);
      }

      // Fetch child user data
      if (parentLinks && parentLinks.length > 0) {
        const childIds = parentLinks.map((link: any) => link.child_id);
        const { data: childUsers, error: usersError } = await supabase
          .from('users')
          .select('id, username, display_name, avatar_url, app_locked')
          .in('id', childIds)
          .eq('is_child', true);

        if (usersError) {
          console.error('Error loading child users:', usersError);
        }

        // Map to Child type
        const kids: Child[] = (childUsers || []).map((userData: any) => ({
          id: userData.id,
          name: userData.display_name || userData.username || `Child ${userData.id.slice(0, 8)}`,
          username: userData.username,
          display_name: userData.display_name,
          avatar_url: userData.avatar_url,
          is_locked: userData.app_locked || false,
        }));

        setChildren(kids);

        // Select first child by default
        if (kids.length > 0 && !selectedChild) {
          setSelectedChild(kids[0]);
          setLocked(kids[0].is_locked || false);
        }
      } else {
        setChildren([]);
      }
    }
    load();
  }, [supabase, selectedChild]);

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

  // Create child account
  const handleCreateChild = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const displayName = formData.get('displayName') as string;

    try {
      const response = await fetch('/api/children/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, displayName }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Child account created successfully! They can now login with their username and password.');
        setShowCreateChild(false);
        // Reload children list
        window.location.reload();
      } else {
        alert(data.error || 'Failed to create child account');
      }
    } catch (error) {
      console.error('Error creating child:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Invite co-parent
  const handleInviteParent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedChild) {
      alert('Please select a child first');
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    try {
      const response = await fetch('/api/parents/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: selectedChild.id, invitedEmail: email }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Invitation sent! Share this link: ${data.invitation.link}`);
        setShowInviteParent(false);
      } else {
        alert(data.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error inviting parent:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

        {/* ==== Create Child Account ==== */}
        {showCreateChild && (
          <section className="card p-6 mb-8 border-2 border-turquoise">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-fredoka text-2xl text-turquoise">Create Child Account</h2>
              <button
                onClick={() => setShowCreateChild(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateChild} className="space-y-4">
              <div>
                <label className="block font-nunito mb-2">Username *</label>
                <input
                  type="text"
                  name="username"
                  required
                  minLength={3}
                  className="input-field"
                  placeholder="e.g., timmy123"
                />
                <p className="text-sm text-gray-600 mt-1">This is what they'll use to login</p>
              </div>
              <div>
                <label className="block font-nunito mb-2">Password *</label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  className="input-field"
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div>
                <label className="block font-nunito mb-2">Display Name *</label>
                <input
                  type="text"
                  name="displayName"
                  required
                  className="input-field"
                  placeholder="e.g., Timmy"
                />
                <p className="text-sm text-gray-600 mt-1">How they'll appear in the app</p>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          </section>
        )}

        {/* ==== Child Selector + Lock ==== */}
        <section className="card p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-fredoka text-2xl text-coral">Manage Children</h2>
            <button
              onClick={() => setShowCreateChild(true)}
              className="btn-secondary text-sm"
            >
              + Add Child
            </button>
          </div>

          {children.length === 0 ? (
            <div className="text-center py-8">
              <p className="font-nunito text-gray-600 mb-4">
                No children added yet. Create a child account to get started!
              </p>
              <button
                onClick={() => setShowCreateChild(true)}
                className="btn-primary"
              >
                Create First Child Account
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-4 items-center mb-4">
                {children.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedChild(c);
                      setLocked(c.is_locked || false);
                    }}
                    className={`px-4 py-2 rounded-lg font-nunito ${selectedChild?.id === c.id ? 'bg-coral text-white' : 'bg-gray-100'}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {selectedChild && (
                <div className="mt-6 space-y-4">
                  {/* Role Badge */}
                  {userRole && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-nunito text-gray-600">Your role:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-fredoka ${
                        userRole === 'primary_parent' 
                          ? 'bg-coral text-white' 
                          : userRole === 'co_parent'
                          ? 'bg-turquoise text-white'
                          : 'bg-gray-300 text-gray-700'
                      }`}>
                        {userRole === 'primary_parent' ? 'Primary Parent' : 
                         userRole === 'co_parent' ? 'Co-Parent' : 'Guardian'}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!locked}
                        onChange={toggleLock}
                        disabled={userRole === 'guardian'}
                        className="w-6 h-6 text-coral disabled:opacity-50"
                      />
                      <span className="font-nunito text-lg">
                        {locked ? 'App Locked' : 'App Unlocked'}
                      </span>
                      {userRole === 'guardian' && (
                        <span className="text-xs text-gray-500">(Guardian cannot change)</span>
                      )}
                    </label>
                  </div>

                  <div className="pt-4 border-t flex flex-wrap gap-2">
                    <button
                      onClick={() => setShowProfileEditor(true)}
                      className="btn-secondary text-sm"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => setShowInviteParent(true)}
                      className="btn-secondary text-sm"
                      disabled={userRole !== 'primary_parent'}
                    >
                      Invite Co-Parent
                    </button>
                    {userRole === 'primary_parent' && (
                      <button
                        onClick={() => setShowRoleManagement(true)}
                        className="btn-secondary text-sm"
                      >
                        Manage Roles
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* ==== Invite Co-Parent ==== */}
        {showInviteParent && selectedChild && (
          <section className="card p-6 mb-8 border-2 border-lemon">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-fredoka text-2xl text-lemon">
                Invite Co-Parent for {selectedChild.name}
              </h2>
              <button
                onClick={() => setShowInviteParent(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleInviteParent} className="space-y-4">
              <div>
                <label className="block font-nunito mb-2">Co-Parent Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="input-field"
                  placeholder="parent@example.com"
                />
                <p className="text-sm text-gray-600 mt-1">
                  They&apos;ll receive an invitation link to manage this child account
                </p>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>
          </section>
        )}

        {/* ==== Child Profile Editor ==== */}
        {showProfileEditor && selectedChild && (
          <section className="card p-6 mb-8 border-2 border-turquoise">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-fredoka text-2xl text-turquoise">
                Edit {selectedChild.name}&apos;s Profile
              </h2>
              <button
                onClick={() => {
                  setShowProfileEditor(false);
                  window.location.reload();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <ChildProfileEditor
              childId={selectedChild.id}
              initialProfile={childProfile}
              initialPreferences={childPreferences}
              onSave={() => {
                setShowProfileEditor(false);
                window.location.reload();
              }}
            />
          </section>
        )}

        {/* ==== Role Management ==== */}
        {showRoleManagement && selectedChild && userRole === 'primary_parent' && (
          <section className="card p-6 mb-8 border-2 border-lemon">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-fredoka text-2xl text-lemon">
                Manage Parent Roles for {selectedChild.name}
              </h2>
              <button
                onClick={() => setShowRoleManagement(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {parentRoles.length === 0 ? (
                <p className="font-nunito text-gray-600">Loading parent roles...</p>
              ) : (
                parentRoles.map((parentRole: any) => {
                  const parentData = parentRole.users || {};
                  const parentName = parentData.parent_profiles?.[0]?.name || 
                                   parentData.email?.split('@')[0] || 
                                   'Unknown Parent';
                  
                  return (
                    <div key={parentRole.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-fredoka text-lg">{parentName}</p>
                          <p className="font-nunito text-sm text-gray-600">
                            Role: {parentRole.role === 'primary_parent' ? 'Primary Parent' :
                                   parentRole.role === 'co_parent' ? 'Co-Parent' : 'Guardian'}
                          </p>
                          {parentRole.permissions && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(parentRole.permissions as any)?.can_manage_access && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                  Manage Access
                                </span>
                              )}
                              {(parentRole.permissions as any)?.can_create_stories && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  Create Stories
                                </span>
                              )}
                              {(parentRole.permissions as any)?.can_view_progress && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                  View Progress
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {parentRole.role !== 'primary_parent' && (
                          <select
                            value={parentRole.role}
                            onChange={async (e) => {
                              const response = await fetch('/api/parents/roles', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  linkId: parentRole.id,
                                  role: e.target.value,
                                }),
                              });
                              if (response.ok) {
                                window.location.reload();
                              } else {
                                const data = await response.json();
                                alert(data.error || 'Failed to update role');
                              }
                            }}
                            className="input-field text-sm"
                          >
                            <option value="co_parent">Co-Parent</option>
                            <option value="guardian">Guardian</option>
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

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