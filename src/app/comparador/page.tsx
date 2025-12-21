'use client';

import { useState, useEffect } from 'react';
import { startersAPI } from '@/lib/api-client';

interface StarterData {
    pokemonId: number;
    name: string;
    nameEs: string;
    generation: number;
    types: string[];
    stats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
    abilities: any[];
    signatureMoves: any[];
    evolutions: any[];
    description: string;
    isClaimed: boolean;
    claimedBy: string | null;
}

const TIPOS: Record<string, string> = {
    Grass: 'Planta', Fire: 'Fuego', Water: 'Agua', Electric: 'Eléctrico',
    Ice: 'Hielo', Fighting: 'Lucha', Poison: 'Veneno', Ground: 'Tierra',
    Flying: 'Volador', Psychic: 'Psíquico', Bug: 'Bicho', Rock: 'Roca',
    Ghost: 'Fantasma', Dragon: 'Dragón', Dark: 'Siniestro', Steel: 'Acero', Fairy: 'Hada', Normal: 'Normal',
};

const TIPO_COLORES: Record<string, string> = {
    Grass: '#78C850', Fire: '#F08030', Water: '#6890F0', Electric: '#F8D030',
    Ice: '#98D8D8', Fighting: '#C03028', Poison: '#A040A0', Ground: '#E0C068',
    Flying: '#A890F0', Psychic: '#F85888', Bug: '#A8B820', Rock: '#B8A038',
    Ghost: '#705898', Dragon: '#7038F8', Dark: '#705848', Steel: '#B8B8D0', Fairy: '#EE99AC', Normal: '#A8A878',
};

const EFECTIVIDAD: Record<string, Record<string, number>> = {
    Fire: { Grass: 2, Ice: 2, Bug: 2, Steel: 2, Fire: 0.5, Water: 0.5, Rock: 0.5, Dragon: 0.5 },
    Water: { Fire: 2, Ground: 2, Rock: 2, Water: 0.5, Grass: 0.5, Dragon: 0.5 },
    Grass: { Water: 2, Ground: 2, Rock: 2, Fire: 0.5, Grass: 0.5, Poison: 0.5, Flying: 0.5, Bug: 0.5, Dragon: 0.5, Steel: 0.5 },
};

// Radar chart component
function RadarChart({ pokemon1, pokemon2, pokemon3 }: { pokemon1: StarterData; pokemon2?: StarterData | null; pokemon3?: StarterData | null }) {
    const stats = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
    const labels = ['PS', 'ATK', 'DEF', 'SP.A', 'SP.D', 'VEL'];
    const centerX = 150;
    const centerY = 150;
    const maxRadius = 120;

    const getPoint = (value: number, index: number, total: number = 6) => {
        const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
        const radius = (value / 150) * maxRadius;
        return {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
        };
    };

    const createPath = (pokemon: StarterData) => {
        return stats
            .map((stat, i) => {
                const point = getPoint(pokemon.stats[stat as keyof typeof pokemon.stats], i);
                return `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
            })
            .join(' ') + ' Z';
    };

    // Grid lines
    const gridLevels = [0.25, 0.5, 0.75, 1];

    return (
        <svg viewBox="0 0 300 300" className="w-full max-w-[300px] mx-auto">
            {/* Grid */}
            {gridLevels.map((level, i) => (
                <polygon
                    key={i}
                    points={stats.map((_, idx) => {
                        const p = getPoint(150 * level, idx);
                        return `${p.x},${p.y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                />
            ))}

            {/* Axis lines */}
            {stats.map((_, i) => {
                const p = getPoint(150, i);
                return (
                    <line
                        key={i}
                        x1={centerX}
                        y1={centerY}
                        x2={p.x}
                        y2={p.y}
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="1"
                    />
                );
            })}

            {/* Labels */}
            {labels.map((label, i) => {
                const p = getPoint(170, i);
                return (
                    <text
                        key={i}
                        x={p.x}
                        y={p.y}
                        fill="white"
                        fontSize="10"
                        textAnchor="middle"
                        dominantBaseline="middle"
                    >
                        {label}
                    </text>
                );
            })}

            {/* Pokemon 3 area */}
            {pokemon3 && (
                <path
                    d={createPath(pokemon3)}
                    fill={`${TIPO_COLORES[pokemon3.types[0]]}30`}
                    stroke={TIPO_COLORES[pokemon3.types[0]]}
                    strokeWidth="2"
                />
            )}

            {/* Pokemon 2 area */}
            {pokemon2 && (
                <path
                    d={createPath(pokemon2)}
                    fill={`${TIPO_COLORES[pokemon2.types[0]]}30`}
                    stroke={TIPO_COLORES[pokemon2.types[0]]}
                    strokeWidth="2"
                />
            )}

            {/* Pokemon 1 area */}
            <path
                d={createPath(pokemon1)}
                fill={`${TIPO_COLORES[pokemon1.types[0]]}30`}
                stroke={TIPO_COLORES[pokemon1.types[0]]}
                strokeWidth="2"
            />

            {/* Center dot */}
            <circle cx={centerX} cy={centerY} r="3" fill="white" />
        </svg>
    );
}

