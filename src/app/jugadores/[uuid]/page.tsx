'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { playSound } from '@/lib/sounds';
import { PlayerProfile, CobblemonPokemon, PokemonStats, NATURE_MODIFIERS } from '@/lib/types/pokemon';

// Pokemon detail modal component
function PokemonModal({ pokemon, onClose }: { pokemon: CobblemonPokemon; onClose: () => void }) {
    const maxStat = 255; // For EV display
    const maxIV = 31;

    const getStatColor = (value: number, max: number) => {
        const percent = (value / max) * 100;
        if (percent >= 90) return 'from-green-500 to-emerald-400';
        if (percent >= 70) return 'from-blue-500 to-cyan-400';
        if (percent >= 50) return 'from-yellow-500 to-orange-400';
        return 'from-red-500 to-pink-400';
    };

    const statLabels: Record<keyof PokemonStats, string> = {
        hp: 'HP',
        atk: 'Ataque',
        def: 'Defensa',
        spa: 'At. Esp.',
        spd: 'Def. Esp.',
        spe: 'Velocidad',
    };

    const natureInfo = NATURE_MODIFIERS[pokemon.nature] || {};

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => { playSound('cancel'); onClose(); }}
        >
            <div
                className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`relative p-6 bg-gradient-to-r ${pokemon.shiny ? 'from-yellow-600 to-amber-500' : 'from-purple-600 to-pink-600'}`}>
                    <button
                        onClick={() => { playSound('cancel'); onClose(); }}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors"
                    >
                        <i className="fas fa-times text-white"></i>
                    </button>

                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <img
                                src={pokemon.shiny
                                    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.speciesId}.png`
                                    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.speciesId}.png`
                                }
                                alt={pokemon.species}
                                className="w-32 h-32 object-contain drop-shadow-lg"
                            />
                            {pokemon.shiny && (
                                <span className="absolute top-0 right-0 text-2xl">✨</span>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-2xl font-bold text-white capitalize">
                                    {pokemon.nickname || pokemon.species.replace(/_/g, ' ')}
                                </h2>
                                {pokemon.shiny && (
                                    <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">SHINY</span>
                                )}
                            </div>
                            {pokemon.nickname && (
                                <p className="text-white/70 capitalize mb-2">{pokemon.species.replace(/_/g, ' ')}</p>
                            )}
                            <div className="flex flex-wrap gap-2 text-sm">
                                <span className="px-2 py-1 bg-white/20 rounded">Lv. {pokemon.level}</span>
                                <span className="px-2 py-1 bg-white/20 rounded capitalize">{pokemon.gender === 'male' ? '♂' : pokemon.gender === 'female' ? '♀' : '⚲'} {pokemon.gender}</span>
                                <span className="px-2 py-1 bg-white/20 rounded capitalize">{pokemon.nature}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Quick Info */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-gray-800/50 rounded-xl p-3 text-center border border-gray-700">
                            <p className="text-xs text-gray-400 mb-1">Habilidad</p>
                            <p className="text-sm font-medium text-white capitalize">{pokemon.ability.replace(/_/g, ' ')}</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-xl p-3 text-center border border-gray-700">
                            <p className="text-xs text-gray-400 mb-1">Amistad</p>
                            <p className="text-sm font-medium text-white">{pokemon.friendship}/255</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-xl p-3 text-center border border-gray-700">
                            <p className="text-xs text-gray-400 mb-1">Ball</p>
                            <p className="text-sm font-medium text-white capitalize">{(pokemon.caughtBall || 'poke_ball').replace(/_/g, ' ')}</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-xl p-3 text-center border border-gray-700">
                            <p className="text-xs text-gray-400 mb-1">EXP</p>
                            <p className="text-sm font-medium text-white">{pokemon.experience.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                            <i className="fas fa-chart-bar text-purple-400"></i>
                            Estadísticas
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* IVs */}
                            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                <h4 className="text-sm font-medium text-gray-400 mb-3">IVs (Individual Values)</h4>
                                <div className="space-y-2">
                                    {(Object.keys(pokemon.ivs) as Array<keyof PokemonStats>).map((stat) => (
                                        <div key={stat} className="flex items-center gap-2">
                                            <span className={`text-xs w-16 ${natureInfo.plus === stat ? 'text-green-400' :
                                                    natureInfo.minus === stat ? 'text-red-400' : 'text-gray-400'
                                                }`}>
                                                {statLabels[stat]}
                                                {natureInfo.plus === stat && ' ↑'}
                                                {natureInfo.minus === stat && ' ↓'}
                                            </span>
                                            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full bg-gradient-to-r ${getStatColor(pokemon.ivs[stat], maxIV)} transition-all`}
                                                    style={{ width: `${(pokemon.ivs[stat] / maxIV) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-white w-8 text-right font-mono">{pokemon.ivs[stat]}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2 text-right">
                                    Total: {Object.values(pokemon.ivs).reduce((a, b) => a + b, 0)}/186
                                </p>
                            </div>

                            {/* EVs */}
                            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                <h4 className="text-sm font-medium text-gray-400 mb-3">EVs (Effort Values)</h4>
                                <div className="space-y-2">
                                    {(Object.keys(pokemon.evs) as Array<keyof PokemonStats>).map((stat) => (
                                        <div key={stat} className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400 w-16">{statLabels[stat]}</span>
                                            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full bg-gradient-to-r ${getStatColor(pokemon.evs[stat], 252)} transition-all`}
                                                    style={{ width: `${(pokemon.evs[stat] / 252) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-white w-8 text-right font-mono">{pokemon.evs[stat]}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2 text-right">
                                    Total: {Object.values(pokemon.evs).reduce((a, b) => a + b, 0)}/510
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Moves */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                            <i className="fas fa-fist-raised text-red-400"></i>
                            Movimientos
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {pokemon.moves.length > 0 ? (
                                pokemon.moves.map((move, i) => (
                                    <div
                                        key={i}
                                        className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 text-center capitalize"
                                    >
                                        {move.replace(/_/g, ' ')}
                                    </div>
                                ))
                            ) : (
                                <p className="col-span-2 text-gray-500 text-center py-4">Sin movimientos</p>
                            )}
                            {[...Array(4 - pokemon.moves.length)].map((_, i) => (
                                <div
                                    key={`empty-${i}`}
                                    className="bg-gray-800/30 rounded-lg p-3 border border-dashed border-gray-700 text-center text-gray-600"
                                >
                                    —
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PlayerProfilePage() {
    const params = useParams();
    const uuid = params.uuid as string;

    const [profile, setProfile] = useState<PlayerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPokemon, setSelectedPokemon] = useState<CobblemonPokemon | null>(null);
    const [activeBox, setActiveBox] = useState(0);
    const [isMock, setIsMock] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, [uuid]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/players/${uuid}`);
            const data = await res.json();
            setProfile(data);
            setIsMock(data.mock || false);
        } catch (err) {
            setError('Error al cargar el perfil');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getPokemonSprite = (speciesId: number, shiny: boolean) => {
        if (speciesId <= 0) return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';
        return shiny
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${speciesId}.png`
            : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${speciesId}.png`;
    };

    const handlePokemonClick = (pokemon: CobblemonPokemon) => {
        playSound('confirm');
        setSelectedPokemon(pokemon);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="relative inline-block">
                        <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                        <img
                            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
                            alt=""
                            className="absolute inset-0 m-auto w-8 h-8 animate-pulse"
                        />
                    </div>
                    <p className="mt-4 text-gray-400">Cargando perfil...</p>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                    <p className="text-red-400 mb-4">{error || 'Perfil no encontrado'}</p>
                    <Link
                        href="/jugadores"
                        onClick={() => playSound('click')}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                    >
                        Volver a Jugadores
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-8 px-4">
                <div className="absolute inset-0 bg-black/20"></div>

                <div className="relative max-w-6xl mx-auto">
                    <Link
                        href="/jugadores"
                        onClick={() => playSound('click')}
                        className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
                    >
                        <i className="fas fa-arrow-left"></i>
                        Volver a Jugadores
                    </Link>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl font-bold text-white shadow-xl">
                                {(profile.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            {profile.stats.shinies > 0 && (
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                                    <i className="fas fa-star text-yellow-900"></i>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-white mb-2">
                                {(profile.username || 'Desconocido').replace(/_/g, ' ')}
                            </h1>

                            <div className="flex flex-wrap gap-4 text-white/80">
                                <div className="flex items-center gap-2">
                                    <i className="fas fa-paw text-purple-300"></i>
                                    <span>{profile.stats.totalPokemon} Pokémon</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="fas fa-dna text-cyan-300"></i>
                                    <span>{profile.stats.uniqueSpecies} Especies</span>
                                </div>
                                {profile.stats.shinies > 0 && (
                                    <div className="flex items-center gap-2 text-yellow-300">
                                        <i className="fas fa-star"></i>
                                        <span>{profile.stats.shinies} Shinies</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <i className="fas fa-chart-line text-green-300"></i>
                                    <span>Nivel promedio: {profile.stats.avgLevel}</span>
                                </div>
                            </div>

                            {isMock && (
                                <div className="mt-3 inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm">
                                    <i className="fas fa-flask"></i>
                                    Datos de demostración
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
                {/* Party Section */}
                <section>
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <i className="fas fa-users text-purple-400"></i>
                        Equipo ({profile.party.length}/6)
                    </h2>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                        {profile.party.map((pokemon, i) => (
                            <button
                                key={pokemon.uuid || i}
                                onClick={() => handlePokemonClick(pokemon)}
                                className={`relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 ${pokemon.shiny ? 'border-yellow-500/50' : 'border-gray-700 hover:border-purple-500/50'
                                    }`}
                            >
                                {pokemon.shiny && (
                                    <span className="absolute top-2 right-2 text-lg">✨</span>
                                )}
                                <img
                                    src={getPokemonSprite(pokemon.speciesId, pokemon.shiny)}
                                    alt={pokemon.species}
                                    className="w-full aspect-square object-contain"
                                />
                                <div className="mt-2 text-center">
                                    <p className="text-sm font-medium text-white capitalize truncate">
                                        {pokemon.nickname || pokemon.species.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-xs text-gray-400">Lv. {pokemon.level}</p>
                                </div>
                            </button>
                        ))}

                        {/* Empty slots */}
                        {[...Array(6 - profile.party.length)].map((_, i) => (
                            <div
                                key={`empty-${i}`}
                                className="bg-gray-800/30 rounded-xl p-4 border border-dashed border-gray-700 flex items-center justify-center min-h-[140px]"
                            >
                                <i className="fas fa-plus text-gray-600 text-2xl"></i>
                            </div>
                        ))}
                    </div>
                </section>

                {/* PC Section */}
                {profile.pc.length > 0 && (
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <i className="fas fa-box text-cyan-400"></i>
                            PC Storage
                        </h2>

                        {/* Box Tabs */}
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                            {profile.pc.map((box, i) => (
                                <button
                                    key={box.boxNumber}
                                    onClick={() => { playSound('click'); setActiveBox(i); }}
                                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${activeBox === i
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                                        }`}
                                >
                                    <i className="fas fa-box mr-2"></i>
                                    {box.name || `Box ${box.boxNumber}`}
                                    <span className="ml-2 text-xs opacity-70">({box.pokemon.length})</span>
                                </button>
                            ))}
                        </div>

                        {/* Active Box Content */}
                        {profile.pc[activeBox] && (
                            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-3">
                                    {profile.pc[activeBox].pokemon.map((pokemon, i) => (
                                        <button
                                            key={pokemon.uuid || i}
                                            onClick={() => handlePokemonClick(pokemon)}
                                            className={`relative bg-gray-900/50 rounded-xl p-2 border transition-all hover:scale-110 hover:z-10 ${pokemon.shiny ? 'border-yellow-500/50' : 'border-gray-700 hover:border-purple-500/50'
                                                }`}
                                            title={`${pokemon.species} Lv.${pokemon.level}`}
                                        >
                                            {pokemon.shiny && (
                                                <span className="absolute top-1 right-1 text-xs">✨</span>
                                            )}
                                            <img
                                                src={getPokemonSprite(pokemon.speciesId, pokemon.shiny)}
                                                alt={pokemon.species}
                                                className="w-full aspect-square object-contain"
                                            />
                                            <p className="text-[10px] text-gray-400 text-center mt-1">Lv.{pokemon.level}</p>
                                        </button>
                                    ))}
                                </div>

                                {profile.pc[activeBox].pokemon.length === 0 && (
                                    <p className="text-gray-500 text-center py-8">Esta caja está vacía</p>
                                )}
                            </div>
                        )}
                    </section>
                )}

                {/* Strongest Pokemon */}
                {profile.stats.strongestPokemon && (
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <i className="fas fa-crown text-yellow-400"></i>
                            Pokémon Más Fuerte
                        </h2>

                        <button
                            onClick={() => handlePokemonClick(profile.stats.strongestPokemon!)}
                            className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-2xl p-6 border border-yellow-500/30 hover:border-yellow-500/50 transition-all w-full sm:w-auto"
                        >
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <img
                                        src={getPokemonSprite(profile.stats.strongestPokemon.speciesId, profile.stats.strongestPokemon.shiny)}
                                        alt={profile.stats.strongestPokemon.species}
                                        className="w-24 h-24 object-contain"
                                    />
                                    {profile.stats.strongestPokemon.shiny && (
                                        <span className="absolute top-0 right-0 text-xl">✨</span>
                                    )}
                                </div>
                                <div className="text-left">
                                    <p className="text-xl font-bold text-white capitalize">
                                        {profile.stats.strongestPokemon.nickname || profile.stats.strongestPokemon.species.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-yellow-400">Nivel {profile.stats.strongestPokemon.level}</p>
                                    <p className="text-gray-400 text-sm capitalize">
                                        {profile.stats.strongestPokemon.nature} • {profile.stats.strongestPokemon.ability.replace(/_/g, ' ')}
                                    </p>
                                </div>
                            </div>
                        </button>
                    </section>
                )}
            </div>

            {/* Pokemon Detail Modal */}
            {selectedPokemon && (
                <PokemonModal
                    pokemon={selectedPokemon}
                    onClose={() => setSelectedPokemon(null)}
                />
            )}
        </div>
    );
}
