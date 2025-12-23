/**
 * Librería de sonidos para efectos de audio en la aplicación
 */

type SoundType = 'click' | 'confirm' | 'cancel' | 'roll' | 'success' | 'error';

// URLs de sonidos (pueden ser locales o remotos)
const SOUNDS: Record<SoundType, string> = {
  click: '/sounds/click.mp3',
  confirm: '/sounds/confirm.mp3',
  cancel: '/sounds/cancel.mp3',
  roll: '/sounds/roll.mp3',
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3',
};

// Cache de Audio objects
const audioCache: Map<SoundType, HTMLAudioElement> = new Map();

/**
 * Verifica si los sonidos están silenciados
 */
function isMuted(): boolean {
  if (typeof window === 'undefined') return true;
  const muted = localStorage.getItem('sfxMuted');
  return muted === 'true';
}

/**
 * Precarga un sonido
 */
function preloadSound(type: SoundType): void {
  if (typeof window === 'undefined') return;
  
  if (!audioCache.has(type)) {
    const audio = new Audio(SOUNDS[type]);
    audio.preload = 'auto';
    audioCache.set(type, audio);
  }
}

/**
 * Reproduce un sonido
 */
export function playSound(type: SoundType): void {
  if (typeof window === 'undefined') return;
  if (isMuted()) return;

  try {
    let audio = audioCache.get(type);
    
    if (!audio) {
      audio = new Audio(SOUNDS[type]);
      audioCache.set(type, audio);
      
      // Manejar errores de carga silenciosamente
      audio.addEventListener('error', () => {
        // Silenciosamente ignorar errores de carga de audio
        audioCache.delete(type);
      });
    }

    // Reiniciar el audio si ya está reproduciéndose
    audio.currentTime = 0;
    audio.volume = 0.5; // Volumen al 50%
    
    audio.play().catch((error) => {
      // Silenciosamente ignorar errores de reproducción
    });
  } catch (error) {
    // Silenciosamente ignorar errores
  }
}

/**
 * Reproduce el cry de un Pokémon
 */
export function playPokemonCry(cryUrl: string): void {
  if (typeof window === 'undefined') return;
  if (isMuted()) return;

  try {
    const audio = new Audio(cryUrl);
    audio.volume = 0.6;
    audio.play().catch((error) => {
      // Silenciosamente ignorar errores de reproducción
    });
  } catch (error) {
    // Silenciosamente ignorar errores
  }
}

/**
 * Precarga todos los sonidos comunes
 */
export function preloadAllSounds(): void {
  if (typeof window === 'undefined') return;
  
  const commonSounds: SoundType[] = ['click', 'confirm', 'cancel'];
  commonSounds.forEach(preloadSound);
}

// Precarga automática al importar el módulo
if (typeof window !== 'undefined') {
  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preloadAllSounds);
  } else {
    preloadAllSounds();
  }
}
