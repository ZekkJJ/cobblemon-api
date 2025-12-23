'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '@/src/lib/audio-context';

export default function MusicPlayer() {
  const {
    isPlaying,
    isMuted,
    volume,
    currentTrack,
    currentTime,
    duration,
    frequencyData,
    playlist,
    togglePlay,
    toggleMute,
    setVolume,
    nextTrack,
    prevTrack,
    seekTo,
    selectTrack,
  } = useAudio();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Visualizer animation - uses real frequency data
  useEffect(() => {
    if (!canvasRef.current || !isExpanded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = 32;
      const barWidth = (canvas.width - (barCount - 1) * 2) / barCount;
      const maxHeight = canvas.height - 4;

      for (let i = 0; i < barCount; i++) {
        let barHeight: number;
        
        if (frequencyData && isPlaying) {
          // Use real frequency data - map bar index to frequency bin
          const freqIndex = Math.floor((i / barCount) * (frequencyData.length / 2));
          const value = frequencyData[freqIndex] || 0;
          barHeight = (value / 255) * maxHeight;
        } else {
          // Idle state - small bars
          barHeight = maxHeight * 0.05;
        }

        barHeight = Math.max(3, barHeight);
        const x = i * (barWidth + 2);
        const y = canvas.height - barHeight;

        const gradient = ctx.createLinearGradient(x, y, x, canvas.height);
        gradient.addColorStop(0, isPlaying ? '#ef4444' : '#64748b');
        gradient.addColorStop(1, isPlaying ? '#991b1b' : '#475569');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, frequencyData, isExpanded]);


  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seekTo(percent * duration);
  };

  if (!currentTrack) return null;

  return (
    <motion.div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
    >
      <motion.div
        layout
        className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden"
        style={{
          width: isExpanded ? 'min(320px, calc(100vw - 32px))' : 'auto',
          maxWidth: 'calc(100vw - 32px)',
        }}
      >
        {/* Collapsed Mini Player */}
        {!isExpanded && (
          <motion.div
            className="flex items-center gap-3 p-3 cursor-pointer"
            onClick={() => setIsExpanded(true)}
          >
            {/* Animated Icon */}
            <motion.div
              className={`
                w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0
                ${isPlaying ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-slate-700'}
              `}
              animate={isPlaying ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <i className="fas fa-music"></i>
            </motion.div>

            {/* Track Info with Ticker */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="overflow-hidden">
                <motion.div
                  className="text-white text-sm font-medium whitespace-nowrap"
                  animate={isPlaying ? { x: [0, -100, 0] } : {}}
                  transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
                >
                  {currentTrack.title} - {currentTrack.artist}
                </motion.div>
              </div>
              <div className="text-slate-400 text-xs">
                {isPlaying ? 'Reproduciendo...' : 'En pausa'}
              </div>
            </div>

            {/* Quick Controls */}
            <div className="flex items-center gap-2">
              <motion.button
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className={`
                  w-10 h-10 rounded-xl flex items-center justify-center text-white
                  ${isPlaying ? 'bg-red-500' : 'bg-slate-700'}
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
              </motion.button>
            </div>
          </motion.div>
        )}


        {/* Expanded Full Player */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    className={`
                      w-12 h-12 rounded-xl flex items-center justify-center text-white
                      ${isPlaying ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-slate-700'}
                    `}
                    animate={isPlaying ? { rotate: 360 } : {}}
                    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                  >
                    <i className="fas fa-compact-disc text-xl"></i>
                  </motion.div>
                  <div className="min-w-0">
                    <div className="text-white font-medium truncate">{currentTrack.title}</div>
                    <div className="text-slate-400 text-sm">{currentTrack.artist}</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center text-slate-400"
                >
                  <i className="fas fa-chevron-down"></i>
                </button>
              </div>

              {/* Visualizer */}
              <div className="relative mb-4">
                <canvas
                  ref={canvasRef}
                  width={288}
                  height={60}
                  className="w-full rounded-lg bg-slate-800/50"
                />
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div
                  className="h-2 bg-slate-700 rounded-full cursor-pointer group"
                  onClick={handleSeek}
                >
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full relative"
                    style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Main Controls */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <motion.button
                  onClick={prevTrack}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center text-slate-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <i className="fas fa-backward-step"></i>
                </motion.button>

                <motion.button
                  onClick={togglePlay}
                  className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl
                    ${isPlaying
                      ? 'bg-gradient-to-br from-red-500 to-red-600'
                      : 'bg-gradient-to-br from-slate-600 to-slate-700'
                    }
                  `}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                </motion.button>

                <motion.button
                  onClick={nextTrack}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center text-slate-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <i className="fas fa-forward-step"></i>
                </motion.button>
              </div>


              {/* Volume & Extras */}
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={toggleMute}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center text-slate-400"
                >
                  <i className={`fas ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${volume * 100}%, #334155 ${volume * 100}%)`,
                  }}
                />
                <button
                  onClick={() => setShowPlaylist(!showPlaylist)}
                  className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${
                    showPlaylist ? 'bg-red-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                  }`}
                >
                  <i className="fas fa-list"></i>
                </button>
              </div>

              {/* Playlist */}
              <AnimatePresence>
                {showPlaylist && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {playlist.map((track, idx) => (
                        <button
                          key={track.id}
                          onClick={() => selectTrack(track.id)}
                          className={`
                            w-full p-2 rounded-lg transition-all flex items-center gap-3 text-left cursor-pointer
                            ${track.id === currentTrack?.id
                              ? 'bg-red-500/20 text-white'
                              : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white'
                            }
                          `}
                        >
                          <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center text-xs
                            ${track.id === currentTrack?.id ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400'}
                          `}>
                            {track.id === currentTrack?.id && isPlaying ? (
                              <i className="fas fa-volume-high"></i>
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{track.title}</div>
                            <div className="text-xs text-slate-500">{track.artist}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
