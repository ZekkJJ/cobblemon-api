'use client';

import { useState, useMemo, useEffect } from 'react';
import { POKEDEX_DATA, PokedexPokemon } from '@/src/lib/pokedex-data';
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
  const [selectedPokemon, setSelectedPokemon] = useState<PokedexPokemon | null>(null);
  const [filterGen, setFilterGen] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(40);

  const filteredPokemon = useMemo(() => {
    return POKEDEX_DATA.filter((p) => {
      const name = p.name || '';
      const nameEs = p.nameEs || '';
      const types = p.types || [];
      const pokemonId = String(p.pokemonId || '');

      if (filterGen && p.generation !== filterGen) return false;

      const typeMatch = !filterType || types.some(t => t.toLowerCase() === filterType.toLowerCase());
      if (!typeMatch) return false;

      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const matches = name.toLowerCase().includes(lowerSearch) ||
          nameEs.toLowerCase().includes(lowerSearch) ||
          pokemonId.includes(lowerSearch);
        if (!matches) return false;
      }

      return true;
    });
  }, [filterGen, filterType, searchTerm]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(40);
  }, [filterGen, filterType, searchTerm]);

  const visiblePokemon = useMemo(() => {
    return filteredPokemon.slice(0, visibleCount);
  }, [filteredPokemon, visibleCount]);

  const stats = useMemo(() => {
    return {
      total: POKEDEX_DATA.length,
      gen1: POKEDEX_DATA.filter(p => p.generation === 1).length,
      gen2: POKEDEX_DATA.filter(p => p.generation === 2).length,
      gen3: POKEDEX_DATA.filter(p => p.generation === 3).length,
      gen4: POKEDEX_DATA.filter(p => p.generation === 4).length,
      gen5: POKEDEX_DATA.filter(p => p.generation === 5).length,
    };
  }, []); // Only compute once since POKEDEX_DATA is constant

  // Get unique types from all pokemon
  const allTypes = useMemo(() => {
    const types = new Set<string>();
    try {
      POKEDEX_DATA.forEach(p => {
        if (p && p.types && Array.isArray(p.types)) {
          p.types.forEach(t => {
            if (t) types.add(t);
          });
        }
      });
    } catch (e) {
      console.error('Error calculating types:', e);
    }
    return Array.from(types).sort();
  }, []);

  // Clear all filters
  const clearFilters = () => {
    setFilterGen(null);
    setFilterType(null);
    setSearchTerm('');
    setVisibleCount(40);
    playSound('cancel');
  };

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
            {stats.total} Líneas evolutivas de las generaciones 1-5
          </p>
        </div>

        {/* Stats */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                Pokédex Nacional
              </h1>

              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white/70 hover:text-white transition-all flex items-center gap-2 w-fit"
              >
                Reiniciar Filtros
              </button>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{stats.total}</div>
                <div className="text-xs text-slate-400">Total</div>
              </div>
              {[1, 2, 3, 4, 5].map(gen => (
                <div key={gen} className="text-center">
                  <div className={`text-3xl font-bold mb-1 ${gen === 1 ? 'text-poke-green' :
                    gen === 2 ? 'text-poke-blue' :
                      gen === 3 ? 'text-poke-red' :
                        gen === 4 ? 'text-poke-yellow' : 'text-purple-400'
                    }`}>{stats[`gen${gen}` as keyof typeof stats]}</div>
                  <div className="text-xs text-slate-400">Gen {gen}</div>
                </div>
              ))}
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
                placeholder="Buscar por nombre o número..."
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
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${!filterGen ? 'bg-poke-red text-white' : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                >
                  Todas
                </button>
                {[1, 2, 3, 4, 5].map((gen) => {
                  const genCount = stats[(`gen${gen}` as keyof typeof stats)] || 0;
                  return (
                    <button
                      key={gen}
                      onClick={() => { setFilterGen(gen === filterGen ? null : gen); playSound('click'); }}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${filterGen === gen
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:border-white/20'
                        }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider">Gen {gen}</span>
                      <span className="text-lg font-bold">{genCount}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Type Filter */}
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">Tipo:</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setFilterType(null); playSound('click'); }}
                  className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${!filterType ? 'bg-poke-red text-white' : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                >
                  Todos
                </button>
                {allTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => { setFilterType(type === filterType ? null : type); playSound('click'); }}
                    className={`px-3 py-1.5 rounded-lg font-bold text-white text-sm transition-all ${filterType === type ? 'ring-2 ring-white scale-105' : 'opacity-70 hover:opacity-100'
                      }`}
                    style={{ backgroundColor: TYPE_COLORS[type.toLowerCase()] || '#888' }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-slate-400 text-sm">
              Mostrando {Math.min(visibleCount, filteredPokemon.length)} de {filteredPokemon.length} filtrados ({stats.total} total)
            </div>
          </div>
        </div>

        {/* Grid */}
        {filteredPokemon.length === 0 ? (
          <div className="card text-center py-16">
            <i className="fas fa-search text-6xl text-slate-600 mb-4"></i>
            <p className="text-slate-400 text-xl">No se encontraron Pokémon</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
              {visiblePokemon.map((pokemon) => (
                <div
                  key={pokemon.pokemonId}
                  onClick={() => {
                    setSelectedPokemon(pokemon);
                    playSound('click');
                    if (pokemon.sprites.cry) {
                      playPokemonCry(pokemon.sprites.cry);
                    }
                  }}
                  className="card cursor-pointer hover:scale-105 transition-all relative p-2"
                >
                  {/* Number */}
                  <div className="absolute top-1 left-1 text-[10px] text-slate-500 font-mono">
                    #{String(pokemon.pokemonId).padStart(3, '0')}
                  </div>

                  {/* Sprite */}
                  <div className="flex justify-center mb-1">
                    <img
                      src={pokemon.sprites.spriteAnimated || pokemon.sprites.sprite}
                      alt={pokemon.name}
                      className="w-14 h-14 object-contain"
                      loading="lazy"
                    />
                  </div>

                  {/* Name */}
                  <div className="text-center text-[10px] font-medium truncate">
                    {pokemon.nameEs || pokemon.name}
                  </div>

                  {/* Types */}
                  <div className="flex justify-center gap-0.5 mt-1">
                    {pokemon.types.slice(0, 2).map((type) => (
                      <div
                        key={type}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: TYPE_COLORS[type.toLowerCase()] || '#888' }}
                        title={type}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            {visibleCount < filteredPokemon.length && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setVisibleCount(prev => prev + 40)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-xl transition-all border border-slate-700 hover:border-poke-red"
                >
                  Cargar Más Pokémon...
                </button>
              </div>
            )}
          </>
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
              className="max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card relative">
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

                {/* Pokemon Info */}
                <div className="text-center mb-4">
                  <div className="text-slate-500 font-mono text-sm mb-1">
                    #{String(selectedPokemon.pokemonId).padStart(3, '0')}
                  </div>
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedPokemon.nameEs || selectedPokemon.name}
                  </h2>
                  <div className="flex justify-center gap-2 mb-4">
                    {selectedPokemon.types.map((type) => (
                      <span
                        key={type}
                        className="px-3 py-1 rounded-full text-white text-sm font-bold"
                        style={{ backgroundColor: TYPE_COLORS[type.toLowerCase()] || '#888' }}
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Artwork */}
                <div className="flex justify-center mb-4">
                  <img
                    src={selectedPokemon.sprites?.artwork}
                    alt={selectedPokemon.name}
                    className="w-48 h-48 object-contain"
                  />
                </div>

                {/* Description */}
                <p className="text-slate-300 text-center mb-4 italic">
                  &ldquo;{selectedPokemon.description}&rdquo;
                </p>

                {/* Physical Info */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <div className="text-slate-400 text-sm">Altura</div>
                    <div className="text-lg font-bold">{selectedPokemon.height} m</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <div className="text-slate-400 text-sm">Peso</div>
                    <div className="text-lg font-bold">{selectedPokemon.weight} kg</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-slate-800 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-bold mb-3">Estadísticas Base</h3>
                  <div className="space-y-2">
                    {[
                      { label: 'HP', value: (selectedPokemon.stats as any).hp, color: '#FF5959' },
                      { label: 'Ataque', value: (selectedPokemon.stats as any).atk, color: '#F5AC78' },
                      { label: 'Defensa', value: (selectedPokemon.stats as any).def, color: '#FAE078' },
                      { label: 'Sp. Atk', value: (selectedPokemon.stats as any).spa, color: '#9DB7F5' },
                      { label: 'Sp. Def', value: (selectedPokemon.stats as any).spd, color: '#A7DB8D' },
                      { label: 'Velocidad', value: (selectedPokemon.stats as any).spe, color: '#FA92B2' },
                    ].map((stat) => (
                      <div key={stat.label} className="flex items-center gap-2">
                        <div className="w-20 text-sm text-slate-400">{stat.label}</div>
                        <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, ((stat.value || 0) / 255) * 100)}%`,
                              backgroundColor: stat.color,
                            }}
                          />
                        </div>
                        <div className="w-10 text-right text-sm font-bold">{stat.value || 0}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between">
                    <span className="text-slate-400">Total</span>
                    <span className="font-bold">
                      {Object.values(selectedPokemon.stats as object).reduce((a: any, b: any) => (a as number) + (b as number), 0) as number}
                    </span>
                  </div>
                </div>

                {/* Evolutions */}
                {selectedPokemon.evos && selectedPokemon.evos.length > 0 && (
                  <div className="bg-slate-800 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-bold mb-3">Evoluciones</h3>
                    <div className="flex flex-col gap-3">
                      {selectedPokemon.evos.map((evo: any, idx: number) => (
                        <div key={evo.name + idx} className="flex items-center gap-4 bg-slate-700/50 p-2 rounded-lg">
                          <div className="w-12 h-12 bg-slate-900 rounded-lg p-1">
                            {/* Note: In this version of the app, sprite URLs follow this pattern */}
                            <img
                              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evo.id || ''}.png`}
                              alt={evo.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold">{evo.nameEs || evo.name}</div>
                            <div className="text-xs text-slate-400">{evo.method}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Play Cry Button */}
                <button
                  onClick={() => {
                    if (selectedPokemon.sprites?.cry) {
                      playPokemonCry(selectedPokemon.sprites.cry);
                    }
                  }}
                  className="w-full bg-poke-blue hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  <i className="fas fa-volume-up mr-2"></i>
                  Escuchar Grito
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
