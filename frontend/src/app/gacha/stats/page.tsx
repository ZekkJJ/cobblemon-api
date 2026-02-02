'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import { RARITY_COLORS, RARITY_NAMES, Rarity } from '@/lib/types/gacha';

interface GachaStats {
  totalPulls: number;
  totalSpent: number;
  rarityDistribution: Record<string, number>;
  shinyCount: number;
  featuredCount?: number;
  pokemonCount?: number;
  itemCount?: number;
  averagePityToEpic?: number;
  luckRating?: number;
}

interface PokedexStats {
  totalUnique: number;
  totalShiny: number;
  completionPercentage: number;
}

// Animated counter component
function AnimatedCounter({ value, duration = 1 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      setDisplayValue(Math.floor(progress * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
}

// Rarity bar chart
function RarityBarChart({ distribution, total }: { distribution: Record<string, number>; total: number }) {
  const rarities: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

  return (
    <div className="space-y-3">
      {rarities.map((rarity, index) => {
        const count = distribution[rarity] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        
        return (
          <motion.div 
            key={rarity}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-4"
          >
            <div className="w-24 text-sm font-medium" style={{ color: RARITY_COLORS[rarity] }}>
              {RARITY_NAMES[rarity]}
            </div>
            <div className="flex-1 h-8 bg-gray-700 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, delay: index * 0.1 }}
                className="h-full rounded-full relative"
                style={{ backgroundColor: RARITY_COLORS[rarity] }}
              >
                {percentage > 10 && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white/90">
                    {percentage.toFixed(1)}%
                  </span>
                )}
              </motion.div>
            </div>
            <div className="w-20 text-right text-sm text-gray-400">
              {count} ({percentage.toFixed(1)}%)
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// Luck meter component
function LuckMeter({ rating }: { rating: number }) {
  // Rating: 0-100, where 50 is average luck
  const getLuckLabel = () => {
    if (rating >= 80) return { text: '¡Increíble!', color: 'text-yellow-400', emoji: '🌟' };
    if (rating >= 65) return { text: 'Muy Buena', color: 'text-green-400', emoji: '😊' };
    if (rating >= 50) return { text: 'Normal', color: 'text-blue-400', emoji: '😐' };
    if (rating >= 35) return { text: 'Mala Suerte', color: 'text-orange-400', emoji: '😕' };
    return { text: 'Terrible', color: 'text-red-400', emoji: '😢' };
  };

  const luck = getLuckLabel();

  return (
    <div className="text-center">
      <div className="relative w-32 h-32 mx-auto mb-4">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke="#374151"
            strokeWidth="12"
          />
          <motion.circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke={rating >= 50 ? '#22C55E' : '#EF4444'}
            strokeWidth="12"
            strokeLinecap="round"
            initial={{ strokeDasharray: '0 352' }}
            animate={{ strokeDasharray: `${(rating / 100) * 352} 352` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-3xl">{luck.emoji}</span>
            <p className="text-2xl font-bold text-white">{rating}</p>
          </div>
        </div>
      </div>
      <p className={`text-lg font-bold ${luck.color}`}>{luck.text}</p>
      <p className="text-xs text-gray-500 mt-1">Índice de Suerte</p>
    </div>
  );
}

// Stat card component
function StatCard({ 
  icon, 
  label, 
  value, 
  subValue, 
  color = 'text-white' 
}: { 
  icon: string; 
  label: string; 
  value: number | string; 
  subValue?: string;
  color?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 rounded-xl p-4 text-center"
    >
      <span className="text-2xl mb-2 block">{icon}</span>
      <p className={`text-3xl font-bold ${color}`}>
        {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
      </p>
      <p className="text-sm text-gray-400">{label}</p>
      {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
    </motion.div>
  );
}

export default function GachaStatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<GachaStats | null>(null);
  const [pokedexStats, setPokedexStats] = useState<PokedexStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/gacha');
        return;
      }

      try {
        const user = JSON.parse(userStr);
        
        // Fetch gacha stats
        const statsRes = await apiClient.get(`/api/pokemon-gacha/stats?discordId=${user.discordId}`);
        if (statsRes.success && statsRes.stats) {
          setStats(statsRes.stats);
        }

        // Fetch pokedex stats
        try {
          const pokedexRes = await apiClient.get(`/api/pokemon-gacha/pokedex/stats?discordId=${user.discordId}`);
          if (pokedexRes.success && pokedexRes.stats) {
            setPokedexStats(pokedexRes.stats);
          }
        } catch (e) {
          // Pokedex stats are optional
        }
      } catch (err: any) {
        setError(err.message || 'Error cargando estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  // Calculate luck rating
  const luckRating = useMemo(() => {
    if (!stats || stats.totalPulls === 0) return 50;

    const epicPlus = (stats.rarityDistribution.epic || 0) + 
                     (stats.rarityDistribution.legendary || 0) + 
                     (stats.rarityDistribution.mythic || 0);
    
    const expectedEpicRate = 0.046; // 4.6%
    const actualEpicRate = epicPlus / stats.totalPulls;
    
    // Calculate luck based on deviation from expected
    const deviation = actualEpicRate / expectedEpicRate;
    let rating = 50 + (deviation - 1) * 50;
    
    // Bonus for shinies
    const expectedShinyRate = 1 / 4096;
    const actualShinyRate = stats.shinyCount / stats.totalPulls;
    if (actualShinyRate > expectedShinyRate) {
      rating += 10;
    }

    return Math.max(0, Math.min(100, Math.round(rating)));
  }, [stats]);

  // Calculate average pity
  const avgPity = useMemo(() => {
    if (!stats || stats.totalPulls === 0) return 0;
    const epicPlus = (stats.rarityDistribution.epic || 0) + 
                     (stats.rarityDistribution.legendary || 0) + 
                     (stats.rarityDistribution.mythic || 0);
    if (epicPlus === 0) return 0;
    return Math.round(stats.totalPulls / epicPlus);
  }, [stats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const rarities: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/gacha')}
            className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Volver
          </button>
          <h1 className="text-3xl font-bold text-white">📊 Estadísticas de Gacha</h1>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        {!stats || stats.totalPulls === 0 ? (
          <div className="bg-gray-800/50 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-lg">No tienes estadísticas aún</p>
            <button
              onClick={() => router.push('/gacha')}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
            >
              ¡Haz tu primera tirada!
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon="🎰"
                label="Tiradas Totales"
                value={stats.totalPulls}
                color="text-purple-400"
              />
              <StatCard
                icon="💰"
                label="CD Gastados"
                value={stats.totalSpent}
                color="text-yellow-400"
              />
              <StatCard
                icon="✨"
                label="Shinies"
                value={stats.shinyCount}
                subValue={`1/${stats.totalPulls > 0 ? Math.round(stats.totalPulls / Math.max(stats.shinyCount, 1)) : '∞'}`}
                color="text-cyan-400"
              />
              <StatCard
                icon="📈"
                label="Pity Promedio"
                value={avgPity}
                subValue="tiradas hasta Épico+"
                color="text-green-400"
              />
            </div>

            {/* Luck Meter & Rarity Distribution */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Luck Meter */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-800/50 rounded-xl p-6"
              >
                <h2 className="text-lg font-bold text-white mb-4 text-center">🍀 Tu Suerte</h2>
                <LuckMeter rating={luckRating} />
              </motion.div>

              {/* Rarity Distribution */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-800/50 rounded-xl p-6 md:col-span-2"
              >
                <h2 className="text-lg font-bold text-white mb-4">📊 Distribución por Rareza</h2>
                <RarityBarChart distribution={stats.rarityDistribution} total={stats.totalPulls} />
              </motion.div>
            </div>

            {/* Detailed Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/50 rounded-xl p-6"
            >
              <h2 className="text-lg font-bold text-white mb-4">🔍 Análisis Detallado</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Rates Comparison */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Tus Tasas vs Esperadas</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                      <span className="text-purple-400">Épico+</span>
                      <div className="text-right">
                        <span className="text-white font-bold">
                          {stats.totalPulls > 0 
                            ? (((stats.rarityDistribution.epic || 0) + 
                                (stats.rarityDistribution.legendary || 0) + 
                                (stats.rarityDistribution.mythic || 0)) / stats.totalPulls * 100).toFixed(2)
                            : 0}%
                        </span>
                        <span className="text-gray-500 text-sm ml-2">(esperado: 4.6%)</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                      <span className="text-yellow-400">Shiny</span>
                      <div className="text-right">
                        <span className="text-white font-bold">
                          1/{stats.totalPulls > 0 ? Math.round(stats.totalPulls / Math.max(stats.shinyCount, 1)) : '∞'}
                        </span>
                        <span className="text-gray-500 text-sm ml-2">(esperado: 1/4096)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Spending Analysis */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Análisis de Gasto</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                      <span className="text-gray-300">CD por Tirada</span>
                      <span className="text-yellow-400 font-bold">
                        {stats.totalPulls > 0 ? Math.round(stats.totalSpent / stats.totalPulls) : 0} CD
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                      <span className="text-gray-300">CD por Épico+</span>
                      <span className="text-purple-400 font-bold">
                        {(() => {
                          const epicPlus = (stats.rarityDistribution.epic || 0) + 
                                          (stats.rarityDistribution.legendary || 0) + 
                                          (stats.rarityDistribution.mythic || 0);
                          return epicPlus > 0 ? Math.round(stats.totalSpent / epicPlus).toLocaleString() : '∞';
                        })()} CD
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                      <span className="text-gray-300">CD por Shiny</span>
                      <span className="text-cyan-400 font-bold">
                        {stats.shinyCount > 0 ? Math.round(stats.totalSpent / stats.shinyCount).toLocaleString() : '∞'} CD
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Pokedex Progress */}
            {pokedexStats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-800/50 rounded-xl p-6"
              >
                <h2 className="text-lg font-bold text-white mb-4">📖 Progreso de Pokédex Gacha</h2>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-400">{pokedexStats.totalUnique}</p>
                    <p className="text-sm text-gray-400">Pokémon Únicos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-400">{pokedexStats.totalShiny}</p>
                    <p className="text-sm text-gray-400">Shinies Únicos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-400">{pokedexStats.completionPercentage}%</p>
                    <p className="text-sm text-gray-400">Completado</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pokedexStats.completionPercentage}%` }}
                    transition={{ duration: 1.5 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  />
                </div>
              </motion.div>
            )}

            {/* Tips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-500/30"
            >
              <h2 className="text-lg font-bold text-white mb-3">💡 Consejos</h2>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• El soft pity comienza en la tirada 350, aumentando las probabilidades de Épico+</li>
                <li>• El hard pity garantiza un Épico+ en la tirada 400</li>
                <li>• Las tiradas x10 tienen un 10% de descuento</li>
                <li>• Los duplicados se convierten en Stardust para la tienda</li>
                <li>• ¡No olvides tu tirada diaria gratuita!</li>
              </ul>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
