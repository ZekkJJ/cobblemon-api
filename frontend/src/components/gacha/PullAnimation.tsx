'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GachaReward, RARITY_COLORS, Rarity } from '@/lib/types/gacha';
import { playGachaSound, playRevealSound, playPullSequence } from '@/lib/gacha-sounds';

interface PullAnimationProps {
  isPlaying: boolean;
  rewards: GachaReward[];
  onComplete: () => void;
}

// Configuración de animación por rareza
const RARITY_ANIMATION_CONFIG: Record<Rarity, {
  duration: number;
  shakeIntensity: number;
  particleCount: number;
  particleColor: string;
}> = {
  common: { duration: 1000, shakeIntensity: 0, particleCount: 5, particleColor: '#9CA3AF' },
  uncommon: { duration: 1200, shakeIntensity: 0, particleCount: 10, particleColor: '#22C55E' },
  rare: { duration: 1500, shakeIntensity: 2, particleCount: 15, particleColor: '#3B82F6' },
  epic: { duration: 2000, shakeIntensity: 5, particleCount: 25, particleColor: '#A855F7' },
  legendary: { duration: 2500, shakeIntensity: 8, particleCount: 40, particleColor: '#F59E0B' },
  mythic: { duration: 3000, shakeIntensity: 12, particleCount: 60, particleColor: '#EC4899' },
};

