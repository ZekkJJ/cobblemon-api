'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';
import { GachaBanner, FeaturedItem, RARITY_COLORS, RARITY_NAMES, Rarity } from '@/lib/types/gacha';

interface EpitomizedStatus {
  bannerId: string;
  targetPokemonId: number | null;
  targetPokemonName: string | null;
  fatePoints: number;
  maxFatePoints: number;
  history: Array<{
    pokemonId: number;
    pokemonName: string;
    wasTarget: boolean;
    timestamp: string;
  }>;
}

interface EpitomizedPathSelectorProps {
  banner: GachaBanner;
  discordId: string;
  onTargetSet?: (target: FeaturedItem) => void;
}

// Fate Points display
function FatePointsDisplay({ points, max }: { points: number; max: number }) {
  return (
    <div className="flex items-center gap-2">
      {[...Array(max)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className={`
            w-8 h-8 rounded-full border-2 flex items-center justify-center
            ${i < points 
              ? 'bg-cyan-500 border-cyan-400 text-white' 
              : 'bg-gray-800 border-gray-600 text-gray-600'
            }
          `}
        >
          {i < points ? '★' : '☆'}
        </motion.div>
      ))}
    </div>
  );
}

// Pokemon selector card
function PokemonSelectorCard({ 
  pokemon, 
  isSelected, 
  onSelect 
}: { 
  pokemon: FeaturedItem; 
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative p-4 rounded-xl border-2 transition-all
        ${isSelected 
          ? 'border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/30' 
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
        }
      `}
    >
      {/* Selected indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
        >
          ✓
        </motion.div>
      )}

      {/* Pokemon sprite */}
      <div className="relative w-20 h-20 mx-auto mb-2">
        <Image
          src={pokemon.sprite}
          alt={pokemon.name}
          fill
          className="object-contain pixelated"
          unoptimized
        />
      </div>

      {/* Name */}
      <p className="font-bold text-white text-center text-sm">
        {pokemon.nameEs || pokemon.name}
      </p>

      {/* Rarity */}
      <div className="flex justify-center mt-1">
        <span
          className="text-xs px-2 py-0.5 rounded font-medium"
          style={{
            backgroundColor: `${RARITY_COLORS[pokemon.rarity as Rarity]}20`,
            color: RARITY_COLORS[pokemon.rarity as Rarity],
          }}
        >
          {RARITY_NAMES[pokemon.rarity as Rarity]}
        </span>
      </div>
    </motion.button>
  );
}

export function EpitomizedPathSelector({ banner, discordId, onTargetSet }: EpitomizedPathSelectorProps) {
  const [status, setStatus] = useState<EpitomizedStatus | null>(null);
  const [selectedPokemon, setSelectedPokemon] = useState<FeaturedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  // Only show for limited banners with featured Pokemon
  const isEligible = banner.type === 'limited' && banner.featuredPokemon && banner.featuredPokemon.length > 1;

  const fetchStatus = async () => {
    if (!isEligible) {
      setLoading(false);
      return;
    }

    try {
      const res = await apiClient.get(`/api/pokemon-gacha/epitomized/${banner.bannerId}?discordId=${discordId}`);
      if (res.success && res.epitomized) {
        setStatus(res.epitomized);
        // Set selected pokemon if target exists
        if (res.epitomized.targetPokemonId) {
          const target = banner.featuredPokemon?.find(p => p.id === res.epitomized.targetPokemonId);
          if (target) setSelectedPokemon(target);
        }
      }
    } catch (err: any) {
      // Not an error if no path set yet
      console.log('No epitomized path set yet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (discordId && banner.bannerId) {
      fetchStatus();
    }
  }, [discordId, banner.bannerId]);

  const handleSetTarget = async () => {
    if (!selectedPokemon) return;

    setSaving(true);
    setError(null);

    try {
      const res = await apiClient.post('/api/pokemon-gacha/epitomized', {
        bannerId: banner.bannerId,
        targetPokemonId: selectedPokemon.id,
        targetPokemonName: selectedPokemon.nameEs || selectedPokemon.name,
        discordId,
      });

      if (res.success) {
        setStatus(res.epitomized || {
          bannerId: banner.bannerId,
          targetPokemonId: selectedPokemon.id as number,
          targetPokemonName: selectedPokemon.nameEs || selectedPokemon.name,
          fatePoints: 0,
          maxFatePoints: 2,
          history: [],
        });
        setShowSelector(false);
        onTargetSet?.(selectedPokemon);
      }
    } catch (err: any) {
      setError(err.message || 'Error al establecer objetivo');
    } finally {
      setSaving(false);
    }
  };

  if (!isEligible) return null;

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 rounded-xl p-4 border border-cyan-500/30">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-700 rounded-full" />
          <div className="h-4 bg-gray-700 rounded w-32" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 rounded-xl p-4 border border-cyan-500/30"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <div>
            <h3 className="font-bold text-white">Camino Epitomizado</h3>
            <p className="text-xs text-gray-400">Garantiza tu Pokémon destacado</p>
          </div>
        </div>
      </div>

      {status?.targetPokemonId ? (
        // Target is set - show status
        <div className="space-y-4">
          {/* Current Target */}
          <div className="flex items-center gap-4 bg-gray-800/50 rounded-lg p-3">
            <div className="relative w-16 h-16">
              {selectedPokemon?.sprite && (
                <Image
                  src={selectedPokemon.sprite}
                  alt={status.targetPokemonName || ''}
                  fill
                  className="object-contain pixelated"
                  unoptimized
                />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-400">Objetivo actual:</p>
              <p className="font-bold text-cyan-400">{status.targetPokemonName}</p>
            </div>
            <button
              onClick={() => setShowSelector(true)}
              className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-xs hover:bg-gray-600 transition-colors"
            >
              Cambiar
            </button>
          </div>

          {/* Fate Points */}
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">Puntos de Destino</p>
            <FatePointsDisplay points={status.fatePoints} max={status.maxFatePoints} />
            <p className="text-xs text-gray-500 mt-2">
              {status.fatePoints >= status.maxFatePoints 
                ? '¡Tu próximo destacado será tu objetivo!' 
                : `${status.maxFatePoints - status.fatePoints} más para garantizar`
              }
            </p>
          </div>

          {/* History */}
          {status.history && status.history.length > 0 && (
            <div className="border-t border-gray-700/50 pt-3">
              <p className="text-xs text-gray-500 mb-2">Historial de destacados:</p>
              <div className="space-y-1">
                {status.history.slice(-3).map((entry, idx) => (
                  <div 
                    key={idx}
                    className={`text-xs px-2 py-1 rounded ${entry.wasTarget ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/50 text-gray-400'}`}
                  >
                    {entry.pokemonName} {entry.wasTarget ? '✓' : '(+1 Punto)'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // No target set - show prompt
        <div className="text-center py-4">
          <p className="text-gray-400 mb-4">
            Selecciona un Pokémon destacado para garantizarlo después de 2 pérdidas de 50/50
          </p>
          <button
            onClick={() => setShowSelector(true)}
            className="px-6 py-2 bg-cyan-600 text-white rounded-lg font-bold hover:bg-cyan-500 transition-colors"
          >
            🎯 Establecer Objetivo
          </button>
        </div>
      )}

      {/* Selector Modal */}
      <AnimatePresence>
        {showSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowSelector(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 rounded-2xl max-w-lg w-full p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4 text-center">
                🎯 Selecciona tu Objetivo
              </h3>

              <p className="text-sm text-gray-400 text-center mb-6">
                Elige el Pokémon destacado que quieres garantizar
              </p>

              {/* Pokemon Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {banner.featuredPokemon?.filter(p => p.type === 'pokemon').map((pokemon) => (
                  <PokemonSelectorCard
                    key={pokemon.id}
                    pokemon={pokemon}
                    isSelected={selectedPokemon?.id === pokemon.id}
                    onSelect={() => setSelectedPokemon(pokemon)}
                  />
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSelector(false)}
                  className="flex-1 py-3 bg-gray-700 text-gray-300 rounded-xl font-bold hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSetTarget}
                  disabled={!selectedPokemon || saving}
                  className={`
                    flex-1 py-3 rounded-xl font-bold transition-all
                    ${selectedPokemon 
                      ? 'bg-cyan-600 text-white hover:bg-cyan-500' 
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }
                    ${saving ? 'opacity-50' : ''}
                  `}
                >
                  {saving ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>

              {/* Info */}
              <p className="text-xs text-gray-500 text-center mt-4">
                ⚠️ Los Puntos de Destino se reinician al cambiar de objetivo o cuando el banner termina
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
