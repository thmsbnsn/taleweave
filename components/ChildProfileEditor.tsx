'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface ChildProfileEditorProps {
  childId: string;
  initialProfile?: {
    display_name?: string;
    avatar_url?: string;
    favorite_color?: string;
  };
  initialPreferences?: {
    interests?: string[];
    favorite_subjects?: string[];
    learning_style?: string;
    difficulty_preference?: string;
  };
  onSave?: () => void;
}

export function ChildProfileEditor({
  childId,
  initialProfile,
  initialPreferences,
  onSave,
}: ChildProfileEditorProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    display_name: initialProfile?.display_name || '',
    favorite_color: initialProfile?.favorite_color || '#FF6B6B',
  });

  const [preferences, setPreferences] = useState({
    interests: initialPreferences?.interests?.join(', ') || '',
    favorite_subjects: initialPreferences?.favorite_subjects?.join(', ') || '',
    learning_style: initialPreferences?.learning_style || 'mixed',
    difficulty_preference: initialPreferences?.difficulty_preference || 'medium',
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialProfile?.avatar_url || null
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Upload avatar if changed
      let avatarUrl = initialProfile?.avatar_url;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);

        const uploadResponse = await fetch(`/api/children/${childId}/avatar`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const data = await uploadResponse.json();
          throw new Error(data.error || 'Failed to upload avatar');
        }

        const uploadData = await uploadResponse.json();
        avatarUrl = uploadData.avatar_url;
      }

      // Update profile
      const profileData = {
        display_name: profile.display_name,
        favorite_color: profile.favorite_color,
        avatar_url: avatarUrl,
        child_preferences: {
          interests: preferences.interests
            .split(',')
            .map((i) => i.trim())
            .filter((i) => i.length > 0),
          favorite_subjects: preferences.favorite_subjects
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0),
          learning_style: preferences.learning_style,
          difficulty_preference: preferences.difficulty_preference,
        },
      };

      const response = await fetch(`/api/children/${childId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      if (onSave) {
        onSave();
      }

      alert('Profile updated successfully!');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <p className="text-red-600 font-nunito">{error}</p>
        </div>
      )}

      {/* Avatar Upload */}
      <div className="flex flex-col items-center gap-4">
        {avatarPreview && (
          <Image
            src={avatarPreview}
            alt="Avatar preview"
            width={120}
            height={120}
            className="rounded-full border-4 border-white shadow-lg"
          />
        )}
        <div>
          <label className="block font-nunito mb-2 text-center">Profile Picture</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="input-field"
          />
          <p className="text-sm text-gray-600 mt-1">Max 5MB. JPG, PNG, or GIF.</p>
        </div>
      </div>

      {/* Display Name */}
      <div>
        <label className="block font-nunito mb-2">Display Name *</label>
        <input
          type="text"
          value={profile.display_name}
          onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
          className="input-field"
          required
          placeholder="How they appear in the app"
        />
      </div>

      {/* Favorite Color */}
      <div>
        <label className="block font-nunito mb-2">Favorite Color</label>
        <div className="flex gap-4 items-center">
          <input
            type="color"
            value={profile.favorite_color}
            onChange={(e) => setProfile({ ...profile, favorite_color: e.target.value })}
            className="w-20 h-12 rounded cursor-pointer"
          />
          <input
            type="text"
            value={profile.favorite_color}
            onChange={(e) => setProfile({ ...profile, favorite_color: e.target.value })}
            className="input-field flex-1"
            placeholder="#FF6B6B"
          />
        </div>
      </div>

      {/* Interests */}
      <div>
        <label className="block font-nunito mb-2">Interests</label>
        <input
          type="text"
          value={preferences.interests}
          onChange={(e) => setPreferences({ ...preferences, interests: e.target.value })}
          className="input-field"
          placeholder="dinosaurs, space, princesses (comma separated)"
        />
      </div>

      {/* Favorite Subjects */}
      <div>
        <label className="block font-nunito mb-2">Favorite Subjects</label>
        <input
          type="text"
          value={preferences.favorite_subjects}
          onChange={(e) =>
            setPreferences({ ...preferences, favorite_subjects: e.target.value })
          }
          className="input-field"
          placeholder="math, reading, science (comma separated)"
        />
      </div>

      {/* Learning Style */}
      <div>
        <label className="block font-nunito mb-2">Learning Style</label>
        <select
          value={preferences.learning_style}
          onChange={(e) =>
            setPreferences({ ...preferences, learning_style: e.target.value })
          }
          className="input-field"
        >
          <option value="visual">Visual (pictures, videos)</option>
          <option value="auditory">Auditory (listening, music)</option>
          <option value="kinesthetic">Kinesthetic (hands-on, movement)</option>
          <option value="mixed">Mixed</option>
        </select>
      </div>

      {/* Difficulty Preference */}
      <div>
        <label className="block font-nunito mb-2">Difficulty Preference</label>
        <select
          value={preferences.difficulty_preference}
          onChange={(e) =>
            setPreferences({ ...preferences, difficulty_preference: e.target.value })
          }
          className="input-field"
        >
          <option value="easy">Easy (building confidence)</option>
          <option value="medium">Medium (balanced challenge)</option>
          <option value="challenging">Challenging (advanced learning)</option>
        </select>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
}

