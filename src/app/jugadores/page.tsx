'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { playSound } from '@/lib/sounds';
import { PlayerSummary } from '@/lib/types/pokemon';
import { playersAPI } from '@/lib/api-client';

export default function JugadoresPage() {
    const [players, setPlayers] = useState<PlayerSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'pokemon' | 'shinies'>('pokemon');
    const [isMock, setIsMock] = useState(false);

    useEffect(() => {
        fetchPlayers();
    }, []);

    const fetchPlayers = async () => {
        try {
            setLoading(true);
            const data = await playersAPI.getAll();
            console.log('[PLAYERS PAGE] Received data:', data);
            if (data.players && data.players.length === 0) {
                console.warn('[PLAYERS PAGE] API returned 0 players');
            }
            setPlayers(data.players || []);
            setIsMock(false); // Backend real data
        } catch (err) {
            setError('Error al cargar jugadores');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredPlayers = players
        .filter(p => p.username.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.username.localeCompare(b.username);
                case 'pokemon':
                    return b.totalPokemon - a.totalPokemon;
                case 'shinies':
                    return b.shinies - a.shinies;
                default:
                    return 0;
            }
        });

    const getPokemonSprite = (speciesId: number, shiny: boolean) => {
        if (speciesId <= 0) return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';
        const baseUrl = shiny
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${speciesId}.png`
            : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${speciesId}.png`;
        return baseUrl;
    };

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-16 px-4 sm:py-20">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute inset-0 bg-[url('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png')] bg-repeat opacity-5"></div>

                <div className="relative max-w-7xl mx-auto text-center">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 pixel-font drop-shadow-lg">
                        <i className="fas fa-users mr-3 sm:mr-4"></i>
                        Jugadores
                    </h1>
                    <p className="text-base sm:text-lg lg:text-xl text-white/90 max-w-2xl mx-auto">
                        Explora los perfiles de todos los entrenadores del servidor
                    </p>

                    {isMock && (
                        <div className="mt-6 inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-300 px-5 py-3 rounded-full text-sm backdrop-blur-sm border border-yellow-500/30">
                            <i className="fas fa-flask"></i>
                            Datos de demostración - Conecta el servidor para datos reales
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-gray-800/60 backdrop-blur-sm rounded-2xl p-5 border border-gray-700/50 shadow-xl">
                    {/* Search */}
                    <div className="relative w-full lg:w-auto flex-1 lg:max-w-md">
                        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                        <input
                            type="text"
                            placeholder="Buscar jugador..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                        />
                    </div>

                    {/* Sort */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <span className="text-gray-400 text-sm font-medium">Ordenar por:</span>
                        <div className="flex bg-gray-700/50 rounded-xl p-1.5 gap-1">
                            {[
                                { key: 'pokemon', label: 'Pokémon', icon: 'fa-paw' },
                                { key: 'shinies', label: 'Shinies', icon: 'fa-star' },
                                { key: 'name', label: 'Nombre', icon: 'fa-font' },
                            ].map((option) => (
                                <button
                                    key={option.key}
                                    onClick={() => { playSound('click'); setSortBy(option.key as any); }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${sortBy === option.key
                                        ? 'bg-purple-600 text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-600/50'
                                        }`}
                                >
                                    <i className={`fas ${option.icon} text-xs`}></i>
                                    <span>{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Player Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                            <img
                                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
                                alt=""
                                className="absolute inset-0 m-auto w-10 h-10 animate-pulse"
                            />
                        </div>
                        <p className="mt-6 text-gray-400 text-lg">Cargando jugadores...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-32">
                        <i className="fas fa-exclamation-triangle text-5xl text-red-500 mb-6"></i>
                        <p className="text-red-400 text-lg mb-6">{error}</p>
                        <button
                            onClick={() => fetchPlayers()}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors font-medium"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : filteredPlayers.length === 0 ? (
                    <div className="text-center py-32">
                        <i className="fas fa-user-slash text-5xl text-gray-600 mb-6"></i>
                        <p className="text-gray-400 text-lg">No se encontraron jugadores</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                        {filteredPlayers.map((player, index) => (
                            <Link
                                key={player.uuid}
                                href={`/jugadores/${player.uuid}`}
                                onClick={() => playSound('click')}
                                className="group relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl border border-gray-700/50 hover:border-purple-500/60 overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-purple-500/30"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                                {/* Content */}
                                <div className="relative p-6">
                                    {/* Header */}
                                    <div className="flex items-start gap-4 mb-5">
                                        <div className="relative flex-shrink-0">
                                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                                {((player.username || 'U').charAt(0) || 'U').toUpperCase()}
                                            </div>
                                            {player.shinies > 0 && (
                                                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                                                    <i className="fas fa-star text-xs text-yellow-900"></i>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors truncate mb-1">
                                                {(player.username || 'Desconocido').replace(/_/g, ' ')}
                                            </h3>
                                            <div className="flex items-center gap-3 text-sm">
                                                <span className="flex items-center gap-1.5 text-gray-400">
                                                    <i className="fas fa-paw text-xs"></i>
                                                    <span className="font-medium">{player.totalPokemon}</span>
                                                </span>
                                                {player.shinies > 0 && (
                                                    <span className="flex items-center gap-1.5 text-yellow-400">
                                                        <i className="fas fa-star text-xs"></i>
                                                        <span className="font-medium">{player.shinies}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Starter Badge */}
                                    {player.starter && (
                                        <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl p-3 border border-purple-500/30 mb-4">
                                            <p className="text-xs text-purple-300 mb-2 uppercase tracking-wider font-medium flex items-center gap-1.5">
                                                <i className="fas fa-certificate text-xs"></i>
                                                Starter del Gacha
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <div className={`relative w-14 h-14 bg-gray-800 rounded-lg p-1 ${player.starter.isShiny ? 'ring-2 ring-yellow-400/60' : ''}`}>
                                                    <img
                                                        src={getPokemonSprite(player.starter.id, player.starter.isShiny)}
                                                        alt={player.starter.name}
                                                        className="w-full h-full object-contain"
                                                        loading="lazy"
                                                    />
                                                    {player.starter.isShiny && (
                                                        <span className="absolute -top-1 -right-1 text-sm">✨</span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-white font-bold text-sm">{player.starter.name}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {player.starter.isShiny ? '✨ Shiny' : 'Normal'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Party Preview */}
                                    <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/50">
                                        <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider font-medium">Equipo Actual</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(player.partyPreview || []).length > 0 ? (
                                                player.partyPreview.map((poke, i) => (
                                                    <div
                                                        key={i}
                                                        className={`relative aspect-square bg-gray-800 rounded-lg p-1.5 ${poke.shiny ? 'ring-2 ring-yellow-400/60' : ''
                                                            }`}
                                                        title={`${poke.species} Lv.${poke.level}${poke.shiny ? ' ✨' : ''}`}
                                                    >
                                                        <img
                                                            src={getPokemonSprite(poke.speciesId, poke.shiny)}
                                                            alt={poke.species}
                                                            className="w-full h-full object-contain"
                                                            loading="lazy"
                                                        />
                                                        <span className="absolute bottom-1 right-1 text-[10px] bg-gray-900 px-1.5 py-0.5 rounded text-gray-300 font-medium">
                                                            {poke.level}
                                                        </span>
                                                        {poke.shiny && (
                                                            <span className="absolute top-1 left-1 text-xs">✨</span>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="col-span-3 text-gray-500 text-sm text-center py-4">Sin equipo</span>
                                            )}
                                            {(player.partyPreview || []).length > 0 && (player.partyPreview || []).length < 6 && (
                                                [...Array(6 - (player.partyPreview || []).length)].map((_, i) => (
                                                    <div
                                                        key={`empty-${i}`}
                                                        className="aspect-square bg-gray-800/50 rounded-lg border border-dashed border-gray-700"
                                                    ></div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* View Profile Arrow */}
                                    <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center group-hover:bg-purple-600 group-hover:scale-110 transition-all shadow-lg">
                                        <i className="fas fa-chevron-right text-sm text-gray-400 group-hover:text-white transition-colors"></i>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Stats Footer */}
            {!loading && players.length > 0 && (
                <div className="bg-gradient-to-r from-gray-800/60 via-gray-800/80 to-gray-800/60 border-t border-gray-700/50 backdrop-blur-sm py-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                            <div className="bg-gray-900/50 rounded-2xl p-6 text-center border border-gray-700/50">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                    <i className="fas fa-users text-blue-400 text-xl"></i>
                                </div>
                                <p className="text-4xl font-bold text-white mb-1">{players.length}</p>
                                <p className="text-sm text-gray-400 uppercase tracking-wide">Jugadores</p>
                            </div>
                            <div className="bg-gray-900/50 rounded-2xl p-6 text-center border border-gray-700/50">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                    <i className="fas fa-paw text-purple-400 text-xl"></i>
                                </div>
                                <p className="text-4xl font-bold text-purple-400 mb-1">
                                    {players.reduce((sum, p) => sum + p.totalPokemon, 0)}
                                </p>
                                <p className="text-sm text-gray-400 uppercase tracking-wide">Pokémon Totales</p>
                            </div>
                            <div className="bg-gray-900/50 rounded-2xl p-6 text-center border border-gray-700/50">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                                    <i className="fas fa-star text-yellow-400 text-xl"></i>
                                </div>
                                <p className="text-4xl font-bold text-yellow-400 mb-1">
                                    {players.reduce((sum, p) => sum + p.shinies, 0)}
                                </p>
                                <p className="text-sm text-gray-400 uppercase tracking-wide">Shinies</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
