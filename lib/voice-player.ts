import { Howl } from 'howler';

export type VoiceSettings = {
  baseVoice: string;
  pitch: number; // -5 to 5
  speed: number; // 0.8 to 1.2
  reverb: number; // 0 to 0.3
};

/**
 * Play a voice clip with the specified settings
 * @param text The text to speak (for future TTS integration)
 * @param voiceUrl The URL of the voice file (or base voice path)
 * @param settings The voice settings (pitch, speed, reverb)
 */
export function playVoice(
  text: string,
  voiceUrl: string,
  settings: VoiceSettings
): Howl {
  // For now, we're using pre-recorded clips
  // In the future, this could integrate with TTS for longer text
  
  const clipMap: Record<string, string> = {
    'great job': 'great_job',
    'try again': 'try_again',
    "you're a star": 'youre_a_star',
    'level up': 'level_up',
    'good morning': 'good_morning',
  };

  const clip = clipMap[text.toLowerCase()];
  
  if (clip) {
    // Use pre-recorded clip with voice settings applied
    const clipPath = `/voices/clips/${clip}_${settings.baseVoice}.wav`;
    const rate = 1 + (settings.speed - 1) + (settings.pitch * 0.05);

    const sound = new Howl({
      src: [clipPath],
      rate: rate,
      reverb: settings.reverb,
      onend: () => {
        console.log('Clip done');
      },
    });

    sound.play();
    return sound;
  } else {
    // Long text - use text-only or pre-record chapters
    console.log('Long text - use text-only or pre-record chapters');
    // For now, just play the base voice file with settings
    const rate = 1 + (settings.speed - 1) + (settings.pitch * 0.05);
    
    const sound = new Howl({
      src: [voiceUrl],
      rate: rate,
      reverb: settings.reverb,
      onend: () => {
        console.log('Voice done');
      },
    });

    sound.play();
    return sound;
  }
}

/**
 * Play a saved voice from a URL with pitch/speed shift (Voice Cloning Lite)
 * @param text The text to display (for UI)
 * @param voiceUrl The URL of the saved voice
 * @param settings Pitch and speed settings
 */
export function playVoiceLite(
  text: string,
  voiceUrl: string,
  settings: { pitch: number; speed: number }
): void {
  const audio = new Audio(voiceUrl);
  audio.playbackRate = 1 + (settings.speed - 1) + (settings.pitch * 0.05);
  audio.play();
}

