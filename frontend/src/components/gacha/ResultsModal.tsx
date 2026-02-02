'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { GachaReward, RARITY_COLORS, RARITY_NAMES, RARITY_BG_COLORS, Rarity } from '@/lib/types/gacha';
import { playCelebrationSound } from '@/lib/gacha-sounds';

interface ResultsModalProps {
  isOpen: boolean;
  rewards: GachaReward[];
  onClose: () => void;
  isFirstTimeObtain?: boolean;
}

// Particle component for celebrations
function CelebrationParticles({ rarity, isShiny }: { rarity: Rarity; isShiny: boolean }) {
  const particles = Array.from({ length: isShiny ? 50 : 30 }, (_, i) => i);
  
  const getParticleColor = () => {
    if (isShiny) return ['#FFD700', '#FFA500', '#FFFF00', '#FFE4B5'];
    if (rarity === 'mythic') return ['#EC4899', '#F472B6', '#A855F7', '#8B5CF6'];
    if (rarity === 'legendary') return ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A'];
    return [RARITY_COLORS[rarity]];
  };

  const colors = getParticleColor();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{
            scale: [0, 1, 0],
            opacity: [1, 1, 0],
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200,
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: Math.random() * 0.5,
            repeat: Infinity,
            repeatDelay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}

// Full-screen celebration overlay for first-time Mythic/Shiny
function CelebrationOverlay({ reward, onDismiss }: { reward: GachaReward; onDismiss: () => void }) {
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOverlay(false);
      onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!showOverlay) return null;

  const name = reward.type === 'pokemon' 
    ? reward.pokemon?.nameEs || reward.pokemon?.name 
    : reward.item?.nameEs || reward.item?.name;

  const sprite = reward.type === 'pokemon'
    ? (reward.isShiny ? reward.pokemon?.spriteShiny : reward.pokemon?.sprite)
    : reward.item?.sprite;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => { setShowOverlay(false); onDismiss(); }}
      className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer"
      style={{
        background: reward.rarity === 'mythic' 
          ? 'linear-gradient(135deg, rgba(236,72,153,0.9), rgba(168,85,247,0.9), rgba(59,130,246,0.9))'
          : 'linear-gradient(135deg, rgba(255,215,0,0.9), rgba(255,165,0,0.9), rgba(255,255,0,0.9))',
      }}
    >
      <CelebrationParticles rarity={reward.rarity} isShiny={reward.isShiny} />
      
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 1 }}
        className="text-center relative z-10"
      >
        {/* Large Pokemon/Item Image */}
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            filter: reward.isShiny ? ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] : undefined,
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative w-64 h-64 mx-auto mb-8"
        >
          {sprite && (
            <Image
              src={sprite}
              alt={name || ''}
              fill
              className="object-contain drop-shadow-2xl"
              unoptimized
            />
          )}
          {reward.isShiny && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="text-6xl">✨</span>
            </motion.div>
          )}
        </motion.div>

        {/* Congratulations Text */}
        <motion.h1
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-5xl font-bold text-white mb-4 drop-shadow-lg"
        >
          {reward.isShiny ? '✨ ¡SHINY!' : '🎉 ¡INCREÍBLE!'}
        </motion.h1>

        <motion.p
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-3xl text-white/90 mb-6"
        >
          {name}
        </motion.p>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex justify-center gap-4"
        >
          <span 
            className="px-6 py-2 rounded-full text-lg font-bold"
            style={{ 
              backgroundColor: `${RARITY_COLORS[reward.rarity]}40`,
              color: RARITY_COLORS[reward.rarity],
              border: `2px solid ${RARITY_COLORS[reward.rarity]}`,
            }}
          >
            {RARITY_NAMES[reward.rarity]}
          </span>
          {reward.isShiny && (
            <span className="px-6 py-2 rounded-full text-lg font-bold bg-yellow-500/40 text-yellow-300 border-2 border-yellow-400">
              ✨ Shiny
            </span>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-8 text-white/60 text-sm"
        >
          Toca para continuar
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

export function ResultsModal({ isOpen, rewards, onClose, isFirstTimeObtain }: ResultsModalProps) {
  const [selectedReward, setSelectedReward] = useState<GachaReward | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationReward, setCelebrationReward] = useState<GachaReward | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check for celebration-worthy rewards
  useEffect(() => {
    if (isOpen && rewards.length > 0) {
      const mythicOrShiny = rewards.find(r => r.rarity === 'mythic' || r.isShiny);
      if (mythicOrShiny && isFirstTimeObtain) {
        setCelebrationReward(mythicOrShiny);
        setShowCelebration(true);
        // Play celebration sound
        playCelebrationSound();
      }
    }
  }, [isOpen, rewards, isFirstTimeObtain]);

  if (!isOpen) return null;

  const hasEpicOrBetter = rewards.some(r => ['epic', 'legendary', 'mythic'].includes(r.rarity));
  const hasLegendaryOrBetter = rewards.some(r => ['legendary', 'mythic'].includes(r.rarity));
  const hasMythic = rewards.some(r => r.rarity === 'mythic');
  const hasShiny = rewards.some(r => r.isShiny);

  // Count highlights
  const epicCount = rewards.filter(r => ['epic', 'legendary', 'mythic'].includes(r.rarity)).length;
  const shinyCount = rewards.filter(r => r.isShiny).length;

  // Get header style based on best reward
  const getHeaderStyle = () => {
    if (hasMythic) return 'bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 animate-gradient';
    if (hasShiny) return 'bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500';
    if (hasLegendaryOrBetter) return 'bg-gradient-to-r from-amber-500 to-yellow-600';
    if (hasEpicOrBetter) return 'bg-gradient-to-r from-purple-600 to-pink-600';
    return 'bg-gradient-to-r from-blue-600 to-cyan-600';
  };

  const getHeaderText = () => {
    if (hasMythic) return '🌟 ¡MÍTICO OBTENIDO!';
    if (hasShiny) return '✨ ¡SHINY OBTENIDO!';
    if (hasLegendaryOrBetter) return '🏆 ¡LEGENDARIO!';
    if (hasEpicOrBetter) return '💎 ¡Gran Tirada!';
    return '🎉 Resultados';
  };

  return (
    <AnimatePresence>
      {/* Celebration Overlay */}
      {showCelebration && celebrationReward && (
        <CelebrationOverlay 
          reward={celebrationReward} 
          onDismiss={() => setShowCelebration(false)} 
        />
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative"
        >
          {/* Particle effects for epic+ */}
          {hasEpicOrBetter && (
            <CelebrationParticles 
              rarity={hasMythic ? 'mythic' : hasLegendaryOrBetter ? 'legendary' : 'epic'} 
              isShiny={hasShiny} 
            />
          )}

          {/* Header */}
          <div className={`p-6 relative ${getHeaderStyle()}`}>
            {/* Animated background for mythic */}
            {hasMythic && (
              <motion.div
                className="absolute inset-0 opacity-30"
                animate={{
                  background: [
                    'linear-gradient(0deg, #EC4899, #A855F7, #3B82F6)',
                    'linear-gradient(120deg, #A855F7, #3B82F6, #EC4899)',
                    'linear-gradient(240deg, #3B82F6, #EC4899, #A855F7)',
                    'linear-gradient(360deg, #EC4899, #A855F7, #3B82F6)',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            )}
            
            <h2 className="text-2xl font-bold text-white text-center relative z-10">
              {getHeaderText()}
            </h2>
            <p className="text-white/80 text-center mt-1 relative z-10">
              {rewards.length} recompensa{rewards.length > 1 ? 's' : ''} obtenida{rewards.length > 1 ? 's' : ''}
              {epicCount > 0 && ` • ${epicCount} Épico+`}
              {shinyCount > 0 && ` • ${shinyCount} Shiny`}
            </p>
          </div>

          {/* Rewards Grid */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {rewards.map((reward) => (
                <RewardCard
                  key={reward.rewardId}
                  reward={reward}
                  onClick={() => setSelectedReward(reward)}
                  isSelected={selectedReward?.rewardId === reward.rewardId}
                />
              ))}
            </div>
          </div>

          {/* Selected Reward Details */}
          {selectedReward && (
            <div className="border-t border-gray-800 p-6">
              <RewardDetails reward={selectedReward} />
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-800 p-4 flex justify-center">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:from-blue-500 hover:to-cyan-500 transition-all"
            >
              Continuar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function RewardCard({ reward, onClick, isSelected }: { reward: GachaReward; onClick: () => void; isSelected: boolean }) {
  const name = reward.type === 'pokemon' 
    ? reward.pokemon?.nameEs || reward.pokemon?.name 
    : reward.item?.nameEs || reward.item?.name;
  
  const sprite = reward.type === 'pokemon'
    ? (reward.isShiny ? reward.pokemon?.spriteShiny : reward.pokemon?.sprite)
    : reward.item?.sprite;

  const isHighRarity = ['epic', 'legendary', 'mythic'].includes(reward.rarity);

  return (
    <motion.div
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      whileHover={{ scale: 1.08, y: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative cursor-pointer rounded-xl p-3 transition-all overflow-hidden
        ${RARITY_BG_COLORS[reward.rarity]}
        ${isSelected ? 'ring-2 ring-white' : ''}
        ${reward.isShiny ? 'ring-2 ring-yellow-400' : ''}
      `}
      style={{
        boxShadow: `0 0 ${isHighRarity ? '30' : '20'}px ${RARITY_COLORS[reward.rarity]}${isHighRarity ? '60' : '40'}`,
      }}
    >
      {/* Animated glow for high rarity */}
      {isHighRarity && (
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              `radial-gradient(circle at 30% 30%, ${RARITY_COLORS[reward.rarity]}, transparent)`,
              `radial-gradient(circle at 70% 70%, ${RARITY_COLORS[reward.rarity]}, transparent)`,
              `radial-gradient(circle at 30% 70%, ${RARITY_COLORS[reward.rarity]}, transparent)`,
              `radial-gradient(circle at 70% 30%, ${RARITY_COLORS[reward.rarity]}, transparent)`,
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}

      {/* Shiny sparkle effect */}
      {reward.isShiny && (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1 right-1 text-lg z-10"
          >
            ✨
          </motion.div>
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              background: 'linear-gradient(45deg, transparent 40%, rgba(255,215,0,0.4) 50%, transparent 60%)',
              backgroundSize: '200% 200%',
            }}
          />
        </>
      )}

      {/* Featured Indicator */}
      {reward.isFeatured && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-1 left-1 text-xs bg-gradient-to-r from-yellow-500 to-amber-500 text-black px-2 py-0.5 rounded font-bold z-10"
        >
          ⬆ UP
        </motion.div>
      )}

      {/* Sprite with animation */}
      <motion.div 
        className="relative w-full aspect-square mb-2"
        animate={reward.isShiny ? { 
          filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'],
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {sprite && (
          <Image
            src={sprite}
            alt={name || ''}
            fill
            className="object-contain pixelated drop-shadow-lg"
            unoptimized
          />
        )}
      </motion.div>

      {/* Name */}
      <p className="text-sm text-white font-bold text-center truncate relative z-10">
        {name}
      </p>

      {/* Rarity Badge */}
      <div className="flex justify-center mt-1 relative z-10">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-xs px-2 py-0.5 rounded font-bold"
          style={{
            backgroundColor: `${RARITY_COLORS[reward.rarity]}33`,
            color: RARITY_COLORS[reward.rarity],
            border: isHighRarity ? `1px solid ${RARITY_COLORS[reward.rarity]}` : 'none',
          }}
        >
          {RARITY_NAMES[reward.rarity]}
        </motion.span>
      </div>

      {/* Quantity for items */}
      {reward.type === 'item' && reward.item && reward.item.quantity > 1 && (
        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded z-10">
          x{reward.item.quantity}
        </div>
      )}
    </motion.div>
  );
}

function RewardDetails({ reward }: { reward: GachaReward }) {
  if (reward.type === 'pokemon' && reward.pokemon) {
    const pokemon = reward.pokemon;
    const ivTotal = pokemon.ivs.hp + pokemon.ivs.atk + pokemon.ivs.def + pokemon.ivs.spa + pokemon.ivs.spd + pokemon.ivs.spe;
    const ivPercentage = Math.round((ivTotal / 186) * 100);

    return (
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Pokemon Image */}
        <div className="flex-shrink-0 flex justify-center">
          <div 
            className="relative w-32 h-32 rounded-xl p-4"
            style={{ backgroundColor: `${RARITY_COLORS[reward.rarity]}20` }}
          >
            <Image
              src={reward.isShiny ? pokemon.spriteShiny || pokemon.sprite || '' : pokemon.sprite || ''}
              alt={pokemon.nameEs}
              fill
              className="object-contain pixelated"
              unoptimized
            />
          </div>
        </div>

        {/* Pokemon Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold text-white">{pokemon.nameEs}</h3>
            {reward.isShiny && <span className="text-yellow-400">✨ SHINY</span>}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Naturaleza</p>
              <p className="text-white capitalize">{pokemon.nature}</p>
            </div>
            <div>
              <p className="text-gray-400">IVs Totales</p>
              <p className="text-white">{ivTotal}/186 ({ivPercentage}%)</p>
            </div>
          </div>

          {/* IVs */}
          <div className="mt-4 grid grid-cols-6 gap-2">
            {[
              { label: 'PS', value: pokemon.ivs.hp },
              { label: 'ATK', value: pokemon.ivs.atk },
              { label: 'DEF', value: pokemon.ivs.def },
              { label: 'SpA', value: pokemon.ivs.spa },
              { label: 'SpD', value: pokemon.ivs.spd },
              { label: 'SPE', value: pokemon.ivs.spe },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-xs text-gray-400">{stat.label}</p>
                <p className={`text-sm font-bold ${stat.value === 31 ? 'text-yellow-400' : stat.value >= 25 ? 'text-green-400' : 'text-white'}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (reward.type === 'item' && reward.item) {
    return (
      <div className="flex items-center gap-4">
        <div 
          className="w-20 h-20 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${RARITY_COLORS[reward.rarity]}20` }}
        >
          {reward.item.sprite && (
            <Image
              src={reward.item.sprite}
              alt={reward.item.name}
              width={48}
              height={48}
              className="pixelated"
              unoptimized
            />
          )}
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">{reward.item.nameEs || reward.item.name}</h3>
          <p className="text-gray-400">Cantidad: {reward.item.quantity}</p>
          <p className="text-sm mt-1" style={{ color: RARITY_COLORS[reward.rarity] }}>
            {RARITY_NAMES[reward.rarity]}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
