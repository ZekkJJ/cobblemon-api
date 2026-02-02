'use client';

/**
 * Purchase Confirm Modal
 * Cobblemon Los Pitufos
 * 
 * Modal de confirmación para compra directa.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { X, ShoppingCart, AlertCircle, Check, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Listing, formatPrice } from '@/lib/types/player-shop';

interface PurchaseConfirmModalProps {
  listing: Listing;
  userBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function PurchaseConfirmModal({ 
  listing, 
  userBalance, 
  onClose, 
  onSuccess 
}: PurchaseConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const price = listing.price || 0;
  const hasEnoughBalance = userBalance >= price;
  const newBalance = userBalance - price;

  const handlePurchase = async () => {
    if (!hasEnoughBalance) {
      setError('No tienes suficientes CobbleDollars');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post(`/api/player-shop/listings/${listing._id}/purchase`);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(response.error || 'Error al procesar la compra');
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
            <ShoppingCart className="w-5 h-5 text-green-400" />
            Confirmar Compra
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
              <h3 className="text-xl font-bold text-white mb-2">¡Compra Exitosa!</h3>
              <p className="text-gray-400">
                Tu Pokémon será entregado cuando estés online en el servidor.
              </p>
            </motion.div>
          )}

          {!success && (
            <>
              {/* Pokemon Preview */}
              <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-xl">
                <div className="relative w-20 h-20">
                  <Image
                    src={getSpriteUrl()}
                    alt={listing.pokemon.species}
                    fill
                    className="object-contain pixelated"
                    unoptimized
                  />
                </div>
                <div>
                  <h3 className="font-bold text-white capitalize">
                    {listing.pokemon.nickname || listing.pokemon.species}
                  </h3>
                  <p className="text-sm text-gray-400">Nv. {listing.pokemon.level}</p>
                  <p className="text-sm text-gray-500">
                    Vendedor: {listing.sellerUsername}
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 p-4 bg-slate-700/30 rounded-xl">
                <div className="flex justify-between text-gray-400">
                  <span>Precio</span>
                  <span className="text-white font-bold">
                    {formatPrice(price)} CD
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Tu balance actual</span>
                  <span className={hasEnoughBalance ? 'text-green-400' : 'text-red-400'}>
                    {formatPrice(userBalance)} CD
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-600 flex justify-between">
                  <span className="text-gray-400">Balance después</span>
                  <span className={`font-bold ${newBalance >= 0 ? 'text-white' : 'text-red-400'}`}>
                    {formatPrice(Math.max(0, newBalance))} CD
                  </span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg 
                              flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Insufficient Balance Warning */}
              {!hasEnoughBalance && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-sm">
                    ⚠️ No tienes suficientes CobbleDollars para esta compra.
                    Necesitas {formatPrice(price - userBalance)} CD más.
                  </p>
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
                  onClick={handlePurchase}
                  disabled={loading || !hasEnoughBalance}
                  className="flex-1 flex items-center justify-center gap-2 py-3 
                           bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold 
                           rounded-xl hover:from-green-500 hover:to-emerald-500 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      Comprar
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
