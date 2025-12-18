// Pokemon sound effects utility
// Uses free Pokemon sound effects from public sources

const SOUNDS = {
    click: 'https://play.pokemonshowdown.com/audio/sfx/select.mp3',
    hover: 'https://play.pokemonshowdown.com/audio/sfx/select.mp3',
    confirm: 'https://play.pokemonshowdown.com/audio/sfx/hit-supereffective.mp3',
    cancel: 'https://play.pokemonshowdown.com/audio/sfx/escape.mp3',
    open: 'https://play.pokemonshowdown.com/audio/sfx/ding.mp3',
    success: 'https://play.pokemonshowdown.com/audio/sfx/levelup.mp3',
    error: 'https://play.pokemonshowdown.com/audio/sfx/hit-noteffective.mp3',
    scroll: 'https://play.pokemonshowdown.com/audio/sfx/select.mp3',
};

type SoundType = keyof typeof SOUNDS;

// Preload sounds for better performance
const audioCache: Record<string, HTMLAudioElement> = {};

export function preloadSounds() {
    if (typeof window === 'undefined') return;

    Object.entries(SOUNDS).forEach(([key, url]) => {
        if (!audioCache[key]) {
            const audio = new Audio(url);
            audio.volume = 0.3;
            audio.preload = 'auto';
            audioCache[key] = audio;
        }
    });
}

export function playSound(type: SoundType, volume: number = 0.3) {
    if (typeof window === 'undefined') return;

    // Check if sounds are muted
    const muted = localStorage.getItem('sfx_muted') === 'true';
    if (muted) return;

    try {
        // Use cached audio or create new
        let audio = audioCache[type];

        if (!audio) {
            audio = new Audio(SOUNDS[type]);
            audioCache[type] = audio;
        }

        // Clone for overlapping sounds
        const clone = audio.cloneNode() as HTMLAudioElement;
        clone.volume = volume;
        clone.play().catch(() => { });
    } catch (e) {
        // Silently fail
    }
}

// Play Pokemon cry using PokeAPI
export function playCry(pokemonId: number, volume: number = 0.5) {
    if (typeof window === 'undefined') return;

    const muted = localStorage.getItem('sfx_muted') === 'true';
    if (muted) return;

    try {
        const audio = new Audio(
            `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemonId}.ogg`
        );
        audio.volume = volume;
        audio.play().catch(() => { });
    } catch (e) {
        // Silently fail
    }
}

// Hook for using sounds
export function useSounds() {
    return {
        click: () => playSound('click'),
        hover: () => playSound('hover', 0.15),
        confirm: () => playSound('confirm'),
        cancel: () => playSound('cancel'),
        open: () => playSound('open'),
        success: () => playSound('success'),
        error: () => playSound('error'),
        cry: (id: number) => playCry(id),
    };
}
