'use client';

/**
 * Pokemon Detail Modal - Premium Design
 * Cobblemon Los Pitufos
 * 
 * Modal con información detallada del Pokémon y opciones de compra/puja.
 * Diseño elegante con subastas en tiempo real.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  X,
  Sparkles,
  ShoppingCart,
  Gavel,
  TrendingUp,
  Clock,
  User,
  Zap,
  Shield,
  Heart,
  Target,
  Wind,
  Check,
  AlertCircle,
  Loader2,
  Crown,
  Flame,
  ChevronUp
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import {
  Listing,
  Bid,
  getPowerTier,
  getPowerColor,
  formatPrice,
  getIVColor
} from '@/lib/types/player-shop';

interface PokemonDetailModalProps {
  listing: Listing;
  onClose: () => void;
  onPurchase: () => void;
  userSession: any;
}

export function PokemonDetailModal({
  listing,
  onClose,
  onPurchase,
  userSession
}: PokemonDetailModalProps) {
  const [bidAmount, setBidAmount] = useState('');
  const [bidHistory, setBidHistory] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const bidInputRef = useRef<HTMLInputElement>(null);

  const { pokemon, pitufipuntos, saleMethod, price, currentBid, startingBid, expiresAt, bidCount } = listing;

  const pitufipuntosTotal = typeof pitufipuntos === 'object' && pitufipuntos?.total
    ? pitufipuntos.total
    : (typeof pitufipuntos === 'number' ? pitufipuntos : (pokemon?.pitufipuntos || 0));

  const minBid = Math.ceil((currentBid || startingBid || 100) * 1.05);
  const powerColor = getPowerColor(pitufipuntosTotal);
  const powerTier = getPowerTier(pitufipuntosTotal);

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

  useEffect(() => {
    if (saleMethod === 'bidding') {
      fetchBidHistory();
      const interval = setInterval(fetchBidHistory, 10000);
      return () => clearInterval(interval);
    }
  }, [listing._id, saleMethod]);

  const fetchBidHistory = async () => {
    try {
      const response = await apiClient.get(`/api/player-shop/listings/${listing._id}/bids`);
      if (response.success) {
        setBidHistory(response.bids || []);
      }
    } catch (err) {
      console.error('Error fetching bid history:', err);
    }
  };

  const spriteUrl = pokemon.shiny
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.speciesId}.png`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.speciesId}.png`;

  const handlePurchase = async () => {
    if (!userSession) {
      setError('You must sign in to buy');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post(`/api/player-shop/listings/${listing._id}/purchase`, {
        buyerUuid: userSession.minecraftUuid
      });

      if (response.success) {
        setSuccess(response.message || 'Purchase successful!');
        setTimeout(() => {
          onPurchase();
          onClose();
        }, 2000);
      } else {
        setError(response.error || 'Error processing purchase');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleBid = async () => {
    if (!userSession) {
      setError('You must sign in to bid');
      return;
    }

    const amount = parseInt(bidAmount);
    if (!amount || amount < minBid) {
      setError(`Minimum bid is ${formatPrice(minBid)} CobbleDollars`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post(`/api/player-shop/listings/${listing._id}/bid`, {
        amount,
        bidderUuid: userSession.minecraftUuid
      });

      if (response.success) {
        setSuccess(response.message || 'Bid successful!');
        setBidAmount('');
        fetchBidHistory();
        setTimeout(() => {
          setSuccess(null);
          onPurchase();
        }, 2000);
      } else {
        setError(response.error || 'Error processing bid');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const isOwnListing = userSession?.minecraftUuid === listing.sellerId;

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return { text: 'Ended', urgent: true };

    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return { text: `${days}d ${hours % 24}h ${minutes}m`, urgent: false };
    }

    if (hours > 0) {
      return { text: `${hours}h ${minutes}m ${seconds}s`, urgent: false };
    }

    return { text: `${minutes}m ${seconds}s`, urgent: minutes < 5 };
  };

  const countdown = formatCountdown(timeRemaining);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0f1419] 
                 rounded-2xl border border-slate-700/50 shadow-2xl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-xl bg-slate-800/80 backdrop-blur-sm
                   text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-slate-700/50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 space-y-6">
          {/* Pokemon Header */}
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 bg-slate-800/50 rounded-xl p-2">
              {pokemon.shiny && (
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-xl" />
              )}
              <Image
                src={spriteUrl}
                alt={pokemon.species}
                fill
                className="object-contain"
                style={{ imageRendering: 'pixelated' }}
                unoptimized
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-black text-white capitalize">
                  {pokemon.nickname || pokemon.species}
                </h2>
                {pokemon.shiny && (
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                )}
              </div>
              {pokemon.nickname && (
                <p className="text-slate-500 capitalize text-sm">{pokemon.species}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className="px-2 py-1 bg-slate-800 rounded-lg text-sm text-white font-medium">
                  Lv. {pokemon.level}
                </span>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" style={{ color: powerColor }} />
                  <span className="text-sm font-bold" style={{ color: powerColor }}>
                    {pitufipuntosTotal.toLocaleString()} PP
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'HP', value: pokemon.ivs?.hp ?? 0, icon: Heart },
              { label: 'ATK', value: pokemon.ivs?.attack ?? 0, icon: Zap },
              { label: 'DEF', value: pokemon.ivs?.defense ?? 0, icon: Shield },
              { label: 'SP.ATK', value: pokemon.ivs?.spAttack ?? 0, icon: Flame },
              { label: 'SP.DEF', value: pokemon.ivs?.spDefense ?? 0, icon: Target },
              { label: 'SPD', value: pokemon.ivs?.speed ?? 0, icon: Wind },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400">{label}</span>
                </div>
                <span className="text-lg font-bold" style={{ color: getIVColor(value) }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Price Section */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
            {saleMethod === 'direct' ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-400" />
                  <span className="text-slate-300">Price</span>
                </div>
                <span className="text-2xl font-black text-emerald-400">
                  {formatPrice(price || 0)} CD
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gavel className="w-5 h-5 text-orange-400" />
                    <span className="text-slate-300">Current Bid</span>
                  </div>
                  <span className="text-2xl font-black text-orange-400">
                    {formatPrice(currentBid || startingBid || 0)} CD
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400">Time remaining</span>
                  </div>
                  <span className={countdown.urgent ? 'text-red-400 font-bold' : 'text-slate-300'}>
                    {countdown.text}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Total Bids</span>
                  <span className="text-slate-300">{bidCount || 0}</span>
                </div>
              </div>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* Action Buttons */}
          {!isOwnListing && !success && (
            <div className="space-y-3">
              {saleMethod === 'direct' ? (
                <button
                  onClick={handlePurchase}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-4 
                           bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold 
                           rounded-xl hover:from-emerald-500 hover:to-green-500 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      Buy Now
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      ref={bidInputRef}
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={`Minimum ${formatPrice(minBid)} CD`}
                      min={minBid}
                      className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl
                               text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                    />
                    <button
                      onClick={handleBid}
                      disabled={loading || timeRemaining <= 0}
                      className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 
                               text-white font-bold rounded-xl hover:from-orange-500 hover:to-amber-500 
                               disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Gavel className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {isOwnListing && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
              <p className="text-blue-400 text-sm">This is your listing</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
