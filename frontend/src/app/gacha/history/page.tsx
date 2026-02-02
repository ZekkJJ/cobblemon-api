'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import { GachaReward, RARITY_COLORS, RARITY_NAMES, Rarity } from '@/lib/types/gacha';

interface HistoryEntry {
  _id: string;
  playerId: string;
  bannerId: string;
  bannerName?: string;
  reward: GachaReward;
  rarity: Rarity;
  isShiny: boolean;
  isFeatured?: boolean;
  pityAtPull: number;
  cost: number;
  pulledAt: string;
}

interface HistoryFilters {
  rarity: Rarity | 'all';
  banner: string;
  shinyOnly: boolean;
  dateRange: 'all' | 'today' | 'week' | 'month';
  type: 'all' | 'pokemon' | 'item';
}

// Filter panel component
function FilterPanel({ 
  filters, 
  onFilterChange, 
  banners 
}: { 
  filters: HistoryFilters; 
  onFilterChange: (filters: HistoryFilters) => void;
  banners: string[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 rounded-xl p-4 mb-6"
    >
      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <span>🔍</span> Filtros
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Rarity Filter */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Rareza</label>
          <select
            value={filters.rarity}
            onChange={(e) => onFilterChange({ ...filters, rarity: e.target.value as Rarity | 'all' })}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-purple-500 focus:outline-none"
          >
            <option value="all">Todas</option>
            <option value="common">Común</option>
            <option value="uncommon">Poco Común</option>
            <option value="rare">Raro</option>
            <option value="epic">Épico</option>
            <option value="legendary">Legendario</option>
            <option value="mythic">Mítico</option>
          </select>
        </div>

        {/* Banner Filter */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Banner</label>
          <select
            value={filters.banner}
            onChange={(e) => onFilterChange({ ...filters, banner: e.target.value })}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-purple-500 focus:outline-none"
          >
            <option value="all">Todos</option>
            {banners.map((banner) => (
              <option key={banner} value={banner}>{banner}</option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Período</label>
          <select
            value={filters.dateRange}
            onChange={(e) => onFilterChange({ ...filters, dateRange: e.target.value as HistoryFilters['dateRange'] })}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-purple-500 focus:outline-none"
          >
            <option value="all">Todo el tiempo</option>
            <option value="today">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Tipo</label>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange({ ...filters, type: e.target.value as HistoryFilters['type'] })}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-purple-500 focus:outline-none"
          >
            <option value="all">Todos</option>
            <option value="pokemon">Pokémon</option>
            <option value="item">Items</option>
          </select>
        </div>

        {/* Shiny Only */}
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer bg-gray-700 rounded-lg px-3 py-2 w-full">
            <input
              type="checkbox"
              checked={filters.shinyOnly}
              onChange={(e) => onFilterChange({ ...filters, shinyOnly: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 text-purple-500 focus:ring-purple-500"
            />
            <span className="text-sm text-white">✨ Solo Shiny</span>
          </label>
        </div>
      </div>
    </motion.div>
  );
}

// History entry card
function HistoryCard({ entry, index }: { entry: HistoryEntry; index: number }) {
  const name = entry.reward.pokemon?.nameEs || entry.reward.pokemon?.name || entry.reward.item?.nameEs || entry.reward.item?.name || 'Desconocido';
  const sprite = entry.reward.pokemon?.sprite || entry.reward.item?.sprite;
  const isHighRarity = ['epic', 'legendary', 'mythic'].includes(entry.rarity);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`
        bg-gray-800/50 rounded-xl p-4 flex items-center gap-4 transition-all hover:bg-gray-800/70
        ${isHighRarity ? 'ring-1' : ''}
      `}
      style={{ 
        borderLeft: `4px solid ${RARITY_COLORS[entry.rarity] || '#666'}`,
        boxShadow: isHighRarity ? `0 0 20px ${RARITY_COLORS[entry.rarity]}20` : undefined,
      }}
    >
      {/* Sprite */}
      <div className="w-16 h-16 relative flex-shrink-0">
        {sprite ? (
          <Image
            src={entry.isShiny && entry.reward.pokemon?.spriteShiny ? entry.reward.pokemon.spriteShiny : sprite}
            alt={name}
            fill
            className="object-contain pixelated"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl bg-gray-700 rounded-lg">
            {entry.reward.type === 'pokemon' ? '🔮' : '🎁'}
          </div>
        )}
        {entry.isShiny && (
          <motion.span 
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-1 -right-1 text-lg"
          >
            ✨
          </motion.span>
        )}
        {entry.isFeatured && (
          <span className="absolute -top-1 -left-1 text-xs bg-yellow-500 text-black px-1 rounded font-bold">
            UP
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-white truncate">{name}</span>
          <span
            className="text-xs px-2 py-0.5 rounded font-medium"
            style={{ 
              backgroundColor: `${RARITY_COLORS[entry.rarity]}30`, 
              color: RARITY_COLORS[entry.rarity] 
            }}
          >
            {RARITY_NAMES[entry.rarity] || entry.rarity}
          </span>
          {entry.isShiny && (
            <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/30 text-yellow-400 font-medium">
              ✨ Shiny
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
          <span>Pity: {entry.pityAtPull}</span>
          <span>•</span>
          <span>{entry.cost} CD</span>
          {entry.bannerName && (
            <>
              <span>•</span>
              <span className="truncate">{entry.bannerName}</span>
            </>
          )}
        </div>
      </div>

      {/* Date */}
      <div className="text-right text-sm text-gray-500 flex-shrink-0">
        <div>{new Date(entry.pulledAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</div>
        <div>{new Date(entry.pulledAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    </motion.div>
  );
}

export default function GachaHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<HistoryFilters>({
    rarity: 'all',
    banner: 'all',
    shinyOnly: false,
    dateRange: 'all',
    type: 'all',
  });

  // Get unique banners from history
  const banners = useMemo(() => {
    const uniqueBanners = new Set(history.map(h => h.bannerName || h.bannerId));
    return Array.from(uniqueBanners);
  }, [history]);

  // Filter history
  const filteredHistory = useMemo(() => {
    return history.filter((entry) => {
      if (filters.rarity !== 'all' && entry.rarity !== filters.rarity) return false;
      if (filters.banner !== 'all' && (entry.bannerName || entry.bannerId) !== filters.banner) return false;
      if (filters.shinyOnly && !entry.isShiny) return false;
      if (filters.type !== 'all' && entry.reward.type !== filters.type) return false;
      
      if (filters.dateRange !== 'all') {
        const pullDate = new Date(entry.pulledAt);
        const now = new Date();
        
        if (filters.dateRange === 'today') {
          if (pullDate.toDateString() !== now.toDateString()) return false;
        } else if (filters.dateRange === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (pullDate < weekAgo) return false;
        } else if (filters.dateRange === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (pullDate < monthAgo) return false;
        }
      }
      
      return true;
    });
  }, [history, filters]);

  // Stats from filtered history
  const stats = useMemo(() => {
    const total = filteredHistory.length;
    const shinies = filteredHistory.filter(h => h.isShiny).length;
    const epics = filteredHistory.filter(h => ['epic', 'legendary', 'mythic'].includes(h.rarity)).length;
    const totalSpent = filteredHistory.reduce((sum, h) => sum + h.cost, 0);
    
    return { total, shinies, epics, totalSpent };
  }, [filteredHistory]);

  useEffect(() => {
    const fetchHistory = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/gacha');
        return;
      }

      try {
        const user = JSON.parse(userStr);
        const res = await apiClient.get(`/api/pokemon-gacha/history?discordId=${user.discordId}&limit=200`);
        if (res.success && res.history) {
          setHistory(res.history);
          setHasMore(res.history.length >= 200);
        }
      } catch (err: any) {
        setError(err.message || 'Error cargando historial');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Fecha', 'Nombre', 'Tipo', 'Rareza', 'Shiny', 'Pity', 'Costo', 'Banner'];
    const rows = filteredHistory.map(entry => [
      new Date(entry.pulledAt).toISOString(),
      entry.reward.pokemon?.name || entry.reward.item?.name || 'Unknown',
      entry.reward.type,
      entry.rarity,
      entry.isShiny ? 'Sí' : 'No',
      entry.pityAtPull,
      entry.cost,
      entry.bannerName || entry.bannerId,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gacha-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/gacha')}
              className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Volver
            </button>
            <h1 className="text-3xl font-bold text-white">📜 Historial de Tiradas</h1>
          </div>
          
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors text-sm font-medium"
          >
            📥 Exportar CSV
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-purple-400">{stats.total}</p>
            <p className="text-xs text-gray-500">Tiradas</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats.shinies}</p>
            <p className="text-xs text-gray-500">✨ Shinies</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-pink-400">{stats.epics}</p>
            <p className="text-xs text-gray-500">Épico+</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{stats.totalSpent.toLocaleString()}</p>
            <p className="text-xs text-gray-500">CD Gastados</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        {/* Filters */}
        <FilterPanel filters={filters} onFilterChange={setFilters} banners={banners} />

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <div className="bg-gray-800/50 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-lg">
              {history.length === 0 ? 'No tienes tiradas registradas' : 'No hay resultados con estos filtros'}
            </p>
            {history.length === 0 && (
              <button
                onClick={() => router.push('/gacha')}
                className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
              >
                ¡Haz tu primera tirada!
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredHistory.map((entry, index) => (
                <HistoryCard key={entry._id} entry={entry} index={index} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Load More */}
        {hasMore && filteredHistory.length >= 50 && (
          <div className="text-center mt-6">
            <p className="text-gray-500 text-sm">
              Mostrando {filteredHistory.length} de {history.length} tiradas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
