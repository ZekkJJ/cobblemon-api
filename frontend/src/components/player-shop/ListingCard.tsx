'use client';

/**
 * Listing Card Component
 * Cobblemon Los Pitufos
 * 
 * Tarjeta de un listing en el marketplace.
 */

import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  Sparkles, 
  Clock, 
  Gavel, 
  ShoppingCart,
  TrendingUp,
  Eye
} from 'lucide-react';
import { 
  Listing, 
  getPowerTier, 
  getPowerColor, 
  formatTimeRemaining, 
  formatPrice 
} from '@/lib/types/player-shop';

interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
}

export function ListingCard({ listing, onClick }: ListingCardProps) {
  const { pokemon, pitufipuntos, saleMethod, price, currentBid, expiresAt, bidCount } = listing;
  
  // Handle pitufipuntos - can be object with .total or just a number
  const pitufipuntosTotal = typeof pitufipuntos === 'object' && pitufipuntos?.total 
    ? pitufipuntos.total 
    : (typeof pitufipuntos === 'number' ? pitufipuntos : (pokemon?.pitufipuntos || 0));
  
  // Calculate time remaining for auctions
  const timeRemaining = expiresAt 
    ? new Date(expiresAt).getTime() - Date.now() 
    : 0;
  const isExpiringSoon = timeRemaining > 0 && timeRemaining < 3600000; // Less than 1 hour

  // Get sprite URL
  const spriteUrl = pokemon.shiny
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.speciesId}.png`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.speciesId}.png`;

  // Animated sprite for Gen 1-5
  const animatedSpriteUrl = pokemon.speciesId <= 649
    ? pokemon.shiny
      ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/shiny/${pokemon.speciesId}.gif`
      : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemon.speciesId}.gif`
    : spriteUrl;

  const displayPrice = saleMethod === 'direct' ? price : currentBid;
  const powerColor = getPowerColor(pitufipuntosTotal);
  const powerTier = getPowerTier(pitufipuntosTotal);

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative bg-gradient-to-b from-slate-800/80 to-slate-900/80 rounded-xl 
                 border border-slate-700/50 overflow-hidden cursor-pointer
                 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10
                 transition-all duration-300 group"
    >
      {/* Shiny Indicator */}
      {pokemon.shiny && (
        <div className="absolute top-2 left-2 z-10">
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 rounded-full
                        border border-yellow-500/50">
            <Sparkles className="w-3 h-3 text-yellow-400" />
            <span className="text-xs font-medium text-yellow-400">Shiny</span>
          </div>
        </div>
      )}

      {/* Sale Method Badge */}
      <div className="absolute top-2 right-2 z-10">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                      ${saleMethod === 'direct' 
                        ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                        : 'bg-orange-500/20 border border-orange-500/50 text-orange-400'}`}>
          {saleMethod === 'direct' ? (
            <>
              <ShoppingCart className="w-3 h-3" />
              Compra
            </>
          ) : (
            <>
              <Gavel className="w-3 h-3" />
              Subasta
            </>
          )}
        </div>
      </div>

      {/* Pokemon Sprite */}
      <div className="relative h-40 bg-gradient-to-b from-slate-700/30 to-transparent 
                    flex items-center justify-center overflow-hidden">
        {/* Background glow for shiny */}
        {pokemon.shiny && (
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-yellow-500/10" />
        )}
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-32 h-32"
        >
          <Image
            src={animatedSpriteUrl}
            alt={pokemon.species}
            fill
            className="object-contain pixelated group-hover:scale-110 transition-transform duration-300"
            unoptimized
          />
        </motion.div>
      </div>

      {/* Info Section */}
      <div className="p-4 space-y-3">
        {/* Name and Level */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white capitalize">
              {pokemon.nickname || pokemon.species}
            </h3>
            {pokemon.nickname && (
              <p className="text-xs text-gray-500 capitalize">{pokemon.species}</p>
            )}
          </div>
          <span className="px-2 py-1 bg-slate-700/50 rounded-lg text-sm font-medium text-gray-300">
            Nv. {pokemon.level}
          </span>
        </div>

        {/* Pitufipuntos */}
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: powerColor }} />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold" style={{ color: powerColor }}>
                {pitufipuntosTotal.toLocaleString()} PP
              </span>
              <span className="text-xs text-gray-500">{powerTier}</span>
            </div>
            {/* Power bar */}
            <div className="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((pitufipuntosTotal / 2000) * 100, 100)}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="h-full rounded-full"
                style={{ backgroundColor: powerColor }}
              />
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
          <div>
            <p className="text-xs text-gray-500">
              {saleMethod === 'direct' ? 'Precio' : 'Puja actual'}
            </p>
            <p className="text-lg font-bold text-white">
              {formatPrice(displayPrice || 0)}
              <span className="text-sm font-normal text-purple-400 ml-1">CD</span>
            </p>
          </div>

          {/* Auction info */}
          {saleMethod === 'bidding' && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Gavel className="w-3 h-3" />
                {bidCount} {bidCount === 1 ? 'puja' : 'pujas'}
              </div>
              {timeRemaining > 0 && (
                <div className={`flex items-center gap-1 text-xs mt-1
                              ${isExpiringSoon ? 'text-red-400' : 'text-gray-400'}`}>
                  <Clock className="w-3 h-3" />
                  {formatTimeRemaining(timeRemaining)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* View count */}
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Eye className="w-3 h-3" />
          {listing.viewCount} vistas
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 
                    transition-opacity pointer-events-none" />
    </motion.div>
  );
}
