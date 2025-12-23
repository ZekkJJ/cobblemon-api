'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { playersAPI } from '@/src/lib/api-client';
import { Pokemon } from '@/src/lib/types/pokemon';

interface PlayerData {
  uuid: string;
  username: string;
  balance: number;
  totalPokemon: number;
  shinies: number;
  starter?: {
    id: number;
    name: string;
    isShiny: boolean;
  };
  party: Pokemon[];
  pc: Pokemon[][];
}

type Tab = 'party' | 'pc' | 'stats';

export default function PlayerProfilePage() {
  const params = useParams();
  const uuid = params.uuid as string;
  
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('party');

  useEffect(() => {
    if (uuid) {
      fetchPlayerData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  const fetchPlayerData = async () => {
    try {
      setLoading(true);
      const data = await playersAPI.getByUuid(uuid);
      setPlayer(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el perfil del jugador');
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

  const getTypeColor = (type: string) => {
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
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-poke-red border-t-transparent mb-4"></div>
          <p className="text-xl">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md text-center">
          <i className="fas fa-exclamation-triangle text-6xl text-poke-red mb-4"></i>
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-slate-300 mb-6">{error || 'Jugador no encontrado'}</p>
          <Link href="/jugadores" className="btn-primary">
            <i className="fas fa-arrow-left mr-2"></i>
            Volver a Jugadores
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Link
          href="/jugadores"
          className="inline-flex items-center text-poke-blue hover:text-poke-blue/80 mb-6"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Volver a Jugadores
        </Link>

        {/* Player Header */}
        <div className="card mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-poke-red to-poke-yellow flex items-center justify-center text-4xl font-bold">
                {player?.username?.charAt(0).toUpperCase() || '?'}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold mb-2">{player?.username || 'Cargando...'}</h1>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2">
                  <i className="fas fa-coins text-poke-yellow"></i>
                  <span>{player?.balance?.toLocaleString() || 0} CobbleDollars</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-paw text-poke-blue"></i>
                  <span>{player?.totalPokemon || 0} Pokémon</span>
                </div>
                {player?.shinies > 0 && (
                  <div className="flex items-center gap-2">
                    <i className="fas fa-star text-poke-yellow"></i>
                    <span>{player.shinies} Shinies</span>
                  </div>
                )}
              </div>

              {/* Starter Badge */}
              {player.starter && (
                <div className="mt-4 inline-flex items-center gap-3 bg-poke-purple/20 border border-poke-purple rounded-lg px-4 py-2">
                  <i className="fas fa-certificate text-poke-purple"></i>
                  <span className="text-sm">
                    Starter del Gacha: <strong>{player.starter.name}</strong>
                    {player.starter.isShiny && ' ✨'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('party')}
            className={`px-6 py-3 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeTab === 'party'
                ? 'bg-poke-red text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <i className="fas fa-users mr-2"></i>
            Equipo ({player?.party?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('pc')}
            className={`px-6 py-3 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeTab === 'pc'
                ? 'bg-poke-red text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <i className="fas fa-box mr-2"></i>
            PC ({player?.pc?.flat().length || 0})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-poke-red text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <i className="fas fa-chart-bar mr-2"></i>
            Estadísticas
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'party' && (
          <div>
            {player.party.length === 0 ? (
              <div className="card text-center py-12">
                <i className="fas fa-inbox text-6xl text-slate-600 mb-4"></i>
                <p className="text-slate-400">No hay Pokémon en el equipo</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {player.party.map((pokemon, index) => (
                  <PokemonCard key={index} pokemon={pokemon} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pc' && (
          <div>
            {player.pc.flat().length === 0 ? (
              <div className="card text-center py-12">
                <i className="fas fa-inbox text-6xl text-slate-600 mb-4"></i>
                <p className="text-slate-400">No hay Pokémon en el PC</p>
              </div>
            ) : (
              <div className="space-y-8">
                {player.pc.slice(0, 2).map((box, boxIndex) => (
                  <div key={boxIndex}>
                    <h3 className="text-2xl font-bold mb-4">
                      <i className="fas fa-box mr-2 text-poke-blue"></i>
                      Caja {boxIndex + 1}
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-2">
                      {box.map((pokemon, index) => (
                        <div
                          key={index}
                          className={`card p-2 text-center hover:scale-105 transition-transform ${
                            pokemon.shiny ? 'ring-2 ring-poke-yellow' : ''
                          }`}
                          title={`${pokemon.species} Lv.${pokemon.level}`}
                        >
                          <img
                            src={getPokemonSprite(pokemon.speciesId, pokemon.shiny)}
                            alt={pokemon.species}
                            className="w-full h-auto"
                            loading="lazy"
                          />
                          <div className="text-xs mt-1 truncate">{pokemon.species}</div>
                          <div className="text-xs text-slate-400">Lv.{pokemon.level}</div>
                          {pokemon.shiny && <div className="text-xs">✨</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card text-center">
              <i className="fas fa-coins text-5xl text-poke-yellow mb-4"></i>
              <div className="text-3xl font-bold mb-2">{player.balance.toLocaleString()}</div>
              <div className="text-slate-400">CobbleDollars</div>
            </div>
            <div className="card text-center">
              <i className="fas fa-paw text-5xl text-poke-blue mb-4"></i>
              <div className="text-3xl font-bold mb-2">{player.totalPokemon}</div>
              <div className="text-slate-400">Pokémon Totales</div>
            </div>
            <div className="card text-center">
              <i className="fas fa-star text-5xl text-poke-yellow mb-4"></i>
              <div className="text-3xl font-bold mb-2">{player.shinies}</div>
              <div className="text-slate-400">Shinies</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Pokemon Card Component
function PokemonCard({ pokemon }: { pokemon: Pokemon }) {
  const getPokemonSprite = (speciesId: number, shiny: boolean) => {
    if (speciesId <= 0) return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';
    return shiny
      ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${speciesId}.png`
      : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${speciesId}.png`;
  };

  return (
    <div className={`card ${pokemon.shiny ? 'ring-2 ring-poke-yellow' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold">{pokemon.species}</h3>
          <div className="text-sm text-slate-400">Nivel {pokemon.level}</div>
        </div>
        {pokemon.shiny && (
          <div className="text-2xl">✨</div>
        )}
      </div>

      {/* Sprite */}
      <div className="flex justify-center mb-4">
        <img
          src={getPokemonSprite(pokemon.speciesId, pokemon.shiny)}
          alt={pokemon.species}
          className="w-24 h-24"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Naturaleza:</span>
          <span className="font-bold">{pokemon.nature}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Habilidad:</span>
          <span className="font-bold">{pokemon.ability}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Género:</span>
          <span className="font-bold">{pokemon.gender}</span>
        </div>
        {pokemon.heldItem && (
          <div className="flex justify-between">
            <span className="text-slate-400">Objeto:</span>
            <span className="font-bold">{pokemon.heldItem}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="text-xs font-bold mb-2 text-slate-400">IVs</div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>HP: {pokemon.ivs.hp}</div>
          <div>ATK: {pokemon.ivs.attack}</div>
          <div>DEF: {pokemon.ivs.defense}</div>
          <div>SPA: {pokemon.ivs.spAttack}</div>
          <div>SPD: {pokemon.ivs.spDefense}</div>
          <div>SPE: {pokemon.ivs.speed}</div>
        </div>
      </div>

      {/* Moves */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="text-xs font-bold mb-2 text-slate-400">Movimientos</div>
        <div className="flex flex-wrap gap-1">
          {pokemon.moves.map((move, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-slate-700 rounded text-xs"
            >
              {move}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
