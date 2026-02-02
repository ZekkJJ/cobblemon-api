'use client';

/**
 * My Listings Page Component
 * Cobblemon Los Pitufos
 * 
 * Página para ver y gestionar los listings del usuario.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  ShoppingCart, 
  Gavel, 
  Clock, 
  Eye, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { 
  Listing, 
  ListingStatus,
  formatPrice, 
  formatTimeRemaining,
  getPowerColor 
} from '@/lib/types/player-shop';

interface MyListingsPageProps {
  userSession: any;
}

export function MyListingsPage({ userSession }: MyListingsPageProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMyListings();
  }, [userSession]);

  const fetchMyListings = async () => {
    // No user session - show not logged in state
    if (!userSession?.minecraftUuid) {
      setListings([]);
      setLoading(false);
      setError('Debes iniciar sesión con Discord y verificar tu cuenta de Minecraft para ver tus ventas.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(`/api/player-shop/my-listings?uuid=${userSession.minecraftUuid}`);
      
      if (response.success) {
        setListings(response.listings || []);
      } else {
        setError('Error al cargar tus listings');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelListing = async (listingId: string) => {
    if (!confirm('¿Estás seguro de cancelar este listing? Tu Pokémon será devuelto.')) {
      return;
    }

    setCancellingId(listingId);

    try {
      const response = await apiClient.delete(`/api/player-shop/listings/${listingId}?uuid=${userSession?.minecraftUuid}`);
      
      if (response.success) {
        // Refresh listings
        fetchMyListings();
      } else {
        alert(response.error || 'Error al cancelar el listing');
      }
    } catch (err: any) {
      alert(err.message || 'Error de conexión');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: ListingStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 
                         text-xs font-medium rounded-full">
            <CheckCircle className="w-3 h-3" />
            Activo
          </span>
        );
      case 'sold':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 
                         text-xs font-medium rounded-full">
            <ShoppingCart className="w-3 h-3" />
            Vendido
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-400 
                         text-xs font-medium rounded-full">
            <XCircle className="w-3 h-3" />
            Cancelado
          </span>
        );
      case 'expired':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-400 
                         text-xs font-medium rounded-full">
            <Clock className="w-3 h-3" />
            Expirado
          </span>
        );
    }
  };

  const getSpriteUrl = (pokemon: Listing['pokemon']) => {
    return pokemon.shiny
      ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.speciesId}.png`
      : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.speciesId}.png`;
  };

  // Separate listings by status
  const activeListings = listings.filter(l => l.status === 'active');
  const completedListings = listings.filter(l => l.status !== 'active');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Mis Listings</h2>
        <button
          onClick={fetchMyListings}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg text-gray-300 
                   hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && listings.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            No tienes listings
          </h3>
          <p className="text-gray-500">
            Crea tu primer listing para vender un Pokémon
          </p>
        </div>
      )}

      {/* Active Listings */}
      {!loading && activeListings.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-300">
            Activos ({activeListings.length})
          </h3>
          {activeListings.map((listing) => (
            <ListingRow
              key={listing._id}
              listing={listing}
              getSpriteUrl={getSpriteUrl}
              getStatusBadge={getStatusBadge}
              onCancel={handleCancelListing}
              cancelling={cancellingId === listing._id}
            />
          ))}
        </div>
      )}

      {/* Completed Listings */}
      {!loading && completedListings.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-300">
            Historial ({completedListings.length})
          </h3>
          {completedListings.map((listing) => (
            <ListingRow
              key={listing._id}
              listing={listing}
              getSpriteUrl={getSpriteUrl}
              getStatusBadge={getStatusBadge}
              onCancel={handleCancelListing}
              cancelling={false}
              isHistory
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Listing Row Component
function ListingRow({
  listing,
  getSpriteUrl,
  getStatusBadge,
  onCancel,
  cancelling,
  isHistory = false
}: {
  listing: Listing;
  getSpriteUrl: (p: Listing['pokemon']) => string;
  getStatusBadge: (s: ListingStatus) => React.ReactNode;
  onCancel: (id: string) => void;
  cancelling: boolean;
  isHistory?: boolean;
}) {
  const { pokemon, saleMethod, price, currentBid, startingBid, bidCount, expiresAt, status, viewCount, finalPrice } = listing;
  
  const timeRemaining = expiresAt 
    ? new Date(expiresAt).getTime() - Date.now() 
    : 0;

  const displayPrice = status === 'sold' 
    ? finalPrice 
    : saleMethod === 'direct' 
      ? price 
      : currentBid || startingBid;

  const canCancel = status === 'active' && (saleMethod === 'direct' || bidCount === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border 
                ${isHistory ? 'border-slate-700/50 opacity-75' : 'border-slate-700'}`}
    >
      {/* Pokemon Sprite */}
      <div className="relative w-16 h-16 flex-shrink-0">
        <Image
          src={getSpriteUrl(pokemon)}
          alt={pokemon.species}
          fill
          className="object-contain pixelated"
          unoptimized
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-bold text-white capitalize truncate">
            {pokemon.nickname || pokemon.species}
          </h4>
          <span className="text-sm text-gray-500">Nv. {pokemon.level}</span>
          {getStatusBadge(status)}
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          {/* Sale Method */}
          <span className={`flex items-center gap-1 
                        ${saleMethod === 'direct' ? 'text-green-400' : 'text-orange-400'}`}>
            {saleMethod === 'direct' ? (
              <ShoppingCart className="w-3 h-3" />
            ) : (
              <Gavel className="w-3 h-3" />
            )}
            {saleMethod === 'direct' ? 'Compra' : 'Subasta'}
          </span>

          {/* Pitufipuntos */}
          <span className="flex items-center gap-1 text-gray-400">
            <TrendingUp className="w-3 h-3" style={{ color: getPowerColor(
              typeof listing.pitufipuntos === 'object' && listing.pitufipuntos?.total 
                ? listing.pitufipuntos.total 
                : (typeof listing.pitufipuntos === 'number' ? listing.pitufipuntos : (listing.pokemon?.pitufipuntos || 0))
            ) }} />
            {(typeof listing.pitufipuntos === 'object' && listing.pitufipuntos?.total 
              ? listing.pitufipuntos.total 
              : (typeof listing.pitufipuntos === 'number' ? listing.pitufipuntos : (listing.pokemon?.pitufipuntos || 0))
            ).toLocaleString()} PP
          </span>

          {/* Views */}
          <span className="flex items-center gap-1 text-gray-500">
            <Eye className="w-3 h-3" />
            {viewCount}
          </span>

          {/* Bids (for auctions) */}
          {saleMethod === 'bidding' && (
            <span className="flex items-center gap-1 text-gray-500">
              <Gavel className="w-3 h-3" />
              {bidCount} pujas
            </span>
          )}

          {/* Time remaining (for active auctions) */}
          {status === 'active' && saleMethod === 'bidding' && timeRemaining > 0 && (
            <span className={`flex items-center gap-1 
                          ${timeRemaining < 3600000 ? 'text-red-400' : 'text-gray-400'}`}>
              <Clock className="w-3 h-3" />
              {formatTimeRemaining(timeRemaining)}
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="text-right">
        <p className="text-lg font-bold text-white">
          {formatPrice(displayPrice || 0)}
          <span className="text-sm font-normal text-purple-400 ml-1">CD</span>
        </p>
        {status === 'sold' && listing.buyerUsername && (
          <p className="text-xs text-gray-500">
            Comprado por {listing.buyerUsername}
          </p>
        )}
      </div>

      {/* Cancel Button */}
      {canCancel && (
        <button
          onClick={() => onCancel(listing._id)}
          disabled={cancelling}
          className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 
                   transition-colors disabled:opacity-50"
          title="Cancelar listing"
        >
          {cancelling ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Trash2 className="w-5 h-5" />
          )}
        </button>
      )}
    </motion.div>
  );
}
