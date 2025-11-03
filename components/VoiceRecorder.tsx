'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

type VoiceRecorderProps = {
  userId: string;
  onSave: (voiceUrl: string) => void;
};

const PROMPT = [
  "Hi, I'm [NAME]!",
  "Great job!",
  "Try again!",
  "You're a star!",
  "Level up!",
  "I love learning!",
];

export function VoiceRecorder({ userId, onSave }: VoiceRecorderProps) {
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Upload to Supabase
        const fileName = `voice-${userId}-${Date.now()}.webm`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user-voices')
          .upload(fileName, blob, {
            contentType: 'audio/webm',
            upsert: false,
          });

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('user-voices')
            .getPublicUrl(fileName);

          onSave(publicUrl);
          setStep((prev) => prev + 1);
        } else {
          console.error('Error uploading voice:', uploadError);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Please allow microphone access to record your voice.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const prompt = PROMPT[step] || PROMPT[0];

  return (
    <div className="card p-6 text-center">
      <h3 className="font-fredoka text-coral mb-4">Record Your Voice!</h3>

      {audioUrl && (
        <audio src={audioUrl} controls className="mx-auto mb-4" />
      )}

      {step < PROMPT.length && (
        <>
          <p className="font-nunito mb-6">
            Say: <strong>{prompt}</strong>
          </p>

          <button
            onClick={recording ? stopRecording : startRecording}
            className={`btn-primary ${recording ? 'animate-pulse' : ''}`}
          >
            {recording ? 'Stop & Next' : 'Start Recording'}
          </button>
        </>
      )}

      {step === PROMPT.length && (
        <p className="text-green-600 font-fredoka mt-4">
          All done! Your voice is saved!
        </p>
      )}
    </div>
  );
}

