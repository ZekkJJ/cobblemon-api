'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';

interface StardustInfo {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

interface StardustShopItem {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  cost: number;
  sprite: string;
  category: string;
  stock: number;
  maxPurchases: number;
  playerPurchases: number;
  canPurchase: boolean;
}

interface StardustDisplayProps {
  discordId: string;
  onBalanceChange?: (newBalance: number) => void;
}

// Stardust icon with animation
function StardustIcon({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      className={`${sizeClasses[size]} relative`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-cyan-400 rounded-full opacity-80" />
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 flex items-center justify-center text-white font-bold"
        style={{ fontSize: size === 'lg' ? '14px' : size === 'md' ? '10px' : '8px' }}
      >
        ✦
      </motion.div>
    </motion.div>
  );
}

// Shop item card
function ShopItemCard({ 
  item, 
  balance, 
  onPurchase 
}: { 
  item: StardustShopItem; 
  balance: number;
  onPurchase: (itemId: string) => Promise<void>;
}) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const canAfford = balance >= item.cost;
  const isAvailable = item.canPurchase && item.stock > 0;

  const handlePurchase = async () => {
    if (!canAfford || !isAvailable || isPurchasing) return;
    
    setIsPurchasing(true);
    try {
      await onPurchase(item.id);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`
        bg-gray-800/50 rounded-xl p-4 border transition-all
        ${canAfford && isAvailable 
          ? 'border-purple-500/30 hover:border-purple-500/60' 
          : 'border-gray-700/30 opacity-60'
        }
      `}
    >
      {/* Item Image */}
      <div className="relative w-16 h-16 mx-auto mb-3">
        {item.sprite ? (
          <Image
            src={item.sprite}
            alt={item.name}
            fill
            className="object-contain pixelated"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gray-700 rounded-lg flex items-center justify-center text-2xl">
            🎁
          </div>
        )}
      </div>

      {/* Item Info */}
      <h4 className="font-bold text-white text-center text-sm mb-1">
        {item.nameEs || item.name}
      </h4>
      <p className="text-xs text-gray-400 text-center mb-3 line-clamp-2">
        {item.descriptionEs || item.description}
      </p>

      {/* Stock */}
      {item.maxPurchases > 0 && (
        <p className="text-xs text-gray-500 text-center mb-2">
          {item.playerPurchases}/{item.maxPurchases} comprados
        </p>
      )}

      {/* Price & Buy Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <StardustIcon size="sm" />
          <span className={`font-bold ${canAfford ? 'text-purple-400' : 'text-red-400'}`}>
            {item.cost.toLocaleString()}
          </span>
        </div>
        
        <button
          onClick={handlePurchase}
          disabled={!canAfford || !isAvailable || isPurchasing}
          className={`
            px-3 py-1 rounded-lg text-xs font-bold transition-all
            ${canAfford && isAvailable
              ? 'bg-purple-600 text-white hover:bg-purple-500'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }
            ${isPurchasing ? 'opacity-50' : ''}
          `}
        >
          {isPurchasing ? '...' : isAvailable ? 'Comprar' : 'Agotado'}
        </button>
      </div>
    </motion.div>
  );
}

export function StardustDisplay({ discordId, onBalanceChange }: StardustDisplayProps) {
  const [stardust, setStardust] = useState<StardustInfo | null>(null);
  const [shopItems, setShopItems] = useState<StardustShopItem[]>([]);
  const [showShop, setShowShop] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);

  const fetchStardust = async () => {
    try {
      const res = await apiClient.get(`/api/pokemon-gacha/stardust?discordId=${discordId}`);
      if (res.success) {
        setStardust(res.stardust);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchShop = async () => {
    try {
      const res = await apiClient.get(`/api/pokemon-gacha/stardust/shop?discordId=${discordId}`);
      if (res.success) {
        setShopItems(res.items || []);
      }
    } catch (err: any) {
      console.error('Error fetching shop:', err);
    }
  };

  useEffect(() => {
    if (discordId) {
      fetchStardust();
      fetchShop();
    }
  }, [discordId]);

  const handlePurchase = async (itemId: string) => {
    try {
      const res = await apiClient.post('/api/pokemon-gacha/stardust/spend', {
        itemId,
        discordId,
      });

      if (res.success) {
        setPurchaseMessage(`✅ ${res.message}`);
        // Update balance
        if (stardust) {
          const newBalance = res.newBalance;
          setStardust({ ...stardust, balance: newBalance });
          onBalanceChange?.(newBalance);
        }
        // Refresh shop
        await fetchShop();
        
        setTimeout(() => setPurchaseMessage(null), 3000);
      }
    } catch (err: any) {
      setPurchaseMessage(`❌ ${err.message}`);
      setTimeout(() => setPurchaseMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-4 border border-purple-500/30">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-700 rounded-full" />
          <div className="h-6 bg-gray-700 rounded w-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Balance Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-4 border border-purple-500/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StardustIcon size="lg" />
            <div>
              <p className="text-xs text-gray-400">Stardust</p>
              <motion.p
                key={stardust?.balance}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
              >
                {(stardust?.balance || 0).toLocaleString()}
              </motion.p>
            </div>
          </div>
          
          <button
            onClick={() => setShowShop(!showShop)}
            className={`
              px-4 py-2 rounded-lg font-bold text-sm transition-all
              ${showShop 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }
            `}
          >
            {showShop ? '✕ Cerrar' : '🛒 Tienda'}
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mt-3 pt-3 border-t border-purple-500/20 text-xs text-gray-500">
          <div>
            <span className="text-green-400">{(stardust?.totalEarned || 0).toLocaleString()}</span> ganado
          </div>
          <div>
            <span className="text-red-400">{(stardust?.totalSpent || 0).toLocaleString()}</span> gastado
          </div>
        </div>
      </motion.div>

      {/* Purchase Message */}
      <AnimatePresence>
        {purchaseMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`
              p-3 rounded-lg text-center text-sm font-medium
              ${purchaseMessage.startsWith('✅') 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }
            `}
          >
            {purchaseMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shop */}
      <AnimatePresence>
        {showShop && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <span>🛒</span>
                <span>Tienda de Stardust</span>
              </h3>

              {shopItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No hay items disponibles en la tienda
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {shopItems.map((item) => (
                    <ShopItemCard
                      key={item.id}
                      item={item}
                      balance={stardust?.balance || 0}
                      onPurchase={handlePurchase}
                    />
                  ))}
                </div>
              )}

              {/* Info */}
              <p className="text-xs text-gray-500 text-center mt-4">
                💡 Obtén Stardust al conseguir Pokémon duplicados en el gacha
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