export default function ComparadorPage() {
    const [starters, setStarters] = useState<StarterData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<(StarterData | null)[]>([null, null, null]);
    const [activeSlot, setActiveSlot] = useState<number>(0);

    useEffect(() => {
        fetchStarters();
    }, []);

    const fetchStarters = async () => {
        try {
            const data = await startersAPI.getAll();
            if (data.starters) {
                setStarters(data.starters);
            }
        } catch (e) {
            console.error('Error:', e);
        } finally {
            setLoading(false);
        }
    };

    const selectPokemon = (pokemon: StarterData) => {
        const newSelected = [...selected];
        newSelected[activeSlot] = pokemon;
        setSelected(newSelected);

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
    };

    const getTypeAdvantage = (attacker: StarterData, defender: StarterData): string => {
        let multiplier = 1;
        for (const atkType of attacker.types) {
            for (const defType of defender.types) {
                if (EFECTIVIDAD[atkType]?.[defType]) {
                    multiplier *= EFECTIVIDAD[atkType][defType];
                }
            }
        }
        if (multiplier > 1) return '🔥 Ventaja';
        if (multiplier < 1) return '❄️ Desventaja';
        return '⚖️ Neutral';
    };

    const getTotalStats = (p: StarterData) => {
        return Object.values(p.stats).reduce((a, b) => a + b, 0);
    };

    const selectedPokemon = selected.filter(Boolean) as StarterData[];

    return (
        <div className="min-h-screen px-2 sm:px-4 py-4 sm:py-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-4 sm:mb-8">
                    <h1 className="pixel-font text-lg sm:text-2xl md:text-3xl text-white mb-2">
                        <i className="fas fa-balance-scale text-yellow-500 mr-2 sm:mr-3"></i>
                        COMPARADOR
                    </h1>
                    <p className="text-gray-400 text-xs sm:text-base">Compara hasta 3 Pokémon lado a lado</p>
                </div>

                {/* Selected Pokemon Slots */}
                <div className="glass-dark rounded-xl p-3 sm:p-6 mb-4 sm:mb-6">
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        {[0, 1, 2].map((index) => (
                            <div
                                key={index}
                                onClick={() => setActiveSlot(index)}
                                className={`relative p-2 sm:p-4 rounded-xl border-2 transition-all cursor-pointer min-h-[100px] sm:min-h-[150px] ${activeSlot === index
                                    ? 'border-yellow-500 bg-yellow-500/10'
                                    : selected[index]
                                        ? 'border-gray-600 bg-gray-800/50'
                                        : 'border-dashed border-gray-600 hover:border-gray-500'
                                    }`}
                                style={selected[index] ? { borderColor: TIPO_COLORES[selected[index]!.types[0]] } : {}}
                            >
                                {selected[index] ? (
                                    <div className="text-center">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); clearSlot(index); }}
                                            className="absolute top-1 right-1 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white text-xs"
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                        <img
                                            src={selected[index]!.pokemonId <= 649
                                                ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${selected[index]!.pokemonId}.gif`
                                                : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${selected[index]!.pokemonId}.png`}
                                            alt={selected[index]!.nameEs}
                                            className="w-12 h-12 sm:w-20 sm:h-20 mx-auto"
                                        />
                                        <p className="text-white font-bold text-xs sm:text-sm mt-1 truncate">{selected[index]!.nameEs}</p>
                                        <div className="flex justify-center gap-1 mt-1">
                                            {selected[index]!.types.map((t) => (
                                                <span
                                                    key={t}
                                                    className="text-[8px] sm:text-[10px] px-1 sm:px-2 py-0.5 rounded text-white"
                                                    style={{ backgroundColor: TIPO_COLORES[t] }}
                                                >
                                                    {TIPOS[t]}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                        <i className="fas fa-plus text-xl sm:text-2xl mb-1 sm:mb-2"></i>
                                        <span className="text-[10px] sm:text-xs">Slot {index + 1}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pokemon picker */}
                <div className="glass-dark rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                    <h3 className="text-white font-bold text-sm sm:text-base mb-3 flex items-center gap-2">
                        <i className="fas fa-hand-pointer text-blue-400"></i>
                        Selecciona un Pokémon para el Slot {activeSlot + 1}
                    </h3>

                    {loading ? (
                        <div className="text-center py-8">
                            <i className="fas fa-spinner fa-spin text-2xl text-white"></i>
                        </div>
                    ) : (
                        <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 gap-1 sm:gap-2">
                            {starters.map((s) => {
                                const isSelected = selected.some((sel) => sel?.pokemonId === s.pokemonId);
                                return (
                                    <button
                                        key={s.pokemonId}
                                        onClick={() => !isSelected && selectPokemon(s)}
                                        disabled={isSelected}
                                        className={`p-1 sm:p-2 rounded-lg border transition-all ${isSelected
                                            ? 'opacity-30 cursor-not-allowed border-gray-700'
                                            : 'border-gray-700 hover:border-white hover:bg-white/10'
                                            }`}
                                    >
                                        <img
                                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${s.pokemonId}.png`}
                                            alt={s.nameEs}
                                            className="w-8 h-8 sm:w-12 sm:h-12 mx-auto"
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Comparison Results */}
                {selectedPokemon.length >= 2 && (
                    <div className="space-y-4 sm:space-y-6">
                        {/* Radar Chart */}
                        <div className="glass-dark rounded-xl p-4 sm:p-6">
                            <h3 className="text-white font-bold text-sm sm:text-base mb-4 flex items-center gap-2">
                                <i className="fas fa-chart-pie text-purple-400"></i>
                                Gráfico de Estadísticas
                            </h3>
                            <div className="flex justify-center">
                                <RadarChart
                                    pokemon1={selectedPokemon[0]}
                                    pokemon2={selectedPokemon[1]}
                                    pokemon3={selectedPokemon[2]}
                                />
                            </div>
                            <div className="flex justify-center gap-4 mt-4 flex-wrap">
                                {selectedPokemon.map((p, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: TIPO_COLORES[p.types[0]] }}
                                        />
                                        <span className="text-white text-xs sm:text-sm">{p.nameEs}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Stats Comparison Table */}
                        <div className="glass-dark rounded-xl p-4 sm:p-6 overflow-x-auto">
                            <h3 className="text-white font-bold text-sm sm:text-base mb-4 flex items-center gap-2">
                                <i className="fas fa-table text-blue-400"></i>
                                Comparación de Stats
                            </h3>
                            <table className="w-full text-xs sm:text-sm">
                                <thead>
                                    <tr className="border-b border-gray-700">
                                        <th className="text-left text-gray-400 py-2 pr-2">Stat</th>
                                        {selectedPokemon.map((p, i) => (
                                            <th key={i} className="text-center py-2 px-1 sm:px-2" style={{ color: TIPO_COLORES[p.types[0]] }}>
                                                {p.nameEs}
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
                                            <tr key={stat.key} className="border-b border-gray-800">
                                                <td className="py-2 pr-2 text-gray-400">
                                                    <i className={`fas fa-${stat.icon} mr-1 sm:mr-2`}></i>
                                                    <span className="hidden sm:inline">{stat.label}</span>
                                                    <span className="sm:hidden">{stat.label.slice(0, 3)}</span>
                                                </td>
                                                {selectedPokemon.map((p, i) => {
                                                    const val = p.stats[stat.key as keyof typeof p.stats];
                                                    const isMax = val === max && values.filter((v) => v === max).length === 1;
                                                    return (
                                                        <td key={i} className={`text-center py-2 font-mono ${isMax ? 'text-green-400 font-bold' : 'text-white'}`}>
                                                            {val}
                                                            {isMax && <i className="fas fa-crown text-yellow-500 ml-1 text-[10px]"></i>}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                    <tr className="bg-gray-800/50">
                                        <td className="py-2 pr-2 text-white font-bold">Total</td>
                                        {selectedPokemon.map((p, i) => {
                                            const total = getTotalStats(p);
                                            const maxTotal = Math.max(...selectedPokemon.map(getTotalStats));
                                            const isMax = total === maxTotal;
                                            return (
                                                <td key={i} className={`text-center py-2 font-mono font-bold ${isMax ? 'text-green-400' : 'text-white'}`}>
                                                    {total}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Type Matchups */}
                        <div className="glass-dark rounded-xl p-4 sm:p-6">
                            <h3 className="text-white font-bold text-sm sm:text-base mb-4 flex items-center gap-2">
                                <i className="fas fa-chess text-red-400"></i>
                                Matchups de Tipo
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {selectedPokemon.map((attacker, i) =>
                                    selectedPokemon
                                        .filter((_, j) => j !== i)
                                        .map((defender) => (
                                            <div
                                                key={`${attacker.pokemonId}-${defender.pokemonId}`}
                                                className="flex items-center justify-between p-2 sm:p-3 bg-gray-800/50 rounded-lg"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${attacker.pokemonId}.png`}
                                                        className="w-8 h-8 sm:w-10 sm:h-10"
                                                        alt=""
                                                    />
                                                    <span className="text-gray-400 text-xs">vs</span>
                                                    <img
                                                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${defender.pokemonId}.png`}
                                                        className="w-8 h-8 sm:w-10 sm:h-10"
                                                        alt=""
                                                    />
                                                </div>
                                                <span className="text-xs sm:text-sm font-medium">
                                                    {getTypeAdvantage(attacker, defender)}
                                                </span>
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>

                        {/* Winner prediction */}
                        <div className="glass-dark rounded-xl p-4 sm:p-6 text-center">
                            <h3 className="text-white font-bold text-sm sm:text-base mb-4 flex items-center justify-center gap-2">
                                <i className="fas fa-trophy text-yellow-400"></i>
                                Predicción Basada en Stats
                            </h3>
                            {(() => {
                                const sorted = [...selectedPokemon].sort((a, b) => getTotalStats(b) - getTotalStats(a));
                                const winner = sorted[0];
                                return (
                                    <div className="flex flex-col items-center">
                                        <img
                                            src={winner.pokemonId <= 649
                                                ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${winner.pokemonId}.gif`
                                                : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${winner.pokemonId}.png`}
                                            className="w-20 h-20 sm:w-24 sm:h-24 mb-2"
                                            alt=""
                                        />
                                        <p className="text-yellow-400 font-bold text-lg sm:text-xl pixel-font">{winner.nameEs}</p>
                                        <p className="text-gray-400 text-xs sm:text-sm mt-1">
                                            Con {getTotalStats(winner)} puntos totales de stats
                                        </p>
                                        <p className="text-gray-500 text-[10px] sm:text-xs mt-2">
                                            *Basado solo en stats base, no considera tipos ni movimientos
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {selectedPokemon.length < 2 && (
                    <div className="glass-dark rounded-xl p-8 sm:p-12 text-center">
                        <i className="fas fa-balance-scale text-4xl sm:text-5xl text-gray-600 mb-4"></i>
                        <h3 className="text-white font-bold text-base sm:text-lg mb-2">Selecciona al menos 2 Pokémon</h3>
                        <p className="text-gray-400 text-xs sm:text-sm">
                            Haz clic en los slots de arriba y luego selecciona un Pokémon de la lista
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
