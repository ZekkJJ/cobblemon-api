'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { GachaBanner, RARITY_COLORS, RARITY_NAMES, Rarity } from '@/lib/types/gacha';

interface BannerCardProps {
  banner: GachaBanner;
  onSelect: (banner: GachaBanner) => void;
  isSelected: boolean;
  hasEpitomizedPath?: boolean;
  epitomizedTarget?: string;
}

// Default banner images by type
const DEFAULT_BANNER_IMAGES: Record<string, string> = {
  standard: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
  limited: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png',
  event: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/151.png',
};

// Animated countdown component
function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const end = new Date(endDate).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
      setIsUrgent(days === 0 && hours < 24);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
    return <span className="text-red-400">Expirado</span>;
  }

  return (
    <motion.div 
      className={`flex items-center gap-1 font-mono text-xs ${isUrgent ? 'text-red-400' : 'text-white'}`}
      animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 1, repeat: Infinity }}
    >
      {timeLeft.days > 0 && (
        <span className="bg-black/40 px-1.5 py-0.5 rounded">{timeLeft.days}d</span>
      )}
      <span className="bg-black/40 px-1.5 py-0.5 rounded">{String(timeLeft.hours).padStart(2, '0')}h</span>
      <span className="bg-black/40 px-1.5 py-0.5 rounded">{String(timeLeft.minutes).padStart(2, '0')}m</span>
      {timeLeft.days === 0 && (
        <span className="bg-black/40 px-1.5 py-0.5 rounded">{String(timeLeft.seconds).padStart(2, '0')}s</span>
      )}
    </motion.div>
  );
}

