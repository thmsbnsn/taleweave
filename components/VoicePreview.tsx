'use client';

import { useRef } from 'react';

type Props = {
  url: string;
  label?: string;
};

export function VoicePreview({ url, label = 'Play' }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const play = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={play} className="btn-primary text-sm px-3 py-1">
        {label}
      </button>
      <audio ref={audioRef} src={url} />
    </div>
  );
}

