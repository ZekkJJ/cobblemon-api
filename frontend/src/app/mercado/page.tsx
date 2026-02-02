'use client';

/**
 * Marketplace Page - Player Shop
 * Cobblemon Los Pitufos
 * 
 * Rediseño completo con estilo premium y subastas live.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  Clock,
  TrendingUp,
  ShoppingCart,
  Gavel,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Flame,
  Zap,
  Activity
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { MarketListingCard } from '@/components/player-shop/MarketListingCard';
import { ListingFiltersPanel } from '@/components/player-shop/ListingFiltersPanel';
import { PokemonDetailModal } from '@/components/player-shop/PokemonDetailModal';
import { CreateListingModal } from '@/components/player-shop/CreateListingModal';
import {
  Listing,
  ListingFilters,
} from '@/lib/types/player-shop';

export default function MercadoPage() {
  // State
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasMore: false,
  });

  // Filters
  const [filters, setFilters] = useState<ListingFilters>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'auction'>('all');

  // Modals
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // User session
  const [userSession, setUserSession] = useState<any>(null);

  // Live update tracking
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [hotListings, setHotListings] = useState<Set<string>>(new Set());
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load user from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.minecraftUuid) {
          setUserSession({ minecraftUuid: user.minecraftUuid });
        }
      } catch (error) {
        console.error('Error parsing user:', error);
      }
    }
  }, []);

  // Fetch listings
  const fetchListings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();

      if (filters.species || searchQuery) {
        queryParams.set('species', filters.species || searchQuery);
      }
      if (filters.type) queryParams.set('type', filters.type);
      if (filters.minPrice) queryParams.set('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) queryParams.set('maxPrice', filters.maxPrice.toString());
      if (filters.shinyOnly) queryParams.set('shinyOnly', 'true');

      // Tab filter
      if (activeTab === 'direct') queryParams.set('saleMethod', 'direct');
      if (activeTab === 'auction') queryParams.set('saleMethod', 'bidding');

      if (filters.sortBy) queryParams.set('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.set('sortOrder', filters.sortOrder);
      queryParams.set('page', filters.page?.toString() || '1');
      queryParams.set('limit', filters.limit?.toString() || '20');

      const response = await apiClient.get(`/api/player-shop/listings?${queryParams.toString()}`);

      if (response.success) {
        const newListings = response.listings || [];

        // Detect hot listings (recently bid on)
        if (silent && listings.length > 0) {
          const newHot = new Set<string>();
          newListings.forEach((newL: Listing) => {
            const oldL = listings.find(l => l._id === newL._id);
            if (oldL && newL.bidCount > oldL.bidCount) {
              newHot.add(newL._id);
            }
          });
          if (newHot.size > 0) {
            setHotListings(prev => new Set([...prev, ...newHot]));
            setTimeout(() => {
              setHotListings(prev => {
                const next = new Set(prev);
                newHot.forEach(id => next.delete(id));
                return next;
              });
            }, 5000);
          }
        }

        setListings(newListings);
        setPagination({
          page: response.page || 1,
          totalPages: response.totalPages || 1,
          total: response.total || 0,
          hasMore: response.hasMore || false,
        });
        setLastUpdate(new Date());
      } else {
        if (!silent) setError('Error loading listings');
      }
    } catch (err: any) {
      if (!silent) setError(err.message || 'Connection error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filters, searchQuery, activeTab, listings]);

  // Initial fetch and auto-refresh for auctions
  useEffect(() => {
    fetchListings();

    // Auto-refresh every 15 seconds for live auction updates
    refreshIntervalRef.current = setInterval(() => {
      fetchListings(true);
    }, 15000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [filters, searchQuery, activeTab]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, species: searchQuery, page: 1 }));
  };

  // Handle filter change
  const handleFilterChange = (newFilters: Partial<ListingFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  // Handle sort change
  const handleSortChange = (sortBy: ListingFilters['sortBy']) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 20,
    });
    setSearchQuery('');
  };

  // Count active auctions
  const activeAuctions = listings.filter(l => l.saleMethod === 'bidding').length;

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Dot pattern background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: 'radial-gradient(#1e3a3a 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Header */}
      <header className="relative border-b border-emerald-900/30 bg-gradient-to-b from-emerald-950/50 to-transparent">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 
                          border border-emerald-500/30 rounded-full">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold tracking-wide text-emerald-400 uppercase">
                Live Market
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-black text-center mb-4 tracking-tight">
            <span className="text-white">MARKET</span>{' '}
            <span className="text-emerald-400">PITUFO</span>
          </h1>

          <p className="text-center text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Buy, sell and auction Pokémon with other trainers.<br />
            <span className="text-emerald-400/80">Auctions updated in real-time.</span>
          </p>

          {/* Stats Bar */}
          <div className="flex justify-center gap-8 mt-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{pagination.total}</p>
              <p className="text-sm text-slate-500">Listings</p>
            </div>
            <div className="w-px bg-slate-700" />
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-400">{activeAuctions}</p>
              <p className="text-sm text-slate-500">Auctions</p>
            </div>
            <div className="w-px bg-slate-700" />
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">
                {Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s
              </p>
              <p className="text-sm text-slate-500">Last sync</p>
            </div>
          </div>
        </div>
      </header>

      {/* Controls Bar */}
      <div className="sticky top-0 z-40 bg-[#0a0f1a]/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Tabs */}
            <div className="flex bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
              <TabButton
                active={activeTab === 'all'}
                onClick={() => setActiveTab('all')}
                icon={<Sparkles className="w-4 h-4" />}
                label="All"
              />
              <TabButton
                active={activeTab === 'direct'}
                onClick={() => setActiveTab('direct')}
                icon={<ShoppingCart className="w-4 h-4" />}
                label="Direct Purchase"
              />
              <TabButton
                active={activeTab === 'auction'}
                onClick={() => setActiveTab('auction')}
                icon={<Gavel className="w-4 h-4" />}
                label="Auctions"
                badge={activeAuctions > 0 ? activeAuctions : undefined}
              />
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Pokémon..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                           text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50
                           transition-colors font-medium"
                />
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all
                          ${showFilters
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-emerald-500/30'}`}
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">Filters</span>
              </button>

              <button
                onClick={() => fetchListings()}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border border-slate-700 
                         rounded-xl text-slate-400 hover:border-emerald-500/30 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {userSession && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 
                           text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 
                           hover:shadow-emerald-500/30 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Sell</span>
                </motion.button>
              )}
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex flex-wrap gap-2 mt-4">
            <SortButton
              active={filters.sortBy === 'createdAt'}
              order={filters.sortBy === 'createdAt' ? filters.sortOrder : undefined}
              onClick={() => handleSortChange('createdAt')}
              icon={<Clock className="w-4 h-4" />}
              label="Recent"
            />
            <SortButton
              active={filters.sortBy === 'pitufipuntos'}
              order={filters.sortBy === 'pitufipuntos' ? filters.sortOrder : undefined}
              onClick={() => handleSortChange('pitufipuntos')}
              icon={<TrendingUp className="w-4 h-4" />}
              label="Power"
            />
            <SortButton
              active={filters.sortBy === 'price'}
              order={filters.sortBy === 'price' ? filters.sortOrder : undefined}
              onClick={() => handleSortChange('price')}
              icon={<Zap className="w-4 h-4" />}
              label="Price"
            />
            <SortButton
              active={filters.sortBy === 'expiresAt'}
              order={filters.sortBy === 'expiresAt' ? filters.sortOrder : undefined}
              onClick={() => handleSortChange('expiresAt')}
              icon={<Flame className="w-4 h-4" />}
              label="Ending"
            />
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-900/50 border-b border-slate-800"
          >
            <ListingFiltersPanel
              filters={filters}
              onChange={handleFilterChange}
              onClear={clearFilters}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 py-8">
        {/* Results info */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-500 font-medium">
            {pagination.total} {pagination.total === 1 ? 'result' : 'results'}
          </p>
          {Object.keys(filters).length > 4 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 font-medium"
            >
              <X className="w-4 h-4" />
              Clear filters
            </button>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-800/30 rounded-xl h-96 animate-pulse border border-slate-700/30" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && listings.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-800/50 border border-slate-700
                          flex items-center justify-center">
              <ShoppingCart className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-400 mb-2">
              No listings available
            </h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              {searchQuery || Object.keys(filters).length > 4
                ? 'Try different search filters'
                : 'Be the first to sell a Pokémon on the market'}
            </p>
            {userSession && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl 
                         hover:bg-emerald-500 transition-colors"
              >
                Create listing
              </button>
            )}
          </div>
        )}

        {/* Listings Grid */}
        {!loading && listings.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {listings.map((listing, index) => (
              <motion.div
                key={listing._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <MarketListingCard
                  listing={listing}
                  onClick={() => setSelectedListing(listing)}
                  isHot={hotListings.has(listing._id)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-400 
                       hover:text-white hover:border-emerald-500/30
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                let pageNum: number;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-11 h-11 rounded-xl font-bold transition-all
                              ${pagination.page === pageNum
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-white hover:border-emerald-500/30'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasMore}
              className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-400 
                       hover:text-white hover:border-emerald-500/30
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </main>

      {/* Pokemon Detail Modal */}
      <AnimatePresence>
        {selectedListing && (
          <PokemonDetailModal
            listing={selectedListing}
            onClose={() => setSelectedListing(null)}
            onPurchase={fetchListings}
            userSession={userSession}
          />
        )}
      </AnimatePresence>

      {/* Create Listing Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateListingModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchListings();
            }}
            userSession={userSession}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Tab Button Component
function TabButton({
  active,
  onClick,
  icon,
  label,
  badge
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all
                ${active
          ? 'bg-emerald-500/20 text-emerald-400'
          : 'text-slate-400 hover:text-white'}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {badge !== undefined && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs 
                       font-bold rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

// Sort Button Component
function SortButton({
  active,
  order,
  onClick,
  icon,
  label
}: {
  active: boolean;
  order?: 'asc' | 'desc';
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all
                ${active
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : 'bg-slate-800/30 text-slate-500 border border-transparent hover:text-slate-300'}`}
    >
      {icon}
      {label}
      {active && order && (
        <span className="text-xs opacity-70">
          {order === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </button>
  );
}
