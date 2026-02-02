/**
 * Gacha Sound Effects Library
 * Cobblemon Los Pitufos
 * 
 * Handles all audio effects for the gacha system
 */

import { Rarity } from './types/gacha';

// Sound types for gacha
type GachaSoundType = 
  | 'pull_start'      // When pull animation starts
  | 'ball_shake'      // Pokeball shaking
  | 'reveal_common'   // Common/Uncommon/Rare reveal
  | 'reveal_epic'     // Epic reveal
  | 'reveal_legendary'// Legendary reveal
  | 'reveal_mythic'   // Mythic reveal
  | 'shiny_sparkle'   // Shiny overlay sound
  | 'celebration'     // Full celebration fanfare
  | 'daily_claim'     // Daily pull claimed
  | 'stardust_gain'   // Stardust earned
  | 'shop_purchase';  // Shop item purchased

// Sound URLs - using free sounds or placeholders
// These can be replaced with actual sound files
const GACHA_SOUNDS: Record<GachaSoundType, string> = {
  pull_start: '/sounds/gacha/pull-start.mp3',
  ball_shake: '/sounds/gacha/ball-shake.mp3',
  reveal_common: '/sounds/gacha/reveal-common.mp3',
  reveal_epic: '/sounds/gacha/reveal-epic.mp3',
  reveal_legendary: '/sounds/gacha/reveal-legendary.mp3',
  reveal_mythic: '/sounds/gacha/reveal-mythic.mp3',
  shiny_sparkle: '/sounds/gacha/shiny-sparkle.mp3',
  celebration: '/sounds/gacha/celebration.mp3',
  daily_claim: '/sounds/gacha/daily-claim.mp3',
  stardust_gain: '/sounds/gacha/stardust.mp3',
  shop_purchase: '/sounds/confirm.mp3', // Reuse existing
};

// Fallback sounds using Web Audio API for when files don't exist
const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

// Cache for loaded audio
const audioCache: Map<GachaSoundType, HTMLAudioElement> = new Map();
const failedSounds: Set<GachaSoundType> = new Set();

/**
 * Check if sounds are muted
 */
function isMuted(): boolean {
  if (typeof window === 'undefined') return true;
  const muted = localStorage.getItem('sfxMuted');
  return muted === 'true';
}

/**
 * Get volume preference
 */
function getVolume(): number {
  if (typeof window === 'undefined') return 0.5;
  const vol = localStorage.getItem('sfxVolume');
  return vol ? parseFloat(vol) : 0.5;
}

/**
 * Play a synthesized sound as fallback
 */
function playSynthSound(type: GachaSoundType): void {
  if (!audioContext || isMuted()) return;

  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    const volume = getVolume() * 0.3; // Lower volume for synth sounds
    
    switch (type) {
      case 'pull_start':
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3);
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
        
      case 'ball_shake':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
        gainNode.gain.setValueAtTime(volume * 0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
        
      case 'reveal_common':
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(550, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
        break;
        
      case 'reveal_epic':
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.4);
        break;
        
      case 'reveal_legendary':
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.15);
        oscillator.frequency.setValueAtTime(1320, audioContext.currentTime + 0.3);
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
        break;
        
      case 'reveal_mythic':
        // Play a chord-like sound
        const osc2 = audioContext.createOscillator();
        const osc3 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        const gain3 = audioContext.createGain();
        
        osc2.connect(gain2);
        osc3.connect(gain3);
        gain2.connect(audioContext.destination);
        gain3.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        osc2.type = 'sine';
        osc3.type = 'sine';
        
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
        osc2.frequency.setValueAtTime(659, audioContext.currentTime); // E5
        osc3.frequency.setValueAtTime(784, audioContext.currentTime); // G5
        
        gainNode.gain.setValueAtTime(volume * 0.7, audioContext.currentTime);
        gain2.gain.setValueAtTime(volume * 0.7, audioContext.currentTime);
        gain3.gain.setValueAtTime(volume * 0.7, audioContext.currentTime);
        
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        
        oscillator.start();
        osc2.start();
        osc3.start();
        oscillator.stop(audioContext.currentTime + 0.8);
        osc2.stop(audioContext.currentTime + 0.8);
        osc3.stop(audioContext.currentTime + 0.8);
        break;
        
      case 'shiny_sparkle':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1600, audioContext.currentTime + 0.05);
        oscillator.frequency.setValueAtTime(2000, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(volume * 0.6, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
        
      default:
        // Generic beep
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    }
  } catch (e) {
    // Silently fail
  }
}

/**
 * Play a gacha sound effect
 */
export function playGachaSound(type: GachaSoundType): void {
  if (typeof window === 'undefined') return;
  if (isMuted()) return;

  // If this sound has failed before, use synth fallback
  if (failedSounds.has(type)) {
    playSynthSound(type);
    return;
  }

  try {
    let audio = audioCache.get(type);
    
    if (!audio) {
      audio = new Audio(GACHA_SOUNDS[type]);
      audioCache.set(type, audio);
      
      audio.addEventListener('error', () => {
        failedSounds.add(type);
        audioCache.delete(type);
        // Try synth fallback
        playSynthSound(type);
      });
    }

    audio.currentTime = 0;
    audio.volume = getVolume();
    
    audio.play().catch(() => {
      failedSounds.add(type);
      playSynthSound(type);
    });
  } catch (error) {
    playSynthSound(type);
  }
}

/**
 * Play reveal sound based on rarity
 */
export function playRevealSound(rarity: Rarity, isShiny: boolean): void {
  if (isShiny) {
    playGachaSound('shiny_sparkle');
    // Small delay then play rarity sound
    setTimeout(() => {
      playRaritySound(rarity);
    }, 200);
  } else {
    playRaritySound(rarity);
  }
}

/**
 * Play sound based on rarity
 */
function playRaritySound(rarity: Rarity): void {
  switch (rarity) {
    case 'mythic':
      playGachaSound('reveal_mythic');
      break;
    case 'legendary':
      playGachaSound('reveal_legendary');
      break;
    case 'epic':
      playGachaSound('reveal_epic');
      break;
    default:
      playGachaSound('reveal_common');
  }
}

/**
 * Play celebration sound for first-time mythic/shiny
 */
export function playCelebrationSound(): void {
  playGachaSound('celebration');
}

/**
 * Play pull animation sounds in sequence
 */
export function playPullSequence(onShake?: () => void): void {
  playGachaSound('pull_start');
  
  // Shake sounds
  setTimeout(() => {
    playGachaSound('ball_shake');
    onShake?.();
  }, 500);
  
  setTimeout(() => {
    playGachaSound('ball_shake');
  }, 1000);
  
  setTimeout(() => {
    playGachaSound('ball_shake');
  }, 1500);
}

/**
 * Set sound volume
 */
export function setSoundVolume(volume: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sfxVolume', Math.max(0, Math.min(1, volume)).toString());
}

/**
 * Toggle sound mute
 */
export function toggleSoundMute(): boolean {
  if (typeof window === 'undefined') return true;
  const currentMuted = isMuted();
  localStorage.setItem('sfxMuted', (!currentMuted).toString());
  return !currentMuted;
}

/**
 * Check if sounds are currently muted
 */
export function areSoundsMuted(): boolean {
  return isMuted();
}