// Rate info tooltip
function RateInfoTooltip({ banner }: { banner: GachaBanner }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-full left-0 right-0 mb-2 p-4 bg-gray-900/95 rounded-xl border border-gray-700 shadow-xl z-20"
    >
      <h4 className="text-sm font-bold text-white mb-3">📊 Probabilidades</h4>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400">Común</span>
          <span className="text-gray-300">~60%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-400">Poco Común</span>
          <span className="text-gray-300">~25%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-blue-400">Raro</span>
          <span className="text-gray-300">~10%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-purple-400">Épico</span>
          <span className="text-gray-300">~4.5%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-amber-400">Legendario</span>
          <span className="text-gray-300">~0.06%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-pink-400">Mítico</span>
          <span className="text-gray-300">~0.001%</span>
        </div>
        <div className="border-t border-gray-700 pt-2 mt-2">
          <div className="flex justify-between">
            <span className="text-yellow-400">✨ Shiny</span>
            <span className="text-gray-300">1/4096</span>
          </div>
        </div>
        {banner.rateUpMultiplier > 1 && (
          <div className="border-t border-gray-700 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-cyan-400">⬆ Rate Up</span>
              <span className="text-cyan-300">x{banner.rateUpMultiplier}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function BannerCard({ banner, onSelect, isSelected, hasEpitomizedPath, epitomizedTarget }: BannerCardProps) {
  const [showRates, setShowRates] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getBannerTypeColor = () => {
    switch (banner.type) {
      case 'limited': return 'from-purple-600 to-pink-600';
      case 'event': return 'from-amber-500 to-orange-600';
      default: return 'from-blue-600 to-cyan-600';
    }
  };

  const getBannerTypeLabel = () => {
    switch (banner.type) {
      case 'limited': return '⭐ Limitado';
      case 'event': return '🎉 Evento';
      default: return '🎯 Estándar';
    }
  };

  const getBannerGradient = () => {
    switch (banner.type) {
      case 'limited': return 'from-purple-900 via-pink-900 to-gray-900';
      case 'event': return 'from-amber-900 via-orange-900 to-gray-900';
      default: return 'from-blue-900 via-cyan-900 to-gray-900';
    }
  };

  // Get the image to display
  const bannerImage = (!banner.artwork || imageError) 
    ? DEFAULT_BANNER_IMAGES[banner.type] || DEFAULT_BANNER_IMAGES.standard
    : banner.artwork;

  return (
    <motion.div
      onClick={() => onSelect(banner)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative cursor-pointer rounded-xl overflow-hidden transition-all duration-300
        ${isSelected 
          ? 'ring-4 ring-yellow-400 shadow-2xl shadow-yellow-400/30' 
          : 'hover:shadow-xl'
        }
      `}
    >
      {/* Animated border for limited banners */}
      {banner.type === 'limited' && (
        <motion.div
          className="absolute inset-0 rounded-xl z-0"
          style={{
            background: 'linear-gradient(90deg, #A855F7, #EC4899, #A855F7)',
            backgroundSize: '200% 100%',
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      )}

      <div className="relative m-[2px] rounded-xl overflow-hidden bg-gray-900">
        {/* Banner Image */}
        <div className={`relative h-56 bg-gradient-to-br ${getBannerGradient()}`}>
          {/* Animated background particles for limited */}
          {banner.type === 'limited' && (
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white/30 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [-20, -100],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
          )}

          <div className="absolute inset-0">
            {banner.artwork && !imageError ? (
              <Image
                src={bannerImage}
                alt={banner.nameEs || banner.name}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Image
                    src={bannerImage}
                    alt={banner.nameEs || banner.name}
                    width={150}
                    height={150}
                    className="object-contain drop-shadow-2xl"
                    onError={() => setImageError(true)}
                    unoptimized
                  />
                </motion.div>
              </div>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          
          {/* Type Badge */}
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getBannerTypeColor()} shadow-lg`}
          >
            {getBannerTypeLabel()}
          </motion.div>

          {/* Timer */}
          <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
            {banner.endDate ? (
              <CountdownTimer endDate={banner.endDate} />
            ) : (
              <span className="text-xs text-green-400 font-medium">♾️ Permanente</span>
            )}
          </div>

          {/* Epitomized Path Indicator */}
          {hasEpitomizedPath && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-cyan-500/80 text-white text-xs font-bold flex items-center gap-1"
            >
              <span>🎯</span>
              <span>{epitomizedTarget}</span>
            </motion.div>
          )}
        </div>

        {/* Banner Info */}
        <div className="p-4 bg-gray-900/95 relative">
          <h3 className="text-lg font-bold text-white mb-1">{banner.nameEs || banner.name}</h3>
          <p className="text-sm text-gray-400 mb-3 line-clamp-2">
            {banner.descriptionEs || banner.description || 'Banner de Pokémon Gacha'}
          </p>

          {/* Featured Pokemon */}
          {banner.featuredPokemon && banner.featuredPokemon.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <span>⬆</span> Destacados (Rate Up x{banner.rateUpMultiplier}):
              </p>
              <div className="flex flex-wrap gap-2">
                {banner.featuredPokemon.slice(0, 4).map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 transition-colors"
                    style={{ borderLeft: `3px solid ${RARITY_COLORS[item.rarity as Rarity] || '#666'}` }}
                  >
                    <div className="relative w-6 h-6">
                      <Image
                        src={item.sprite}
                        alt={item.name}
                        fill
                        className="object-contain pixelated"
                        unoptimized
                      />
                    </div>
                    <span className="text-xs text-white">{item.nameEs || item.name}</span>
                    <span 
                      className="text-[10px] px-1 rounded"
                      style={{ 
                        backgroundColor: `${RARITY_COLORS[item.rarity as Rarity]}20`,
                        color: RARITY_COLORS[item.rarity as Rarity],
                      }}
                    >
                      {RARITY_NAMES[item.rarity as Rarity]?.charAt(0) || item.rarity.charAt(0).toUpperCase()}
                    </span>
                  </motion.div>
                ))}
                {banner.featuredPokemon.length > 4 && (
                  <span className="text-xs text-gray-500 self-center">
                    +{banner.featuredPokemon.length - 4} más
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Costs with hover for rates */}
          <div 
            className="relative"
            onMouseEnter={() => setShowRates(true)}
            onMouseLeave={() => setShowRates(false)}
          >
            <div className="flex items-center justify-between text-sm bg-gray-800/50 rounded-lg p-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">1x:</span>
                <span className="text-yellow-400 font-bold">{banner.singlePullCost} CD</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">10x:</span>
                <span className="text-yellow-400 font-bold">{banner.multiPullCost} CD</span>
                <span className="text-xs bg-green-500/30 text-green-400 px-1.5 py-0.5 rounded">-10%</span>
              </div>
              <button className="text-gray-500 hover:text-white transition-colors text-xs">
                ℹ️
              </button>
            </div>

            {/* Rate tooltip */}
            <AnimatePresence>
              {showRates && <RateInfoTooltip banner={banner} />}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 border-4 border-yellow-400 rounded-xl pointer-events-none"
        >
          <div className="absolute top-2 left-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded">
            ✓ Seleccionado
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
