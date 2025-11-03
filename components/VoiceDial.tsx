'use client';

import { useState, useRef } from 'react';
import { Howl } from 'howler';

type VoiceSettings = {
  baseVoice: string;
  pitch: number; // -5 to 5
  speed: number; // 0.8 to 1.2
  reverb: number; // 0 to 0.3
};

type VoiceDialProps = {
  baseVoice: string;
  onSave: (settings: VoiceSettings) => void;
};

const PROMPT = [
  "Hi, I'm [NAME]!",
  "Great job!",
  "Try again!",
  "You're a star!",
  "Level up!",
  "I love learning!",
];

export function VoiceDial({ baseVoice, onSave }: VoiceDialProps) {
  const [pitch, setPitch] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [reverb, setReverb] = useState(0);
  const [step, setStep] = useState(0);
  const soundRef = useRef<Howl | null>(null);

  const playPreview = () => {
    // Stop any currently playing sound
    if (soundRef.current) {
      soundRef.current.unload();
    }

    const voiceUrl = `/voices/${baseVoice}.wav`;
    const rate = 1 + (speed - 1) + (pitch * 0.05);

    soundRef.current = new Howl({
      src: [voiceUrl],
      rate: rate,
      // Note: Reverb would require Web Audio API for full implementation
      // For now, we'll use rate adjustment which affects perceived pitch
      onend: () => {
        console.log('Preview done');
      },
    });

    soundRef.current.play();
  };

  const handleSave = () => {
    onSave({ baseVoice, pitch, speed, reverb });
  };

  const prompt = PROMPT[step] || PROMPT[0];

  return (
    <div className="card p-6">
      <h3 className="font-fredoka text-coral mb-4">Voice Dial</h3>

      {/* Pitch Slider */}
      <div className="mb-6">
        <label className="block font-nunito mb-2">
          {pitch > 0 ? 'Pitch: High' : pitch < 0 ? 'Pitch: Low' : 'Pitch: Normal'}
        </label>
        <input
          type="range"
          min="-5"
          max="5"
          value={pitch}
          onChange={(e) => setPitch(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-sm text-gray-600 text-center mt-1">{pitch}</div>
      </div>

      {/* Speed Slider */}
      <div className="mb-6">
        <label className="block font-nunito mb-2">Speed: {speed.toFixed(1)}x</label>
        <input
          type="range"
          min="0.8"
          max="1.2"
          step="0.1"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Reverb Slider */}
      <div className="mb-6">
        <label className="block font-nunito mb-2">Reverb: {reverb.toFixed(1)}</label>
        <input
          type="range"
          min="0"
          max="0.3"
          step="0.05"
          value={reverb}
          onChange={(e) => setReverb(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Play Preview */}
      <button onClick={playPreview} className="btn-primary mb-4 w-full">
        Play: &quot;{prompt}&quot;
      </button>

      {/* Save Button */}
      <button onClick={handleSave} className="btn-secondary w-full">
        Save Voice
      </button>
    </div>
  );
}

