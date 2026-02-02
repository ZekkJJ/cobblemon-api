'use client';

/**
 * Bid Modal
 * Cobblemon Los Pitufos
 * 
 * Modal para colocar una puja en una subasta.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { X, Gavel, AlertCircle, Check, Loader2, TrendingUp } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Listing, formatPrice } from '@/lib/types/player-shop';

interface BidModalProps {
  listing: Listing;
  userBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function BidModal({ 
  listing, 
  userBalance, 
  onClose, 
  onSuccess 
}: BidModalProps) {
  const currentBid = listing.currentBid || listing.startingBid || 0;
  const minBid = Math.ceil(currentBid * 1.05);
  
  const [bidAmount, setBidAmount] = useState(minBid.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const amount = parseInt(bidAmount) || 0;
  const hasEnoughBalance = userBalance >= amount;
  const isValidBid = amount >= minBid;

  const handleBid = async () => {
    if (!isValidBid) {
      setError(`La puja mínima es ${formatPrice(minBid)} CobbleDollars`);
      return;
    }

    if (!hasEnoughBalance) {
      setError('No tienes suficientes CobbleDollars');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post(`/api/player-shop/listings/${listing._id}/bid`, { 
        amount 
      });
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(response.error || 'Error al procesar la puja');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const getSpriteUrl = () => {
    return listing.pokemon.shiny
      ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${listing.pokemon.speciesId}.png`
      : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${listing.pokemon.speciesId}.png`;
  };

  // Quick bid buttons
  const quickBids = [
    { label: '+5%', amount: minBid },
    { label: '+10%', amount: Math.ceil(currentBid * 1.10) },
    { label: '+25%', amount: Math.ceil(currentBid * 1.25) },
    { label: '+50%', amount: Math.ceil(currentBid * 1.50) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-gradient-to-b from-slate-800 to-slate-900 
                 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Gavel className="w-5 h-5 text-orange-400" />
            Colocar Puja
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-700/50 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Success State */}
          {success && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 
                            flex items-center justify-center">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">¡Puja Exitosa!</h3>
              <p className="text-gray-400">
                Ahora eres el mayor postor. ¡Buena suerte!
              </p>
            </motion.div>
          )}

          {!success && (
            <>
              {/* Pokemon Preview */}
              <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-xl">
                <div className="relative w-16 h-16">
                  <Image
                    src={getSpriteUrl()}
                    alt={listing.pokemon.species}
                    fill
                    className="object-contain pixelated"
                    unoptimized
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white capitalize">
                    {listing.pokemon.nickname || listing.pokemon.species}
                  </h3>
                  <p className="text-sm text-gray-400">Nv. {listing.pokemon.level}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Puja actual</p>
                  <p className="text-lg font-bold text-orange-400">
                    {formatPrice(currentBid)} CD
                  </p>
                </div>
              </div>

              {/* Bid Input */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Tu puja (mínimo {formatPrice(minBid)} CD)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    min={minBid}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl
                             text-white text-lg font-bold placeholder-gray-500 
                             focus:outline-none focus:border-orange-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 font-medium">
                    CD
                  </span>
                </div>
              </div>

              {/* Quick Bid Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {quickBids.map(({ label, amount: quickAmount }) => (
                  <button
                    key={label}
                    onClick={() => setBidAmount(quickAmount.toString())}
                    disabled={quickAmount > userBalance}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors
                              ${parseInt(bidAmount) === quickAmount
                                ? 'bg-orange-500 text-white'
                                : 'bg-slate-700 text-gray-400 hover:text-white disabled:opacity-50'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Balance Info */}
              <div className="p-3 bg-slate-700/30 rounded-xl space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tu balance</span>
                  <span className={hasEnoughBalance ? 'text-green-400' : 'text-red-400'}>
                    {formatPrice(userBalance)} CD
                  </span>
                </div>
                {amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Después de pujar</span>
                    <span className={userBalance - amount >= 0 ? 'text-white' : 'text-red-400'}>
                      {formatPrice(Math.max(0, userBalance - amount))} CD
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 text-sm">
                  💡 Tu puja será reservada de tu balance. Si alguien te supera, 
                  se te devolverá automáticamente.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg 
                              flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-slate-700 text-gray-300 font-medium rounded-xl
                           hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBid}
                  disabled={loading || !hasEnoughBalance || !isValidBid}
                  className="flex-1 flex items-center justify-center gap-2 py-3 
                           bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold 
                           rounded-xl hover:from-orange-500 hover:to-amber-500 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Gavel className="w-5 h-5" />
                      Pujar
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
