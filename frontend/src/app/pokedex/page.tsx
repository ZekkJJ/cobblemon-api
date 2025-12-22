'use client';

import { useState, useEffect } from 'react';
import { startersAPI } from '@/src/lib/api-client';
import { Starter } from '@/src/lib/types/pokemon';
import StarterCard from '@/src/components/StarterCard';
import { playSound, playPokemonCry } from '@/src/lib/sounds';

const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
};

export default function PokedexPage() {
  const [starters, setStarters] = useState<Starter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPokemon, setSelectedPokemon] = useState<Starter | null>(null);
  const [filterGen, setFilterGen] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStarters();
  }, []);

  const fetchStarters = async () => {
    try {
      console.log('[POKEDEX] Fetching starters...');
      const data = await startersAPI.getAll();
      console.log('[POKEDEX] Received data:', data);
      console.log('[POKEDEX] Starters count:', data.starters?.length || 0);
      setStarters(data.starters || []);
    } catch (err) {
      console.error('[POKEDEX] Error fetching starters:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStarters = starters.filter((s) => {
    if (filterGen && s.generation !== filterGen) return false;
    if (filterType && s.types && !s.types.includes(filterType)) return false;
    if (showOnlyAvailable && s.isClaimed) return false;
    if (searchTerm && !s.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !(s.nameEs && s.nameEs.toLowerCase().includes(searchTerm.toLowerCase()))) return false;
    return true;
  });

  const stats = {
    total: starters.length,
    available: starters.filter(s => !s.isClaimed).length,
    claimed: starters.filter(s => s.isClaimed).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-poke-red border-t-transparent mb-4"></div>
          <p className="text-xl">Cargando Pokédex...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 pixel-font text-poke-red">
            <i className="fas fa-book mr-3"></i>
            POKÉDEX
          </h1>
          <p className="text-xl text-slate-300">
            Información de Pokémon iniciales disponibles
          </p>
        </div>

        {/* Stats */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="card">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{stats.total}</div>
                <div className="text-slate-400">Total</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-poke-green mb-2">{stats.available}</div>
                <div className="text-slate-400">Disponibles</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-poke-red mb-2">{stats.claimed}</div>
                <div className="text-slate-400">Reclamados</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="card">
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar Pokémon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-poke-red focus:outline-none"
              />
            </div>

            {/* Generation Filter */}
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">Generación:</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setFilterGen(null); playSound('click'); }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    !filterGen ? 'bg-poke-red text-white' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  Todas
                </button>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((gen) => (
                  <button
                    key={gen}
                    onClick={() => { setFilterGen(gen === filterGen ? null : gen); playSound('click'); }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filterGen === gen ? 'bg-poke-red text-white' : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    Gen {gen}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">Tipo:</label>
              <div className="flex flex-wrap gap-2">
                {['Grass', 'Fire', 'Water', 'Electric', 'Psychic', 'Dragon'].map((type) => (
                  <button
                    key={type}
                    onClick={() => { setFilterType(type === filterType ? null : type); playSound('click'); }}
                    className={`px-4 py-2 rounded-lg font-bold text-white transition-all ${
                      filterType === type ? 'ring-2 ring-white scale-105' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: TYPE_COLORS[type.toLowerCase()] }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Available Only */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyAvailable}
                onChange={(e) => { setShowOnlyAvailable(e.target.checked); playSound('click'); }}
                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-poke-green"
              />
              <span className="text-slate-300">Solo mostrar disponibles</span>
            </label>
          </div>
        </div>

        {/* Grid */}
        {filteredStarters.length === 0 ? (
          <div className="card text-center py-16">
            <i className="fas fa-search text-6xl text-slate-600 mb-4"></i>
            <p className="text-slate-400 text-xl">No se encontraron Pokémon</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {filteredStarters.map((starter) => {
              // Safety check for sprites
              if (!starter.sprites) {
                console.warn('Starter missing sprites:', starter);
                return null;
              }
              
              return (
              <div
                key={starter.pokemonId}
                onClick={() => {
                  setSelectedPokemon(starter);
                  playSound('click');
                  if (starter.sprites.cry) {
                    playPokemonCry(starter.sprites.cry);
                  }
                }}
                className={`card cursor-pointer hover:scale-105 transition-all relative ${
                  starter.isClaimed ? 'opacity-60' : ''
                }`}
              >
                {/* Sprite */}
                <div className="flex justify-center mb-2">
                  <img
                    src={starter.sprites.spriteAnimated || starter.sprites.sprite}
                    alt={starter.name}
                    className="w-16 h-16 object-contain"
                    loading="lazy"
                  />
                </div>

                {/* Name */}
                <div className="text-center text-xs font-medium truncate">
                  {starter.nameEs || starter.name}
                </div>

                {/* Claimed Badge */}
                {starter.isClaimed && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
                    <span className="bg-poke-red text-white text-[10px] px-2 py-1 rounded font-bold">
                      RECLAMADO
                    </span>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}

        {/* Detail Modal */}
        {selectedPokemon && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setSelectedPokemon(null);
              playSound('cancel');
            }}
          >
            <div
              className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                {/* Close Button */}
                <button
                  onClick={() => {
                    setSelectedPokemon(null);
                    playSound('cancel');
                  }}
                  className="absolute top-4 right-4 z-10 w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>

                {/* Starter Card */}
                <StarterCard
                  starter={selectedPokemon}
                  isShiny={selectedPokemon.isShiny || false}
                  size="full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
