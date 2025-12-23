'use client';

import { useState, useEffect } from 'react';
import { startersAPI } from '@/src/lib/api-client';
import { Starter } from '@/src/lib/types/pokemon';
import StarterCard from '@/src/components/StarterCard';
import { playSound } from '@/src/lib/sounds';

export default function GaleriaPage() {
  const [starters, setStarters] = useState<Starter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStarter, setSelectedStarter] = useState<Starter | null>(null);

  useEffect(() => {
    fetchStarters();
  }, []);

  const fetchStarters = async () => {
    try {
      setLoading(true);
      console.log('[GALERIA] Fetching starters...');
      const data = await startersAPI.getAll();
      console.log('[GALERIA] Received data:', data);
      // Filtrar solo los starters reclamados de forma segura
      const claimed = (data.starters || []).filter((s: any) => s && s.isClaimed);
      console.log('[GALERIA] Claimed starters:', claimed.length);
      setStarters(claimed);
      setError(null);
    } catch (err: any) {
      console.error('[GALERIA] Error loading starters:', err);
      setError(err.message || 'Error al cargar la galería');
      setStarters([]); // Ensure starters is always an array
    } finally {
      setLoading(false);
    }
  };

  const totalStarters = 27; // Total de starters disponibles
  const claimedCount = starters?.length || 0;
  const availableCount = totalStarters - claimedCount;
  const progressPercent = (claimedCount / totalStarters) * 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-poke-red border-t-transparent mb-4"></div>
          <p className="text-xl">Cargando galería...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md text-center">
          <i className="fas fa-exclamation-triangle text-6xl text-poke-red mb-4"></i>
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <button onClick={fetchStarters} className="btn-primary">
            <i className="fas fa-redo mr-2"></i>
            Reintentar
          </button>
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
            <i className="fas fa-images mr-3"></i>
            GALERÍA DE STARTERS
          </h1>
          <p className="text-xl text-slate-300">
            Starters únicos reclamados por los jugadores
          </p>
        </div>

        {/* Stats Card */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-poke-green mb-2">
                  {claimedCount}
                </div>
                <div className="text-slate-400">Reclamados</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-poke-blue mb-2">
                  {availableCount}
                </div>
                <div className="text-slate-400">Disponibles</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-poke-yellow mb-2">
                  {starters.filter(s => s.isShiny).length}
                </div>
                <div className="text-slate-400">Shinies</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Progreso</span>
                <span className="font-bold">{progressPercent.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-poke-red via-poke-yellow to-poke-green h-4 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        {starters.length === 0 ? (
          <div className="card text-center py-12">
            <i className="fas fa-inbox text-6xl text-slate-600 mb-4"></i>
            <p className="text-slate-400 text-xl">
              Aún no hay starters reclamados
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {starters.filter(s => s && s.sprites).map((starter) => (
              <div
                key={starter.pokemonId}
                onClick={() => {
                  setSelectedStarter(starter);
                  playSound('click');
                }}
                className={`card cursor-pointer hover:scale-105 transition-all ${starter.isShiny ? 'ring-2 ring-poke-yellow shadow-lg shadow-poke-yellow/50' : ''
                  }`}
              >
                {/* Shiny Badge */}
                {starter.isShiny && (
                  <div className="absolute top-2 right-2 text-2xl animate-pulse">
                    ✨
                  </div>
                )}

                {/* Sprite */}
                <div className="flex justify-center mb-2">
                  <img
                    src={
                      starter.isShiny
                        ? starter.sprites.shinyAnimated || starter.sprites.shiny
                        : starter.sprites.spriteAnimated || starter.sprites.sprite
                    }
                    alt={starter.name}
                    className="w-20 h-20 object-contain"
                    loading="lazy"
                  />
                </div>

                {/* Name */}
                <div className="text-center">
                  <div className="font-bold text-sm mb-1 truncate">
                    {starter.nameEs || starter.name}
                  </div>

                  {/* Types */}
                  <div className="flex gap-1 justify-center mb-2">
                    {(starter.types || []).map((type) => (
                      <span
                        key={type}
                        className="px-2 py-0.5 rounded text-xs text-white"
                        style={{ backgroundColor: getTypeColor(type) }}
                      >
                        {type}
                      </span>
                    ))}
                  </div>

                  {/* Owner */}
                  {starter.claimedBy && (
                    <div className="text-xs text-slate-400 truncate">
                      <i className="fas fa-user mr-1"></i>
                      {starter.claimedBy}
                    </div>
                  )}

                  {/* Date */}
                  {starter.claimedAt && (
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(starter.claimedAt).toLocaleDateString('es-ES')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {selectedStarter && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setSelectedStarter(null);
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
                    setSelectedStarter(null);
                    playSound('cancel');
                  }}
                  className="absolute top-4 right-4 z-10 w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>

                {/* Owner Badge */}
                {selectedStarter.claimedBy && (
                  <div className="absolute top-4 left-4 z-10 bg-poke-purple/90 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <div className="text-xs text-slate-300 mb-1">Dueño</div>
                    <div className="font-bold">{selectedStarter.claimedBy}</div>
                  </div>
                )}

                {/* Starter Card */}
                <StarterCard
                  starter={selectedStarter}
                  isShiny={selectedStarter.isShiny || false}
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

// Helper function for type colors
function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
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
  return colors[type.toLowerCase()] || '#777';
}
