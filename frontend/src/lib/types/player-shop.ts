/**
 * Player Shop Types
 * Cobblemon Los Pitufos - Frontend
 */

import { PokemonStats, PokemonMove } from './pokemon';

// ============================================
// PITUFIPUNTOS TYPES
// ============================================

export interface PitufipuntosBreakdown {
  baseStatTotal: number;
  ivBonus: number;
  evBonus: number;
  levelBonus: number;
  natureBonus: number;
  abilityBonus: number;
  shinyBonus: number;
  typeBonus: number;
}

export interface PitufipuntosResult {
  total: number;
  breakdown: PitufipuntosBreakdown;
}

// ============================================
// LISTING TYPES
// ============================================

export type SaleMethod = 'direct' | 'bidding';
export type ListingStatus = 'active' | 'sold' | 'cancelled' | 'expired';

export interface ListingPokemon {
  uuid: string;
  species: string;
  speciesId: number;
  nickname?: string;
  level: number;
  shiny: boolean;
  gender: 'male' | 'female' | 'genderless';
  nature: string;
  ability: string;
  ivs: PokemonStats;
  evs: PokemonStats;
  moves: PokemonMove[];
  ball: string;
  form?: string;
  originalTrainer?: string;
  pitufipuntos?: number;
}

export interface Listing {
  _id: string;
  sellerId: string;
  sellerUsername: string;
  pokemon: ListingPokemon;
  pitufipuntos: PitufipuntosResult;
  saleMethod: SaleMethod;
  price?: number;
  startingBid?: number;
  currentBid?: number;
  currentBidderId?: string;
  currentBidderUsername?: string;
  bidCount: number;
  duration?: number;
  expiresAt?: string;
  createdAt: string;
  status: ListingStatus;
  soldAt?: string;
  buyerId?: string;
  buyerUsername?: string;
  finalPrice?: number;
  viewCount: number;
  timeRemaining?: number;
  sellerOnline?: boolean;
}

export interface ListingFilters {
  species?: string;
  speciesId?: number;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  shinyOnly?: boolean;
  saleMethod?: SaleMethod;
  sortBy?: 'pitufipuntos' | 'price' | 'createdAt' | 'expiresAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedListings {
  listings: Listing[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

// ============================================
// BID TYPES
// ============================================

export type BidStatus = 'active' | 'outbid' | 'won' | 'refunded';

export interface Bid {
  _id: string;
  listingId: string;
  bidderId: string;
  bidderUsername: string;
  amount: number;
  createdAt: string;
  status: BidStatus;
}

export interface BidResult {
  success: boolean;
  bid?: Bid;
  newBalance?: number;
  message: string;
  previousBidder?: {
    uuid: string;
    username: string;
    refundedAmount: number;
  };
}

// ============================================
// PURCHASE TYPES
// ============================================

export interface PurchaseResult {
  success: boolean;
  listing?: Listing;
  newBuyerBalance?: number;
  newSellerBalance?: number;
  deliveryId?: string;
  message: string;
}

// ============================================
// CREATE LISTING TYPES
// ============================================

export interface CreateListingData {
  pokemonUuid: string;
  saleMethod: SaleMethod;
  sellerUuid?: string;
  price?: number;
  startingBid?: number;
  duration?: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getPowerTier(total: number): string {
  if (total >= 1500) return 'Legendario';
  if (total >= 1200) return 'Élite';
  if (total >= 900) return 'Experto';
  if (total >= 600) return 'Avanzado';
  if (total >= 400) return 'Intermedio';
  return 'Principiante';
}

export function getPowerColor(total: number): string {
  if (total >= 1500) return '#FFD700'; // Gold
  if (total >= 1200) return '#9B59B6'; // Purple
  if (total >= 900) return '#E74C3C';  // Red
  if (total >= 600) return '#3498DB';  // Blue
  if (total >= 400) return '#2ECC71';  // Green
  return '#95A5A6'; // Gray
}

export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Finalizado';
  
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  return `${minutes}m`;
}

export function formatPrice(price: number): string {
  return price.toLocaleString('es-ES');
}

export function getIVColor(iv: number): string {
  if (iv === 31) return '#22c55e'; // Green - Perfect
  if (iv >= 25) return '#eab308'; // Yellow - Great
  if (iv >= 15) return '#f97316'; // Orange - Good
  return '#ef4444'; // Red - Low
}

export function getIVLabel(iv: number): string {
  if (iv === 31) return 'Perfecto';
  if (iv >= 25) return 'Excelente';
  if (iv >= 15) return 'Bueno';
  return 'Bajo';
}
