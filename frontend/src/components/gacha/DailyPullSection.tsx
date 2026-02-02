'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api-client';

interface DailyPullStatus {
  canClaim: boolean;
  lastPullDate: string | null;
  currentStreak: number;
  longestStreak: number;
  totalDailyPulls: number;
  timeUntilNextPull: number;
  streakBonus: {
    bonusType: string;
    description: string;
  };
}

interface DailyPullSectionProps {
  discordId: string;
  onPull: () => Promise<void>;
  isPulling: boolean;
}

// Countdown timer component
function CountdownTimer({ milliseconds }: { milliseconds: number }) {
  const [timeLeft, setTimeLeft] = useState(milliseconds);

  useEffect(() => {
    setTimeLeft(milliseconds);
  }, [milliseconds]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <div className="flex items-center gap-1 font-mono">
      <span className="bg-gray-800 px-2 py-1 rounded text-lg">{String(hours).padStart(2, '0')}</span>
      <span className="text-gray-500">:</span>
      <span className="bg-gray-800 px-2 py-1 rounded text-lg">{String(minutes).padStart(2, '0')}</span>
      <span className="text-gray-500">:</span>
      <span className="bg-gray-800 px-2 py-1 rounded text-lg">{String(seconds).padStart(2, '0')}</span>
    </div>
  );
}

// Streak display component
function StreakDisplay({ streak, longestStreak }: { streak: number; longestStreak: number }) {
  const streakEmoji = streak >= 30 ? '🔥' : streak >= 14 ? '⭐' : streak >= 7 ? '✨' : '🌟';
  
  return (
    <div className="flex items-center gap-4">
      <div className="text-center">
        <motion.div
          key={streak}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-3xl font-bold text-orange-400"
        >
          {streakEmoji} {streak}
        </motion.div>
        <p className="text-xs text-gray-500">Racha Actual</p>
      </div>
      <div className="h-8 w-px bg-gray-700" />
      <div className="text-center">
        <div className="text-xl font-bold text-gray-400">🏆 {longestStreak}</div>
        <p className="text-xs text-gray-500">Mejor Racha</p>
      </div>
    </div>
  );
}

export function DailyPullSection({ discordId, onPull, isPulling }: DailyPullSectionProps) {
  const [status, setStatus] = useState<DailyPullStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await apiClient.get(`/api/pokemon-gacha/daily-status?discordId=${discordId}`);
      if (res.success && res.dailyStatus) {
        setStatus(res.dailyStatus);
      }
    } catch (err: any) {
      setError(err.message || 'Error cargando estado diario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (discordId) {
      fetchStatus();
    }
  }, [discordId]);

  const handleDailyPull = async () => {
    try {
      await onPull();
      // Refresh status after pull
      await fetchStatus();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-xl p-4 border border-green-500/30">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-700 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-700 rounded w-24 mb-2" />
            <div className="h-3 bg-gray-700 rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!status) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        rounded-xl p-4 border transition-all
        ${status.canClaim 
          ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-500/50 shadow-lg shadow-green-500/20' 
          : 'bg-gradient-to-br from-gray-800/40 to-gray-900/40 border-gray-700/50'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.span 
            className="text-2xl"
            animate={status.canClaim ? { rotate: [0, -10, 10, 0] } : {}}
            transition={{ duration: 0.5, repeat: status.canClaim ? Infinity : 0, repeatDelay: 2 }}
          >
            🎁
          </motion.span>
          <div>
            <h3 className="font-bold text-white">Tirada Diaria Gratis</h3>
            <p className="text-xs text-gray-400">Banner Estándar</p>
          </div>
        </div>
        
        {/* Streak */}
        <StreakDisplay streak={status.currentStreak} longestStreak={status.longestStreak} />
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {status.canClaim ? (
          <>
            {/* Available Pull */}
            <motion.button
              onClick={handleDailyPull}
              disabled={isPulling}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                w-full py-4 rounded-xl font-bold text-lg transition-all
                bg-gradient-to-r from-green-600 to-emerald-600 text-white
                hover:from-green-500 hover:to-emerald-500
                disabled:opacity-50 disabled:cursor-wait
                shadow-lg shadow-green-500/30
              `}
            >
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center justify-center gap-2"
              >
                <span>🎁</span>
                <span>¡Reclamar Tirada Gratis!</span>
                <span>🎁</span>
              </motion.span>
            </motion.button>

            {/* Streak Bonus Info */}
            {status.streakBonus && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center"
              >
                <p className="text-yellow-400 text-sm font-medium">
                  🌟 Bonus de Racha: {status.streakBonus.description}
                </p>
              </motion.div>
            )}
          </>
        ) : (
          <>
            {/* Countdown */}
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm mb-2">Próxima tirada disponible en:</p>
              <CountdownTimer milliseconds={status.timeUntilNextPull} />
            </div>

            {/* Disabled Button */}
            <button
              disabled
              className="w-full py-4 rounded-xl font-bold text-lg bg-gray-700 text-gray-500 cursor-not-allowed"
            >
              ⏳ Ya reclamaste tu tirada de hoy
            </button>
          </>
        )}

        {/* Stats */}
        <div className="flex justify-center gap-6 text-center text-xs text-gray-500 pt-2 border-t border-gray-700/50">
          <div>
            <span className="text-gray-400 font-medium">{status.totalDailyPulls}</span>
            <p>Tiradas Diarias Totales</p>
          </div>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 p-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-center"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