export function PullAnimation({ isPlaying, rewards, onComplete }: PullAnimationProps) {
  const [phase, setPhase] = useState<'idle' | 'gathering' | 'throwing' | 'shaking' | 'revealing' | 'complete'>('idle');
  const [currentRevealIndex, setCurrentRevealIndex] = useState(0);
  const [skipAnimation, setSkipAnimation] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [screenShake, setScreenShake] = useState(0);

  // Determinar la rareza más alta para ajustar la animación
  const highestRarity = rewards.reduce((highest, reward) => {
    const rarityOrder: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
    const currentIndex = rarityOrder.indexOf(reward.rarity);
    const highestIndex = rarityOrder.indexOf(highest);
    return currentIndex > highestIndex ? reward.rarity : highest;
  }, 'common' as Rarity);

  const hasShiny = rewards.some(r => r.isShiny);
  const animConfig = RARITY_ANIMATION_CONFIG[highestRarity];

  // Cargar preferencia de skip
  useEffect(() => {
    const savedPref = localStorage.getItem('gacha_skip_animation');
    if (savedPref === 'true') {
      setSkipAnimation(true);
    }
  }, []);

  // Mostrar botón de skip después de 1 segundo
  useEffect(() => {
    if (isPlaying && !skipAnimation) {
      const timer = setTimeout(() => setShowSkipButton(true), 1000);
      return () => clearTimeout(timer);
    }
    setShowSkipButton(false);
  }, [isPlaying, skipAnimation]);

  // Manejar skip
  const handleSkip = useCallback(() => {
    setPhase('revealing');
    setCurrentRevealIndex(rewards.length);
    setTimeout(() => {
      setPhase('complete');
      onComplete();
    }, 100);
  }, [rewards.length, onComplete]);

  // Guardar preferencia de skip
  const handleSkipPreference = useCallback((save: boolean) => {
    if (save) {
      localStorage.setItem('gacha_skip_animation', 'true');
      setSkipAnimation(true);
    }
    handleSkip();
  }, [handleSkip]);

  useEffect(() => {
    if (!isPlaying) {
      setPhase('idle');
      setCurrentRevealIndex(0);
      setScreenShake(0);
      return;
    }

    // Si skip está activado, ir directo a resultados
    if (skipAnimation) {
      setPhase('revealing');
      setCurrentRevealIndex(rewards.length);
      setTimeout(() => {
        setPhase('complete');
        onComplete();
      }, 100);
      return;
    }

    // Fase 1: Gathering (partículas convergiendo)
    setPhase('gathering');
    
    // Play pull sequence sounds
    playPullSequence();

    const gatherTimer = setTimeout(() => {
      // Fase 2: Throwing (lanzar pokeball)
      setPhase('throwing');
    }, 800);

    const throwTimer = setTimeout(() => {
      // Fase 3: Shaking (pokeball temblando)
      setPhase('shaking');
    }, 1500);

    const revealTimer = setTimeout(() => {
      // Fase 4: Revealing
      setPhase('revealing');
      
      // Play reveal sounds for highest rarity
      playRevealSound(highestRarity, hasShiny);
      
      // Screen shake para Epic+
      if (['epic', 'legendary', 'mythic'].includes(highestRarity) || hasShiny) {
        setScreenShake(animConfig.shakeIntensity);
        setTimeout(() => setScreenShake(0), 500);
      }
    }, 1500 + animConfig.duration);

    return () => {
      clearTimeout(gatherTimer);
      clearTimeout(throwTimer);
      clearTimeout(revealTimer);
    };
  }, [isPlaying, skipAnimation, highestRarity, hasShiny, animConfig, rewards.length, onComplete]);

  useEffect(() => {
    if (phase !== 'revealing') return;

    if (currentRevealIndex < rewards.length) {
      const timer = setTimeout(() => {
        setCurrentRevealIndex(prev => prev + 1);
      }, rewards.length === 1 ? 0 : 200);
      return () => clearTimeout(timer);
    } else {
      const completeTimer = setTimeout(() => {
        setPhase('complete');
        onComplete();
      }, 500);
      return () => clearTimeout(completeTimer);
    }
  }, [phase, currentRevealIndex, rewards.length, onComplete]);

  if (!isPlaying && phase === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: 1,
          x: screenShake ? [0, -screenShake, screenShake, -screenShake, 0] : 0,
        }}
        exit={{ opacity: 0 }}
        transition={{ x: { duration: 0.1, repeat: screenShake ? 5 : 0 } }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      >
        {/* Skip Button */}
        {showSkipButton && phase !== 'revealing' && phase !== 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-8 right-8 flex flex-col gap-2"
          >
            <button
              onClick={() => handleSkipPreference(false)}
              className="px-4 py-2 bg-gray-700/80 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              Saltar ⏭️
            </button>
            <button
              onClick={() => handleSkipPreference(true)}
              className="px-4 py-2 bg-gray-800/80 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors text-xs"
            >
              Siempre saltar
            </button>
          </motion.div>
        )}

        {/* Gathering Phase - Particles converging */}
        {phase === 'gathering' && (
          <motion.div className="relative w-64 h-64">
            {[...Array(animConfig.particleCount)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: (Math.random() - 0.5) * 400,
                  y: (Math.random() - 0.5) * 400,
                  scale: 0.5,
                  opacity: 0,
                }}
                animate={{
                  x: 0,
                  y: 0,
                  scale: 1,
                  opacity: [0, 1, 1],
                }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.02,
                  ease: 'easeIn',
                }}
                className="absolute left-1/2 top-1/2 w-3 h-3 rounded-full"
                style={{ backgroundColor: animConfig.particleColor }}
              />
            ))}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 1], opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
            </motion.div>
          </motion.div>
        )}

        {/* Throwing Phase - Pokeball throw */}
        {phase === 'throwing' && (
          <motion.div
            initial={{ y: 200, scale: 0.5, rotate: 0 }}
            animate={{ y: 0, scale: 1, rotate: 720 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-32 h-32 relative"
          >
            <PokeballSprite />
          </motion.div>
        )}

        {/* Shaking Phase - Pokeball shaking with suspense */}
        {phase === 'shaking' && (
          <motion.div className="flex flex-col items-center">
            <motion.div
              animate={{
                rotate: [0, -15, 15, -15, 15, -10, 10, -5, 5, 0],
                scale: [1, 1.05, 1, 1.05, 1, 1.02, 1, 1.01, 1, 1],
              }}
              transition={{
                duration: animConfig.duration / 1000,
                times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1],
              }}
              className="w-32 h-32 relative"
            >
              <PokeballSprite glowing={['epic', 'legendary', 'mythic'].includes(highestRarity)} />
            </motion.div>

            {/* Suspense dots */}
            <div className="flex gap-2 mt-6">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, delay: i * 0.2, repeat: Infinity }}
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: animConfig.particleColor }}
                />
              ))}
            </div>

            {/* Rarity hint particles */}
            {['epic', 'legendary', 'mythic'].includes(highestRarity) && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      x: (Math.random() - 0.5) * 200,
                      y: (Math.random() - 0.5) * 200,
                    }}
                    transition={{
                      duration: 1,
                      delay: i * 0.1,
                      repeat: Infinity,
                    }}
                    className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
                    style={{ backgroundColor: animConfig.particleColor }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Revealing Phase */}
        {phase === 'revealing' && (
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl p-8">
            {rewards.map((reward, index) => (
              <motion.div
                key={reward.rewardId}
                initial={{ scale: 0, rotateY: 180 }}
                animate={index < currentRevealIndex ? {
                  scale: 1,
                  rotateY: 0,
                } : {
                  scale: 0.8,
                  rotateY: 180,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 20,
                }}
                className={`
                  relative w-28 h-36 rounded-xl overflow-hidden
                  ${index < currentRevealIndex ? 'opacity-100' : 'opacity-50'}
                `}
                style={{
                  boxShadow: index < currentRevealIndex 
                    ? `0 0 30px ${RARITY_COLORS[reward.rarity]}` 
                    : 'none',
                }}
              >
                {index < currentRevealIndex ? (
                  <RewardCard reward={reward} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                    <span className="text-4xl">❓</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function PokeballSprite({ glowing = false }: { glowing?: boolean }) {
  return (
    <div className={`absolute inset-0 rounded-full bg-gradient-to-b from-red-500 to-red-600 overflow-hidden ${glowing ? 'animate-pulse' : ''}`}>
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-white" />
      <div className="absolute top-1/2 left-0 right-0 h-3 bg-gray-800 -translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border-4 border-gray-800" />
      {glowing && (
        <motion.div
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-t from-yellow-400/30 to-transparent"
        />
      )}
    </div>
  );
}

function RewardCard({ reward }: { reward: GachaReward }) {
  const name = reward.type === 'pokemon' 
    ? reward.pokemon?.nameEs || reward.pokemon?.name 
    : reward.item?.nameEs || reward.item?.name;
  
  const sprite = reward.type === 'pokemon'
    ? (reward.isShiny ? reward.pokemon?.spriteShiny : reward.pokemon?.sprite)
    : reward.item?.sprite;

  return (
    <div 
      className="w-full h-full flex flex-col items-center justify-center p-2 relative"
      style={{ 
        background: `linear-gradient(135deg, ${RARITY_COLORS[reward.rarity]}33, ${RARITY_COLORS[reward.rarity]}11)`,
        borderColor: RARITY_COLORS[reward.rarity],
      }}
    >
      {/* Shiny sparkle effect */}
      {reward.isShiny && (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1 right-1 text-lg"
          >
            ✨
          </motion.div>
          <motion.div
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-transparent"
          />
        </>
      )}

      {/* Mythic rainbow effect */}
      {reward.rarity === 'mythic' && (
        <motion.div
          animate={{ 
            background: [
              'linear-gradient(0deg, rgba(236,72,153,0.3), transparent)',
              'linear-gradient(90deg, rgba(168,85,247,0.3), transparent)',
              'linear-gradient(180deg, rgba(59,130,246,0.3), transparent)',
              'linear-gradient(270deg, rgba(236,72,153,0.3), transparent)',
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0"
        />
      )}

      {/* Sprite */}
      <div className="relative w-16 h-16 mb-2">
        {sprite && (
          <img
            src={sprite}
            alt={name}
            className="w-full h-full object-contain pixelated"
          />
        )}
      </div>

      {/* Name */}
      <p className="text-xs text-white font-bold text-center line-clamp-2">
        {name}
      </p>

      {/* Rarity */}
      <div 
        className="mt-1 px-2 py-0.5 rounded text-[10px] font-bold"
        style={{ 
          backgroundColor: `${RARITY_COLORS[reward.rarity]}33`,
          color: RARITY_COLORS[reward.rarity],
        }}
      >
        {reward.rarity.toUpperCase()}
      </div>
    </div>
  );
}
