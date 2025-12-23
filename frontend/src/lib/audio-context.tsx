'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

interface Track {
  id: string;
  title: string;
  artist: string;
  src: string;
}

interface AudioContextType {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTrack: Track | null;
  currentTime: number;
  duration: number;
  audioLevel: number;
  bassLevel: number;
  playlist: Track[];
  frequencyData: Uint8Array | null;
  togglePlay: () => void;
  toggleMute: () => void;
  setVolume: (v: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (time: number) => void;
  selectTrack: (trackId: string) => void;
}

const AudioCtx = createContext<AudioContextType | null>(null);

export const useAudio = () => {
  const context = useContext(AudioCtx);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
};

// Playlist - archivos .mp3 en /public
const PLAYLIST: Track[] = [
  { id: '1', title: 'Littleroot Town', artist: 'Pokémon RSE', src: '/Litteroot Town.mp3' },
  { id: '2', title: 'Anville Town', artist: 'Pokémon B/W', src: '/Anville Town - Pokémon Black & Pokémon White (OST).mp3' },
  { id: '3', title: 'Lacunosa Town', artist: 'Pokémon B/W', src: '/Lacunosa Town - Pokémon Black & Pokémon White (OST).mp3' },
  { id: '4', title: 'White Forest', artist: 'Pokémon B/W', src: '/Pokemon Black & White [White Forest].mp3' },
  { id: '5', title: 'Cianwood City', artist: 'Pokémon HG/SS', src: '/Pokemon HeartGold and SoulSilver - Cianwood City.mp3' },
];

// Singleton audio manager that persists across page navigations
interface GlobalAudioState {
  audio: HTMLAudioElement | null;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  source: MediaElementAudioSourceNode | null;
  animationFrame: number | null;
  trackIndex: number;
  isInitialized: boolean;
}

declare global {
  interface Window {
    __pikaAudio?: GlobalAudioState;
    __audioData?: { audioLevel: number; bassLevel: number; isPlaying: boolean };
  }
}

function getGlobalAudio(): GlobalAudioState {
  if (typeof window === 'undefined') {
    return { audio: null, audioContext: null, analyser: null, source: null, animationFrame: null, trackIndex: 0, isInitialized: false };
  }
  
  if (!window.__pikaAudio) {
    window.__pikaAudio = {
      audio: null,
      audioContext: null,
      analyser: null,
      source: null,
      animationFrame: null,
      trackIndex: 0,
      isInitialized: false,
    };
  }
  
  return window.__pikaAudio;
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.3);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [bassLevel, setBassLevel] = useState(0);
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);

  const currentTrack = PLAYLIST[currentTrackIndex];


  // Setup audio analyser
  const setupAnalyser = useCallback((audio: HTMLAudioElement) => {
    const global = getGlobalAudio();
    if (global.audioContext) return; // Already setup

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      global.audioContext = ctx;
      global.analyser = analyser;
      global.source = source;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const analyze = () => {
        global.animationFrame = requestAnimationFrame(analyze);
        analyser.getByteFrequencyData(dataArray);

        // Update frequency data for visualizer
        setFrequencyData(new Uint8Array(dataArray));

        const sum = dataArray.reduce((a, b) => a + b, 0);
        const avg = sum / bufferLength / 255;
        setAudioLevel(avg);

        const bassSum = dataArray.slice(0, 10).reduce((a, b) => a + b, 0);
        const bassAvg = bassSum / 10 / 255;
        setBassLevel(bassAvg);

        window.__audioData = { audioLevel: avg, bassLevel: bassAvg, isPlaying: !audio.paused };
      };

      analyze();
    } catch (error) {
      console.warn('Audio analyser setup failed:', error);
    }
  }, []);

  // Initialize audio on mount
  useEffect(() => {
    const global = getGlobalAudio();
    
    // Load saved preferences
    const savedMuted = localStorage.getItem('musicMuted') === 'true';
    const savedVolume = localStorage.getItem('musicVolume');
    const savedTrack = localStorage.getItem('musicTrack');

    if (savedMuted) setIsMuted(true);
    if (savedVolume) setVolumeState(parseFloat(savedVolume));
    
    let initialTrackIndex = 0;
    if (savedTrack) {
      const idx = PLAYLIST.findIndex(t => t.id === savedTrack);
      if (idx >= 0) initialTrackIndex = idx;
    }

    // Check if audio already exists (page navigation)
    if (global.audio && global.isInitialized) {
      // Reuse existing audio
      setCurrentTrackIndex(global.trackIndex);
      setIsPlaying(!global.audio.paused);
      setDuration(global.audio.duration || 0);
      setCurrentTime(global.audio.currentTime || 0);
      
      // Re-attach event listeners
      const audio = global.audio;
      const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
      const handleLoadedMetadata = () => setDuration(audio.duration);
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => {
        setIsPlaying(false);
        window.__audioData = { audioLevel: 0, bassLevel: 0, isPlaying: false };
      };
      const handleEnded = () => {
        const newIndex = (global.trackIndex + 1) % PLAYLIST.length;
        global.trackIndex = newIndex;
        setCurrentTrackIndex(newIndex);
        const nextTrack = PLAYLIST[newIndex];
        audio.src = encodeURI(nextTrack.src);
        localStorage.setItem('musicTrack', nextTrack.id);
        audio.play().catch(console.warn);
      };

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
      };
    }

    // Create new audio element
    const audio = document.createElement('audio');
    audio.preload = 'auto';
    audio.volume = savedMuted ? 0 : (savedVolume ? parseFloat(savedVolume) : 0.3);
    
    global.audio = audio;
    global.trackIndex = initialTrackIndex;
    global.isInitialized = true;
    setCurrentTrackIndex(initialTrackIndex);

    // Load initial track
    const track = PLAYLIST[initialTrackIndex];
    audio.src = encodeURI(track.src);

    // Event listeners
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => {
      setIsPlaying(false);
      window.__audioData = { audioLevel: 0, bassLevel: 0, isPlaying: false };
    };
    const handleEnded = () => {
      const newIndex = (global.trackIndex + 1) % PLAYLIST.length;
      global.trackIndex = newIndex;
      setCurrentTrackIndex(newIndex);
      const nextTrack = PLAYLIST[newIndex];
      audio.src = encodeURI(nextTrack.src);
      localStorage.setItem('musicTrack', nextTrack.id);
      audio.play().catch(console.warn);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    // Auto-play on first user interaction
    const handleFirstInteraction = () => {
      setupAnalyser(audio);
      audio.play().catch(console.warn);
    };

    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      // DON'T destroy audio on unmount - keep it playing!
    };
  }, [setupAnalyser]);


  // Update volume
  useEffect(() => {
    const global = getGlobalAudio();
    if (global.audio) {
      global.audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = useCallback(() => {
    const global = getGlobalAudio();
    if (!global.audio) return;

    if (global.audio.paused) {
      if (!global.audioContext) {
        setupAnalyser(global.audio);
      }
      global.audio.play().catch(console.warn);
    } else {
      global.audio.pause();
    }
  }, [setupAnalyser]);

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem('musicMuted', String(newMuted));
  }, [isMuted]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    localStorage.setItem('musicVolume', String(v));
  }, []);

  const nextTrack = useCallback(() => {
    const global = getGlobalAudio();
    const newIndex = (currentTrackIndex + 1) % PLAYLIST.length;
    global.trackIndex = newIndex;
    setCurrentTrackIndex(newIndex);
    
    if (global.audio) {
      const track = PLAYLIST[newIndex];
      const wasPlaying = !global.audio.paused;
      global.audio.src = encodeURI(track.src);
      localStorage.setItem('musicTrack', track.id);
      if (wasPlaying) {
        global.audio.play().catch(console.warn);
      }
    }
  }, [currentTrackIndex]);

  const prevTrack = useCallback(() => {
    const global = getGlobalAudio();
    const newIndex = (currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    global.trackIndex = newIndex;
    setCurrentTrackIndex(newIndex);
    
    if (global.audio) {
      const track = PLAYLIST[newIndex];
      const wasPlaying = !global.audio.paused;
      global.audio.src = encodeURI(track.src);
      localStorage.setItem('musicTrack', track.id);
      if (wasPlaying) {
        global.audio.play().catch(console.warn);
      }
    }
  }, [currentTrackIndex]);

  const seekTo = useCallback((time: number) => {
    const global = getGlobalAudio();
    if (global.audio) {
      global.audio.currentTime = time;
    }
  }, []);

  const selectTrack = useCallback((trackId: string) => {
    const global = getGlobalAudio();
    const idx = PLAYLIST.findIndex(t => t.id === trackId);
    if (idx >= 0) {
      global.trackIndex = idx;
      setCurrentTrackIndex(idx);
      
      if (global.audio) {
        const track = PLAYLIST[idx];
        global.audio.src = encodeURI(track.src);
        localStorage.setItem('musicTrack', track.id);
        if (!global.audioContext) {
          setupAnalyser(global.audio);
        }
        global.audio.play().catch(console.warn);
      }
    }
  }, [setupAnalyser]);

  return (
    <AudioCtx.Provider
      value={{
        isPlaying,
        isMuted,
        volume,
        currentTrack,
        currentTime,
        duration,
        audioLevel,
        bassLevel,
        playlist: PLAYLIST,
        frequencyData,
        togglePlay,
        toggleMute,
        setVolume,
        nextTrack,
        prevTrack,
        seekTo,
        selectTrack,
      }}
    >
      {children}
    </AudioCtx.Provider>
  );
}
