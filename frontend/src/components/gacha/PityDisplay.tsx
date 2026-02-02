'use client';

import { PityStatus } from '@/lib/types/gacha';
import { motion } from 'framer-motion';

// Constantes de pity sincronizadas con backend (PITY_CONFIG)
// AJUSTADO: Hard pity subido a 400 tiradas
const PITY_CONFIG = {
  softPityStart: 350,      // Soft pity empieza en 350
  hardPity: 400,           // Hard pity garantiza Epic+ en 400
  softPityIncrement: 2,    // 2% por tirada después de soft pity
  baseEpicChance: 1.9,     // 1.5% epic + 0.4% legendary + 0.0001% mythic
};

interface PityDisplayProps {
  pityStatus: PityStatus | null;
  isLoading?: boolean;
}

export function PityDisplay({ pityStatus, isLoading }: PityDisplayProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-24 mb-3" />
        <div className="h-6 bg-gray-700 rounded w-full" />
      </div>
    );
  }

  if (!pityStatus) {
    return null;
  }

  // Usar campos del backend con fallback a constantes sincronizadas
  const currentPity = pityStatus.currentPity ?? pityStatus.pullsSinceEpic ?? 0;
  const softPityStart = pityStatus.softPityStart ?? PITY_CONFIG.softPityStart;
  const hardPity = pityStatus.hardPity ?? PITY_CONFIG.hardPity;
  
  // Calcular valores derivados
  const pityPercentage = (currentPity / hardPity) * 100;
  const pullsUntilHardPity = Math.max(0, hardPity - currentPity);
  const isSoftPityActive = currentPity >= softPityStart;
  
  // Calcular probabilidad de épico basada en pity (Genshin-style)
  // Base: 4.6% (Epic+), Soft pity (75+): +5% por cada tirada
  // Tirada 75: 4.6%, Tirada 76: 9.6%, Tirada 80: 29.6%, Tirada 89: 74.6%, Tirada 90: 100%
  const softPityPulls = isSoftPityActive ? currentPity - softPityStart : 0;
  const softPityBonus = softPityPulls * PITY_CONFIG.softPityIncrement;
  const epicChance = currentPity >= hardPity - 1 
    ? 100 
    : Math.min(PITY_CONFIG.baseEpicChance + softPityBonus, 100);

  // Determinar color de la barra según proximidad al hard pity
  const getProgressColor = () => {
    if (currentPity >= hardPity - 5) return 'from-pink-500 to-red-500';
    if (isSoftPityActive) return 'from-purple-500 to-pink-500';
    return 'from-blue-500 to-cyan-500';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 rounded-xl p-4 border border-purple-500/20"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>🎯</span>
          Sistema de Pity
        </h3>
        <div className="flex items-center gap-2">
          {isSoftPityActive && (
            <motion.span 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/30"
            >
              ✨ Soft Pity Activo
            </motion.span>
          )}
          {currentPity >= hardPity - 5 && (
            <motion.span 
              initial={{ scale: 0.8 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-xs bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded-full border border-pink-500/30"
            >
              🔥 ¡Casi!
            </motion.span>
          )}
        </div>
      </div>

      {/* Pity Progress Bar */}
      <div className="relative h-8 bg-gray-700 rounded-full overflow-hidden mb-3">
        {/* Soft Pity Zone Indicator */}
        <div 
          className="absolute top-0 bottom-0 bg-purple-500/20 border-l-2 border-purple-500/50"
          style={{ 
            left: `${(softPityStart / hardPity) * 100}%`,
            width: `${((hardPity - softPityStart) / hardPity) * 100}%` 
          }}
        />
        
        {/* Progress Bar */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pityPercentage, 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`absolute left-0 top-0 bottom-0 bg-gradient-to-r ${getProgressColor()}`}
        />

        {/* Soft Pity Marker */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-purple-400/70"
          style={{ left: `${(softPityStart / hardPity) * 100}%` }}
        />

        {/* Counter */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white drop-shadow-lg">
            {currentPity} / {hardPity}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-gray-700/50 rounded-lg p-2">
          <p className="text-gray-400">Hasta Hard Pity</p>
          <p className={`font-bold ${pullsUntilHardPity <= 5 ? 'text-pink-400' : 'text-white'}`}>
            {pullsUntilHardPity}
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-2">
          <p className="text-gray-400">Prob. Épico+</p>
          <p className={`font-bold ${epicChance >= 50 ? 'text-green-400' : 'text-purple-400'}`}>
            {epicChance.toFixed(1)}%
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-2">
          <p className="text-gray-400">Total Tiradas</p>
          <p className="text-cyan-400 font-bold">{pityStatus.totalPulls ?? 0}</p>
        </div>
      </div>

      {/* 50/50 Status */}
      {pityStatus.lost5050 !== undefined && (
        <div className="mt-3 text-center">
          <span className={`text-xs px-3 py-1 rounded-full ${
            pityStatus.lost5050 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-gray-600/50 text-gray-400'
          }`}>
            {pityStatus.lost5050 
              ? '✅ Próximo 5★ garantizado destacado' 
              : '🎲 50/50 en próximo 5★'
            }
          </span>
        </div>
      )}

      {/* Info Footer */}
      <p className="text-xs text-gray-500 mt-3 text-center">
        Soft Pity: {softPityStart} • Hard Pity: {hardPity} • +{PITY_CONFIG.softPityIncrement}% por tirada en soft pity
      </p>
    </motion.div>
  );
}
