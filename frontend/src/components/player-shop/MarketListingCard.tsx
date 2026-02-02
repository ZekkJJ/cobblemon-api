'use client';

/**
 * Market Listing Card Component
 * Cobblemon Los Pitufos
 * 
 * Tarjeta premium para el marketplace con diseño elegante
 * y soporte para subastas en tiempo real.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  Sparkles,
  Clock,
  Gavel,
  ShoppingCart,
  TrendingUp,
  Eye,
  Flame,
  Zap,
  Heart,
  Shield,
  Target,
  Wind
} from 'lucide-react';
import {
  Listing,
  getPowerTier,
  getPowerColor,
  formatPrice
} from '@/lib/types/player-shop';

interface MarketListingCardProps {
  listing: Listing;
  onClick: () => void;
  isHot?: boolean;
}

export function MarketListingCard({ listing, onClick, isHot = false }: MarketListingCardProps) {
  const { pokemon, pitufipuntos, saleMethod, price, currentBid, startingBid, expiresAt, bidCount } = listing;

  // Handle pitufipuntos
  const pitufipuntosTotal = typeof pitufipuntos === 'object' && pitufipuntos?.total
    ? pitufipuntos.total
    : (typeof pitufipuntos === 'number' ? pitufipuntos : (pokemon?.pitufipuntos || 0));

  // Live countdown for auctions
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (saleMethod !== 'bidding' || !expiresAt) return;

    const updateTime = () => {
      const remaining = new Date(expiresAt).getTime() - Date.now();
      setTimeRemaining(Math.max(0, remaining));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, saleMethod]);

  const isExpiringSoon = timeRemaining > 0 && timeRemaining < 3600000;
  const isEnding = timeRemaining > 0 && timeRemaining < 300000; // 5 minutes

  // Sprite URLs
  const spriteUrl = pokemon.shiny
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.speciesId}.png`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.speciesId}.png`;

  const animatedSpriteUrl = pokemon.speciesId <= 649
    ? pokemon.shiny
      ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/shiny/${pokemon.speciesId}.gif`
      : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemon.speciesId}.gif`
    : spriteUrl;

  const displayPrice = saleMethod === 'direct' ? price : (currentBid || startingBid);
  const powerColor = getPowerColor(pitufipuntosTotal);
  const powerTier = getPowerTier(pitufipuntosTotal);

  // Format countdown
  const formatCountdown = (ms: number) => {
    if (ms <= 0) return 'Ended';

    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }

    return `${seconds}s`;
  };

  // Get IV total
  const ivTotal = pokemon.ivs
    ? pokemon.ivs.hp + pokemon.ivs.attack + pokemon.ivs.defense +
    pokemon.ivs.spAttack + pokemon.ivs.spDefense + pokemon.ivs.speed
    : 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative bg-slate-800/60 rounded-xl border overflow-hidden cursor-pointer
                 transition-all duration-300 group
                 ${isHot
          ? 'border-orange-500/50 shadow-lg shadow-orange-500/20'
          : isEnding
            ? 'border-red-500/50 shadow-lg shadow-red-500/20'
            : 'border-slate-700/50 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10'}`}
    >
      {/* Hot indicator pulse */}
      {isHot && (
        <div className="absolute inset-0 bg-orange-500/10 animate-pulse pointer-events-none" />
      )}

      {/* Top badges row */}
      <div className="absolute top-3 left-3 right-3 z-10 flex justify-between items-start">
        {/* Left badges */}
        <div className="flex flex-col gap-1.5">
          {pokemon.shiny && (
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 backdrop-blur-sm
                          rounded-md border border-yellow-500/40">
              <Sparkles className="w-3 h-3 text-yellow-400" />
              <span className="text-xs font-bold text-yellow-400">SHINY</span>
            </div>
          )}
          {isHot && (
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 backdrop-blur-sm
                          rounded-md border border-orange-500/40 animate-pulse">
              <Flame className="w-3 h-3 text-orange-400" />
              <span className="text-xs font-bold text-orange-400">HOT</span>
            </div>
          )}
        </div>

        {/* Sale method badge */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md backdrop-blur-sm
                      ${saleMethod === 'direct'
            ? 'bg-emerald-500/20 border border-emerald-500/40'
            : 'bg-orange-500/20 border border-orange-500/40'}`}>
          {saleMethod === 'direct' ? (
            <>
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">BUY</span>
            </>
          ) : (
            <>
              <Gavel className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-bold text-orange-400">AUCTION</span>
            </>
          )}
        </div>
      </div>

      {/* Pokemon Sprite Area */}
      <div className="relative h-44 bg-gradient-to-b from-slate-700/30 to-transparent 
                    flex items-center justify-center overflow-hidden">
        {/* Background effects */}
        {pokemon.shiny && (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-yellow-500/5" />
        )}

        {/* Decorative icon */}
        <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity">
          {saleMethod === 'direct' ? (
            <ShoppingCart className="w-24 h-24 text-white" />
          ) : (
            <Gavel className="w-24 h-24 text-white" />
          )}
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-32 h-32 mt-4"
        >
          <Image
            src={animatedSpriteUrl}
            alt={pokemon.species}
            fill
            className="object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
            style={{ imageRendering: 'pixelated' }}
            unoptimized
          />
        </motion.div>
      </div>

      {/* Info Section */}
      <div className="p-4 space-y-3">
        {/* Name and Level */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-white text-lg capitalize truncate">
              {pokemon.nickname || pokemon.species}
            </h3>
            {pokemon.nickname && (
              <p className="text-xs text-slate-500 capitalize">{pokemon.species}</p>
            )}
          </div>
          <span className="flex-shrink-0 px-2.5 py-1 bg-slate-700/70 rounded-lg 
                         text-sm font-bold text-slate-300 border border-slate-600/50">
            Lv.{pokemon.level}
          </span>
        </div>

        {/* Stats preview */}
        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
          {/* Pitufipuntos */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" style={{ color: powerColor }} />
              <span className="text-xs text-slate-500 font-medium">Power</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: powerColor }}>
                {pitufipuntosTotal.toLocaleString()}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">
                {powerTier}
              </span>
            </div>
          </div>

          {/* Power bar */}
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((pitufipuntosTotal / 2000) * 100, 100)}%` }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="h-full rounded-full"
              style={{ backgroundColor: powerColor }}
            />
          </div>

          {/* IV Summary */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
            <span className="text-xs text-slate-500">IVs Total</span>
            <span className={`text-xs font-bold ${ivTotal >= 150 ? 'text-emerald-400' : ivTotal >= 100 ? 'text-yellow-400' : 'text-slate-400'}`}>
              {ivTotal}/186
            </span>
          </div>
        </div>

        {/* Price Section */}
        <div className={`rounded-lg p-3 border transition-colors
                      ${saleMethod === 'bidding' && isEnding
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-slate-900/50 border-slate-700/30'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">
                {saleMethod === 'direct' ? 'Price' : 'Current Bid'}
              </p>
              <p className="text-xl font-black text-white">
                {formatPrice(displayPrice || 0)}
                <span className="text-sm font-semibold text-emerald-400 ml-1">CD</span>
              </p>
            </div>

            {/* Auction info */}
            {saleMethod === 'bidding' && (
              <div className="text-right">
                <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                  <Gavel className="w-3 h-3" />
                  <span>{bidCount} {bidCount === 1 ? 'bid' : 'bids'}</span>
                </div>
                {timeRemaining > 0 && (
                  <div className={`flex items-center gap-1 text-sm font-bold
                                ${isEnding ? 'text-red-400 animate-pulse' : isExpiringSoon ? 'text-orange-400' : 'text-slate-300'}`}>
                    <Clock className="w-3.5 h-3.5" />
                    {formatCountdown(timeRemaining)}
                  </div>
                )}
                {timeRemaining <= 0 && (
                  <span className="text-xs text-red-400 font-bold">Ended</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {listing.viewCount} views
          </div>
          <span className="capitalize">{pokemon.nature}</span>
        </div>
      </div>

      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent 
                    opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  );
}
