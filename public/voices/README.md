# Voice Library

This directory contains the pre-recorded voice files for the TaleWeave voice system.

## Required Voices

Place the following `.wav` files in this directory:

1. **boy_bright.wav** - Happy 7yo boy voice (+10% pitch)
2. **girl_sweet.wav** - Cheerful 6yo girl voice (+5% pitch)
3. **hero_bold.wav** - Epic adventurer voice (0% pitch)
4. **whisper_soft.wav** - Gentle storyteller voice (-10% pitch)
5. **robot_fun.wav** - Playful robot voice (+20% pitch)

## Voice Clips (Optional)

For common phrases, create a `clips/` subdirectory:

```
public/voices/clips/
├── great_job_boy_bright.wav
├── great_job_girl_sweet.wav
├── try_again_boy_bright.wav
├── youre_a_star_boy_bright.wav
├── level_up_boy_bright.wav
└── ...
```

## Where to Get Voices

1. **Fiverr** ($10-20 per voice)
   - Search for "kid voice actor"
   - Best quality and safety

2. **Free Sources**
   - BBC Sound Effects (filter "child voice")
   - Zapsplat (filter "child voice")

3. **Personal Recording**
   - Record niece/nephew (with permission)
   - Most authentic but requires consent

## File Format

- Format: WAV
- Quality: 16-bit, 44.1kHz minimum
- Duration: Base voices can be any length (used for preview)
- Clips: Keep under 3 seconds for phrases

## Notes

- All voices should be clear, kid-friendly, and energetic
- Ensure proper permissions and licensing for all voice files
- Test playback speed and pitch adjustment before deployment

