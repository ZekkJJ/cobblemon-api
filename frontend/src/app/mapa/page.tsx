'use client';

import { useState, useEffect } from 'react';
import { playersAPI } from '@/src/lib/api-client';
import { playSound } from '@/src/lib/sounds';

const BLUEMAP_URL = 'http://cobblemon2.pals.army:17335';

interface PlayerOnMap {
  uuid: string;
  username: string;
  x: number;
  y: number;
  z: number;
  world: string;
  online: boolean;
  party: Array<{
    species: string;
    speciesId: number;
    level: number;
    shiny: boolean;
  }>;
}

export default function MapaPage() {
  const [players, setPlayers] = useState<PlayerOnMap[]>([]);
  const [allPlayers, setAllPlayers] = useState<PlayerOnMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPokemon, setShowPokemon] = useState(true);
  const [filter, setFilter] = useState<'online' | 'all'>('online');

  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPlayers = async () => {
    try {
      const data = await playersAPI.getAll();
      const mapped = (data.players || []).map((p: any) => ({
        uuid: p.uuid,
        username: p.username,
        x: p.x || 0,
        y: p.y || 64,
        z: p.z || 0,
        world: p.world || 'overworld',
        online: p.online || false,
        party: p.partyPreview || [],
      }));
      setAllPlayers(mapped);
      setPlayers(mapped.filter((p: PlayerOnMap) => p.online));
    } catch (error) {
      console.error('[MAPA] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayPlayers = filter === 'online' ? players : allPlayers;

  const openBlueMap = (player?: PlayerOnMap) => {
    playSound('click');
    if (player) {
      const hash = `#${player.world}:${Math.round(player.x)}:${Math.round(player.y)}:${Math.round(player.z)}:500:0:0:0:0:perspective`;
      window.open(`${BLUEMAP_URL}/${hash}`, '_blank');
    } else {
      window.open(BLUEMAP_URL, '_blank');
    }
  };

  const copyCoords = (player: PlayerOnMap) => {
    const coords = `${Math.round(player.x)} ${Math.round(player.y)} ${Math.round(player.z)}`;
    navigator.clipboard.writeText(coords);
    playSound('success');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-poke-green border-t-transparent mb-4"></div>
          <p className="text-xl">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 pixel-font text-poke-green">
            <i className="fas fa-map-marked-alt mr-3"></i>
            MAPA DEL MUNDO
          </h1>
          <p className="text-xl text-slate-300 mb-6">
            Explora el mundo de Los Pitufos
          </p>
          
          {/* Open BlueMap Button */}
          <button
            onClick={() => openBlueMap()}
            className="btn-primary text-xl py-4 px-8 animate-pulse hover:animate-none"
          >
            <i className="fas fa-globe mr-3"></i>
            Abrir Mapa 3D Interactivo
          </button>
        </div>

        {/* World Info */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="card">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-poke-green mb-1">{players.length}</div>
                <div className="text-slate-400 text-sm">Online Ahora</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-poke-blue mb-1">{allPlayers.length}</div>
                <div className="text-slate-400 text-sm">Jugadores Total</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-poke-yellow mb-1">∞</div>
                <div className="text-slate-400 text-sm">Mundo Infinito</div>
              </div>
              <div>
                <code className="text-sm bg-slate-700 px-3 py-2 rounded block">-2883780887602083665</code>
                <div className="text-slate-400 text-sm mt-1">Seed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setFilter('online'); playSound('click'); }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'online' ? 'bg-poke-green text-white' : 'bg-slate-700 text-slate-400'}`}
            >
              <i className="fas fa-circle text-xs mr-2"></i>
              Online ({players.length})
            </button>
            <button
              onClick={() => { setFilter('all'); playSound('click'); }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'all' ? 'bg-poke-blue text-white' : 'bg-slate-700 text-slate-400'}`}
            >
              <i className="fas fa-users mr-2"></i>
              Todos ({allPlayers.length})
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setShowPokemon(!showPokemon); playSound('click'); }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${showPokemon ? 'bg-poke-yellow text-black' : 'bg-slate-700 text-slate-400'}`}
            >
              <i className="fas fa-dragon mr-2"></i>
              Pokémon
            </button>
            <button
              onClick={() => { fetchPlayers(); playSound('click'); }}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all"
            >
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>

        {/* Players Grid */}
        <div className="max-w-6xl mx-auto">
          {displayPlayers.length === 0 ? (
            <div className="card text-center py-16">
              <i className="fas fa-user-slash text-6xl text-slate-600 mb-4"></i>
              <p className="text-xl text-slate-400">
                {filter === 'online' ? 'No hay jugadores online' : 'No hay jugadores registrados'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayPlayers.map((player) => (
                <div key={player.uuid} className="card hover:border-poke-green transition-all">
                  {/* Player Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={`https://mc-heads.net/avatar/${player.uuid}/48`}
                      alt={player.username}
                      className="w-12 h-12 rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-lg flex items-center gap-2">
                        {player.username}
                        {player.online && (
                          <span className="w-2 h-2 rounded-full bg-poke-green animate-pulse"></span>
                        )}
                      </div>
                      <div className="text-sm text-slate-400 capitalize">{player.world}</div>
                    </div>
                  </div>

                  {/* Coordinates */}
                  <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-sm">
                        <span className="text-red-400">X:</span> {Math.round(player.x)}
                        <span className="text-poke-green ml-3">Y:</span> {Math.round(player.y)}
                        <span className="text-poke-blue ml-3">Z:</span> {Math.round(player.z)}
                      </div>
                      <button
                        onClick={() => copyCoords(player)}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="Copiar coordenadas"
                      >
                        <i className="fas fa-copy"></i>
                      </button>
                    </div>
                  </div>

                  {/* Pokemon Party */}
                  {showPokemon && player.party.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs text-slate-400 mb-2">Equipo</div>
                      <div className="flex gap-1">
                        {player.party.slice(0, 6).map((pokemon, idx) => (
                          <div key={idx} className="relative bg-slate-800/50 rounded p-1" title={`${pokemon.species} Lv.${pokemon.level}`}>
                            <img
                              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.speciesId}.png`}
                              alt={pokemon.species}
                              className="w-8 h-8"
                            />
                            {pokemon.shiny && (
                              <i className="fas fa-star text-poke-yellow text-[8px] absolute top-0 right-0"></i>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <button
                    onClick={() => openBlueMap(player)}
                    className="w-full btn-secondary text-sm"
                  >
                    <i className="fas fa-map-marker-alt mr-2"></i>
                    Ver en Mapa 3D
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-400">
          <p>
            <i className="fas fa-info-circle mr-2"></i>
            Las posiciones se actualizan cada 30 segundos
          </p>
        </div>
      </div>
    </div>
  );
}
