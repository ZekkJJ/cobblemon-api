'use client';

import { useState, useEffect } from 'react';
import StarterCard from '@/components/StarterCard';

interface ClaimedStarter {
    pokemonId: number;
    name: string;
    nameEs: string;
    types: string[];
    stats: any;
    abilities: any[];
    signatureMoves: any[];
    evolutions: any[];
    description: string;
    height: number;
    weight: number;
    claimedBy: string;
    claimedAt: string;
    isShiny: boolean;
}

export default function GalleryPage() {
    const [claimed, setClaimed] = useState<ClaimedStarter[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStarter, setSelectedStarter] = useState<ClaimedStarter | null>(null);

    useEffect(() => {
        fetchClaimed();
    }, []);

    const fetchClaimed = async () => {
        try {
            const res = await fetch('/api/starters');

            if (!res.ok) {
                console.error('Starters API error:', res.status);
                setClaimed([]);
                setLoading(false);
                return;
            }

            const data = await res.json();

            if (Array.isArray(data.starters)) {
                const claimedOnly = data.starters.filter((s: any) => s.isClaimed);
                setClaimed(claimedOnly);
            } else {
                console.error('Starters API returned invalid data:', data);
                setClaimed([]);
            }
        } catch (e) {
            console.error('Error fetching starters:', e);
            setClaimed([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen px-4 py-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="pixel-font text-2xl md:text-3xl text-white mb-2">
                        <i className="fas fa-th text-purple-500 mr-3"></i>
                        GALERÍA DE ENTRENADORES
                    </h1>
                    <p className="text-gray-400">
                        Los starters que ya han encontrado a sus entrenadores
                    </p>
                </div>

                {/* Stats */}
                <div className="glass-dark rounded-xl p-6 mb-8 text-center">
                    <div className="text-5xl font-bold text-white mb-2">{claimed.length}</div>
                    <div className="text-gray-400">Entrenadores han reclamado su starter</div>
                    <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden max-w-md mx-auto">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-1000"
                            style={{ width: `${(claimed.length / 27) * 100}%` }}
                        ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">{27 - claimed.length} starters aún disponibles</div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="text-center py-20">
                        <i className="fas fa-spinner fa-spin text-4xl text-white mb-4"></i>
                        <p className="text-gray-400">Cargando galería...</p>
                    </div>
                )}

                {/* Empty state */}
                {!loading && claimed.length === 0 && (
                    <div className="text-center py-20 glass-dark rounded-xl">
                        <i className="fas fa-users text-6xl text-gray-600 mb-4"></i>
                        <h2 className="text-xl font-bold text-white mb-2">¡Nadie ha reclamado un starter aún!</h2>
                        <p className="text-gray-400">Sé el primero en hacer tu tirada</p>
                    </div>
                )}

                {/* Gallery grid */}
                {!loading && claimed.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {claimed.map((starter) => (
                            <div
                                key={starter.pokemonId}
                                onClick={() => setSelectedStarter(starter)}
                                className="glass-dark rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-transform"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Sprite */}
                                    <div className="relative">
                                        <img
                                            src={
                                                starter.isShiny
                                                    ? starter.pokemonId <= 649
                                                        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/shiny/${starter.pokemonId}.gif`
                                                        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/shiny/${starter.pokemonId}.gif`
                                                    : starter.pokemonId <= 649
                                                        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${starter.pokemonId}.gif`
                                                        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${starter.pokemonId}.gif`
                                            }
                                            alt={starter.name}
                                            className="w-20 h-20 object-contain"
                                        />
                                        {starter.isShiny && (
                                            <span className="absolute -top-1 -right-1 text-yellow-400 animate-pulse">
                                                <i className="fas fa-star"></i>
                                            </span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-white">{starter.name}</span>
                                            {starter.isShiny && (
                                                <span className="text-[10px] bg-yellow-500 text-black px-2 py-0.5 rounded-full font-bold">
                                                    SHINY
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-1 mb-2">
                                            {starter.types.map((type) => (
                                                <span
                                                    key={type}
                                                    className="type-badge text-[10px]"
                                                    style={{
                                                        backgroundColor:
                                                            type === 'Grass' ? '#78C850' : type === 'Fire' ? '#F08030' : type === 'Water' ? '#6890F0' : type === 'Poison' ? '#A040A0' : type === 'Flying' ? '#A890F0' : '#A8A878',
                                                    }}
                                                >
                                                    {type}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="text-sm text-gray-300">
                                            <i className="fas fa-user text-purple-400 mr-1"></i>
                                            {starter.claimedBy}
                                        </div>
                                        {starter.claimedAt && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {new Date(starter.claimedAt).toLocaleDateString('es-ES', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Detail modal */}
                {selectedStarter && (
                    <div
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setSelectedStarter(null)}
                    >
                        <div
                            className="relative w-full max-w-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <StarterCard
                                starter={selectedStarter}
                                isShiny={selectedStarter.isShiny}
                                size="full"
                            />

                            {/* Owner badge */}
                            <div className="absolute -top-3 -left-3 bg-purple-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg border-2 border-white font-bold">
                                <i className="fas fa-crown mr-1"></i>
                                {selectedStarter.claimedBy}
                            </div>

                            <button
                                onClick={() => setSelectedStarter(null)}
                                className="absolute -top-4 -right-4 w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors shadow-lg"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
