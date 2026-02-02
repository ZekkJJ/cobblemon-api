'use client';

/**
 * Listing Filters Panel
 * Cobblemon Los Pitufos
 * 
 * Panel de filtros para el marketplace.
 */

import { useState } from 'react';
import {
  Sparkles,
  ShoppingCart,
  Gavel,
  X,
  RotateCcw
} from 'lucide-react';
import { ListingFilters, SaleMethod } from '@/lib/types/player-shop';

// Pokemon types for filter
const POKEMON_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];

const TYPE_COLORS: Record<string, string> = {
  Normal: '#A8A878',
  Fire: '#F08030',
  Water: '#6890F0',
  Electric: '#F8D030',
  Grass: '#78C850',
  Ice: '#98D8D8',
  Fighting: '#C03028',
  Poison: '#A040A0',
  Ground: '#E0C068',
  Flying: '#A890F0',
  Psychic: '#F85888',
  Bug: '#A8B820',
  Rock: '#B8A038',
  Ghost: '#705898',
  Dragon: '#7038F8',
  Dark: '#705848',
  Steel: '#B8B8D0',
  Fairy: '#EE99AC',
};

interface ListingFiltersPanelProps {
  filters: ListingFilters;
  onChange: (filters: Partial<ListingFilters>) => void;
  onClear: () => void;
}

export function ListingFiltersPanel({ filters, onChange, onClear }: ListingFiltersPanelProps) {
  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice?.toString() || '');

  const handlePriceChange = () => {
    onChange({
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Sale Method */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Sale Method
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => onChange({ saleMethod: undefined })}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${!filters.saleMethod
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-gray-400 hover:text-white'}`}
            >
              All
            </button>
            <button
              onClick={() => onChange({ saleMethod: 'direct' })}
              className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg 
                        text-sm font-medium transition-colors
                        ${filters.saleMethod === 'direct'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-gray-400 hover:text-white'}`}
            >
              <ShoppingCart className="w-4 h-4" />
              Buy
            </button>
            <button
              onClick={() => onChange({ saleMethod: 'bidding' })}
              className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg 
                        text-sm font-medium transition-colors
                        ${filters.saleMethod === 'bidding'
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-700 text-gray-400 hover:text-white'}`}
            >
              <Gavel className="w-4 h-4" />
              Auction
            </button>
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Price Range (CobbleDollars)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              onBlur={handlePriceChange}
              placeholder="Min"
              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg
                       text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              onBlur={handlePriceChange}
              placeholder="Max"
              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg
                       text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Shiny Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Special
          </label>
          <button
            onClick={() => onChange({ shinyOnly: !filters.shinyOnly })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                      ${filters.shinyOnly
                ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
                : 'bg-slate-700 border border-slate-600 text-gray-400 hover:text-white'}`}
          >
            <Sparkles className="w-4 h-4" />
            Shiny Only
          </button>
        </div>

        {/* Clear Filters */}
        <div className="flex items-end">
          <button
            onClick={onClear}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 border border-slate-600 
                     rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Type Filter */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Filter by Type
        </label>
        <div className="flex flex-wrap gap-2">
          {POKEMON_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => onChange({ type: filters.type === type ? undefined : type })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                        ${filters.type === type
                  ? 'ring-2 ring-white/50 scale-105'
                  : 'opacity-70 hover:opacity-100'}`}
              style={{
                backgroundColor: `${TYPE_COLORS[type]}30`,
                color: TYPE_COLORS[type],
                borderColor: TYPE_COLORS[type],
                borderWidth: '1px',
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
