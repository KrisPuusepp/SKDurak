import { Howl } from 'howler';

interface SoundConfig
{
  path: string;
  variations?: number;
}

const SOUND_CONFIGS: Record<string, SoundConfig> = {
  attack: { path: '/sfx/card-slide-#.ogg', variations: 8 },
  defend: { path: '/sfx/card-place-#.ogg', variations: 4 },
  pickup: { path: '/sfx/card-shove-#.ogg', variations: 4 },
};

// Pre-load all sound variations
const sounds: Record<string, Howl[]> = {};

Object.entries(SOUND_CONFIGS).forEach(([name, config]) =>
{
  if (config.variations && config.variations > 0)
  {
    sounds[name] = Array.from({ length: config.variations }, (_, i) =>
    {
      return new Howl({
        src: [config.path.replace('#', (i + 1).toString())],
        volume: 0.5,
      });
    });
  } else
  {
    sounds[name] = [new Howl({
      src: [config.path],
      volume: 0.5
    })];
  }
});

export const playSFX = (soundName: keyof typeof SOUND_CONFIGS, enabled: boolean) =>
{
  if (enabled && sounds[soundName])
  {
    const variations = sounds[soundName];
    const randomIndex = Math.floor(Math.random() * variations.length);
    variations[randomIndex].play();
  }
};
