'use client';

import { useState, useEffect } from 'react';
import { startersAPI } from '@/src/lib/api-client';
import { Starter } from '@/src/lib/types/pokemon';
import { playSound } from '@/src/lib/sounds';

const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
  grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
  ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
  rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
  steel: '#B8B8D0', fairy: '#EE99AC',
};

export default function ComparadorPage() {
  const [starters, setStarters] = useState<Starter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<(Starter | null)[]>([null, null]);
  const [activeSlot, setActiveSlot] = useState<number>(0);

  useEffect(() => {
    fetchStarters();
  }, []);

  const fetchStarters = async () => {
    try {
      const data = await startersAPI.getAll();
      setStarters(data.starters || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectPokemon = (pokemon: Starter) => {
    const newSelected = [...selected];
    newSelected[activeSlot] = pokemon;
    setSelected(newSelected);
    playSound('confirm');

    // Move to next empty slot
    const nextEmpty = newSelected.findIndex((s, i) => i > activeSlot && s === null);
    if (nextEmpty !== -1) {
      setActiveSlot(nextEmpty);
    }
  };

  const clearSlot = (index: number) => {
    const newSelected = [...selected];
    newSelected[index] = null;
    setSelected(newSelected);
    setActiveSlot(index);
    playSound('cancel');
  };

  const getTotalStats = (p: Starter) => {
    return Object.values(p.stats).reduce((a, b) => a + b, 0);
  };

  const selectedPokemon = selected.filter(Boolean) as Starter[];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-poke-yellow border-t-transparent mb-4"></div>
          <p className="text-xl">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 pixel-font text-poke-yellow">
            <i className="fas fa-balance-scale mr-3"></i>
            COMPARADOR
          </h1>
          <p className="text-xl text-slate-300">
            Compara dos Pokémon lado a lado
          </p>
        </div>

        {/* Selected Pokemon Slots */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="card">
            <div className="grid grid-cols-2 gap-4">
              {[0, 1].map((index) => (
                <div
                  key={index}
                  onClick={() => setActiveSlot(index)}
                  className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer min-h-[200px] ${activeSlot === index
                    ? 'border-poke-yellow bg-poke-yellow/10'
                    : selected[index]
                      ? 'border-slate-600 bg-slate-800/50'
                      : 'border-dashed border-slate-600 hover:border-slate-500'
                    }`}
                  style={selected[index] ? { borderColor: TYPE_COLORS[selected[index]!.types[0].toLowerCase()] } : {}}
                >
                  {selected[index] ? (
                    <div className="text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); clearSlot(index); }}
                        className="absolute top-2 right-2 w-8 h-8 bg-poke-red hover:bg-red-700 rounded-full flex items-center justify-center text-white"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                      <img
                        src={selected[index]!.sprites.spriteAnimated || selected[index]!.sprites.sprite}
                        alt={selected[index]!.name}
                        className="w-24 h-24 mx-auto mb-2"
                      />
                      <p className="text-white font-bold text-lg mb-2">
                        {selected[index]!.nameEs || selected[index]!.name}
                      </p>
                      <div className="flex justify-center gap-2">
                        {selected[index]!.types.map((t) => (
                          <span
                            key={t}
                            className="px-3 py-1 rounded text-xs text-white font-bold"
                            style={{ backgroundColor: TYPE_COLORS[t.toLowerCase()] }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                      <i className="fas fa-plus text-4xl mb-2"></i>
                      <span>Slot {index + 1}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pokemon Picker */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="card">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <i className="fas fa-hand-pointer text-poke-blue"></i>
              Selecciona un Pokémon para el Slot {activeSlot + 1}
            </h3>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
              {starters.map((s) => {
                const isSelected = selected.some((sel) => sel?.pokemonId === s.pokemonId);
                return (
                  <button
                    key={s.pokemonId}
                    onClick={() => !isSelected && selectPokemon(s)}
                    disabled={isSelected}
                    className={`p-2 rounded-lg border transition-all ${isSelected
                      ? 'opacity-30 cursor-not-allowed border-slate-700'
                      : 'border-slate-700 hover:border-white hover:bg-white/10'
                      }`}
                  >
                    <img
                      src={s.sprites.sprite}
                      alt={s.name}
                      className="w-full h-auto"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Comparison Results */}
        {selectedPokemon.length === 2 && (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Stats Comparison */}
            <div className="card">
              <h3 className="text-white font-bold text-xl mb-6 flex items-center gap-2">
                <i className="fas fa-chart-bar text-poke-blue"></i>
                Comparación de Stats
              </h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-slate-400 py-3">Stat</th>
                    {selectedPokemon.map((p, i) => (
                      <th key={i} className="text-center py-3" style={{ color: TYPE_COLORS[p.types[0].toLowerCase()] }}>
                        {p.nameEs || p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'hp', label: 'PS', icon: 'heart' },
                    { key: 'atk', label: 'Ataque', icon: 'fist-raised' },
                    { key: 'def', label: 'Defensa', icon: 'shield-alt' },
                    { key: 'spa', label: 'At. Esp.', icon: 'magic' },
                    { key: 'spd', label: 'Def. Esp.', icon: 'shield' },
                    { key: 'spe', label: 'Velocidad', icon: 'bolt' },
                  ].map((stat) => {
                    const values = selectedPokemon.map((p) => p.stats[stat.key as keyof typeof p.stats]);
                    const max = Math.max(...values);
                    return (
                      <tr key={stat.key} className="border-b border-slate-800">
                        <td className="py-3 text-slate-400">
                          <i className={`fas fa-${stat.icon} mr-2`}></i>
                          {stat.label}
                        </td>
                        {selectedPokemon.map((p, i) => {
                          const val = p.stats[stat.key as keyof typeof p.stats];
                          const isMax = val === max && values.filter((v) => v === max).length === 1;
                          return (
                            <td key={i} className={`text-center py-3 font-mono ${isMax ? 'text-poke-green font-bold' : 'text-white'}`}>
                              {val}
                              {isMax && <i className="fas fa-crown text-poke-yellow ml-2 text-sm"></i>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-800/50">
                    <td className="py-3 text-white font-bold">Total</td>
                    {selectedPokemon.map((p, i) => {
                      const total = getTotalStats(p);
                      const maxTotal = Math.max(...selectedPokemon.map(getTotalStats));
                      const isMax = total === maxTotal;
                      return (
                        <td key={i} className={`text-center py-3 font-mono font-bold ${isMax ? 'text-poke-green' : 'text-white'}`}>
                          {total}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Winner */}
            <div className="card text-center">
              <h3 className="text-white font-bold text-xl mb-6 flex items-center justify-center gap-2">
                <i className="fas fa-trophy text-poke-yellow"></i>
                Predicción Basada en Stats
              </h3>
              {(() => {
                const sorted = [...selectedPokemon].sort((a, b) => getTotalStats(b) - getTotalStats(a));
                const winner = sorted[0];
                return (
                  <div className="flex flex-col items-center">
                    <img
                      src={winner.sprites.spriteAnimated || winner.sprites.sprite}
                      className="w-32 h-32 mb-4"
                      alt=""
                    />
                    <p className="text-poke-yellow font-bold text-2xl pixel-font mb-2">
                      {winner.nameEs || winner.name}
                    </p>
                    <p className="text-slate-400">
                      Con {getTotalStats(winner)} puntos totales de stats
                    </p>
                    <p className="text-slate-500 text-sm mt-4">
                      *Basado solo en stats base, no considera tipos ni movimientos
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Empty State */}
        {selectedPokemon.length < 2 && (
          <div className="card text-center py-16 max-w-2xl mx-auto">
            <i className="fas fa-balance-scale text-6xl text-slate-600 mb-4"></i>
            <h3 className="text-white font-bold text-xl mb-2">Selecciona 2 Pokémon</h3>
            <p className="text-slate-400">
              Haz clic en los slots de arriba y luego selecciona un Pokémon de la lista
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
