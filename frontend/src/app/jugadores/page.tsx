'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { playersAPI } from '@/src/lib/api-client';
import { playSound } from '@/src/lib/sounds';

interface PlayerSummary {
  uuid: string;
  username: string;
  totalPokemon: number;
  shinies: number;
  starter?: {
    id: number;
    name: string;
    isShiny: boolean;
  };
  partyPreview: Array<{
    species: string;
    speciesId: number;
    level: number;
    shiny: boolean;
  }>;
}

export default function JugadoresPage() {
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'pokemon' | 'shinies'>('name');

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const data = await playersAPI.getAll();
      setPlayers(data.players || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar jugadores');
      setPlayers([]); // Ensure players is always an array
    } finally {
      setLoading(false);
    }
  };

  // Filtrar y ordenar jugadores
  const filteredAndSortedPlayers = useMemo(() => {
    let result = [...players];

    // Filtrar por búsqueda
    if (searchTerm) {
      result = result.filter((p) =>
        (p.username || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.username || '').localeCompare(b.username || '');
        case 'pokemon':
          return (b.totalPokemon || 0) - (a.totalPokemon || 0);
        case 'shinies':
          return (b.shinies || 0) - (a.shinies || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [players, searchTerm, sortBy]);

  // Calcular estadísticas globales
  const globalStats = useMemo(() => {
    return {
      totalPlayers: players.length,
      totalPokemon: players.reduce((sum, p) => sum + (p.totalPokemon || 0), 0),
      totalShinies: players.reduce((sum, p) => sum + (p.shinies || 0), 0),
    };
  }, [players]);

  const handleSortChange = (newSort: 'name' | 'pokemon' | 'shinies') => {
    setSortBy(newSort);
    playSound('click');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-poke-blue border-t-transparent mb-4"></div>
          <p className="text-xl">Cargando jugadores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md text-center">
          <i className="fas fa-exclamation-triangle text-5xl text-poke-red mb-4"></i>
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <button onClick={fetchPlayers} className="btn-primary">
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
          <h1 className="text-5xl font-bold mb-4 pixel-font text-poke-blue">
            <i className="fas fa-users mr-3"></i>
            JUGADORES
          </h1>
          <p className="text-xl text-slate-300">
            Explora los equipos y progreso de la comunidad
          </p>
        </div>

        {/* Search and Sort Controls */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="card">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar jugador..."
                    className="w-full bg-slate-700 text-white pl-12 pr-4 py-3 rounded-lg border border-slate-600 focus:border-poke-blue focus:outline-none"
                  />
                </div>
              </div>

              {/* Sort Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleSortChange('name')}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    sortBy === 'name'
                      ? 'bg-poke-blue text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <i className="fas fa-sort-alpha-down mr-2"></i>
                  Nombre
                </button>
                <button
                  onClick={() => handleSortChange('pokemon')}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    sortBy === 'pokemon'
                      ? 'bg-poke-blue text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <i className="fas fa-dragon mr-2"></i>
                  Pokémon
                </button>
                <button
                  onClick={() => handleSortChange('shinies')}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    sortBy === 'shinies'
                      ? 'bg-poke-blue text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <i className="fas fa-star mr-2"></i>
                  Shinies
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Players Grid */}
        {filteredAndSortedPlayers.length > 0 ? (
          <div className="max-w-6xl mx-auto mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedPlayers.map((player) => (
                <PlayerCard key={player.uuid} player={player} />
              ))}
            </div>
          </div>
        ) : (
          <div className="card text-center py-16 max-w-2xl mx-auto mb-12">
            <i className="fas fa-search text-6xl text-slate-600 mb-4"></i>
            <h3 className="text-white font-bold text-xl mb-2">No se encontraron jugadores</h3>
            <p className="text-slate-400">
              {searchTerm
                ? 'Intenta con otro término de búsqueda'
                : 'No hay jugadores registrados aún'}
            </p>
          </div>
        )}

        {/* Global Stats Footer */}
        <div className="max-w-4xl mx-auto">
          <div className="card">
            <h3 className="text-white font-bold text-xl mb-6 text-center">
              <i className="fas fa-chart-bar text-poke-yellow mr-2"></i>
              Estadísticas Globales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-poke-blue mb-2">
                  {globalStats.totalPlayers}
                </div>
                <div className="text-slate-400">
                  <i className="fas fa-users mr-2"></i>
                  Jugadores
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-poke-green mb-2">
                  {globalStats.totalPokemon}
                </div>
                <div className="text-slate-400">
                  <i className="fas fa-dragon mr-2"></i>
                  Pokémon Totales
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-poke-yellow mb-2">
                  {globalStats.totalShinies}
                </div>
                <div className="text-slate-400">
                  <i className="fas fa-star mr-2"></i>
                  Shinies
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Player Card Component
function PlayerCard({ player }: { player: PlayerSummary }) {
  // Validar que el player tenga datos válidos
  const username = player.username || player.uuid || 'Unknown';
  
  return (
    <Link href={`/jugadores/${player.uuid}`}>
      <div className="card hover:border-poke-blue transition-all cursor-pointer group">
        {/* Header with Avatar */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-poke-blue to-cyan-500 flex items-center justify-center text-2xl font-bold">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg group-hover:text-poke-blue transition-colors">
              {username}
            </h3>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>
                <i className="fas fa-dragon mr-1"></i>
                {player.totalPokemon || 0}
              </span>
              <span>
                <i className="fas fa-star text-poke-yellow mr-1"></i>
                {player.shinies || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Starter Badge */}
        {player.starter && (
          <div className="mb-4 p-3 bg-slate-700/50 rounded-lg flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-egg text-poke-yellow text-xl"></i>
            </div>
            <div className="flex-1">
              <div className="text-xs text-slate-400">Starter del Gacha</div>
              <div className="text-white font-medium flex items-center gap-2">
                {player.starter.name}
                {player.starter.isShiny && (
                  <i className="fas fa-star text-poke-yellow text-xs"></i>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Party Preview */}
        {player.partyPreview && player.partyPreview.length > 0 && (
          <div>
            <div className="text-xs text-slate-400 mb-2">Equipo Actual</div>
            <div className="grid grid-cols-6 gap-2">
              {player.partyPreview.slice(0, 6).map((pokemon, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square bg-slate-700/50 rounded-lg p-1 group-hover:bg-slate-700 transition-colors"
                >
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.speciesId}.png`}
                    alt={pokemon.species}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                  {pokemon.shiny && (
                    <i className="fas fa-star text-poke-yellow text-xs absolute top-0 right-0"></i>
                  )}
                </div>
              ))}
              {/* Empty slots */}
              {Array.from({ length: Math.max(0, 6 - player.partyPreview.length) }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="aspect-square bg-slate-800/50 rounded-lg border border-dashed border-slate-700"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
