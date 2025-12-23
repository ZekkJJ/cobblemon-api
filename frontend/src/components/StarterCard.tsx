'use client';

import { Starter } from '@/src/lib/types/pokemon';

interface StarterCardProps {
  starter: Starter;
  isShiny: boolean;
  size?: 'normal' | 'full';
}

// Colores de tipos de Pokémon
const TYPE_COLORS: Record<string, string> = {
  grass: 'bg-type-grass',
  fire: 'bg-type-fire',
  water: 'bg-type-water',
  electric: 'bg-type-electric',
  psychic: 'bg-type-psychic',
  normal: 'bg-type-normal',
  fighting: 'bg-type-fighting',
  flying: 'bg-type-flying',
  poison: 'bg-type-poison',
  ground: 'bg-type-ground',
  rock: 'bg-type-rock',
  bug: 'bg-type-bug',
  ghost: 'bg-type-ghost',
  steel: 'bg-type-steel',
  dragon: 'bg-type-dragon',
  dark: 'bg-type-dark',
  fairy: 'bg-type-fairy',
  ice: 'bg-type-ice',
};

export default function StarterCard({ starter, isShiny, size = 'normal' }: StarterCardProps) {
  // Asegurar que siempre tengamos una URL de sprite válida
  const spriteUrl = isShiny
    ? (starter.sprites?.shinyAnimated || starter.sprites?.shiny || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${starter.pokemonId}.png`)
    : (starter.sprites?.spriteAnimated || starter.sprites?.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${starter.pokemonId}.png`);

  const isFull = size === 'full';

  // Validar que tengamos los datos necesarios
  if (!starter || !starter.pokemonId) {
    console.error('[StarterCard] Invalid starter data:', starter);
    return (
      <div className="card max-w-md mx-auto text-center py-8">
        <i className="fas fa-exclamation-triangle text-4xl text-poke-red mb-4"></i>
        <p className="text-slate-400">Error al cargar los datos del Pokémon</p>
      </div>
    );
  }

  console.log('[StarterCard] Rendering starter:', starter.nameEs, 'Sprite URL:', spriteUrl);

  // Calcular total de stats
  const totalStats = Object.values(starter.stats || {}).reduce((sum, stat) => sum + stat, 0);
  const maxStat = Math.max(...Object.values(starter.stats || {}));

  return (
    <div
      className={`card ${isShiny ? 'border-2 border-poke-yellow glow-yellow' : ''} ${isFull ? 'max-w-4xl' : 'max-w-md'
        } mx-auto`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className={`font-bold ${isFull ? 'text-3xl' : 'text-2xl'} flex items-center gap-2`}>
            {starter.nameEs}
            {isShiny && <span className="text-poke-yellow">✨</span>}
          </h2>
          <p className="text-slate-400 text-sm">#{starter.pokemonId.toString().padStart(3, '0')}</p>
        </div>
        <div className="flex gap-2">
          {(starter.types || []).map((type) => (
            <span
              key={type}
              className={`type-badge ${TYPE_COLORS[type.toLowerCase()] || 'bg-slate-600'}`}
            >
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* Sprite */}
      <div className="flex justify-center mb-6">
        <div className={`relative ${isFull ? 'w-48 h-48' : 'w-32 h-32'}`}>
          <img
            src={spriteUrl}
            alt={starter.nameEs}
            className="w-full h-full object-contain pixelated"
            loading="lazy"
          />
          {isShiny && (
            <div className="absolute inset-0 bg-gradient-to-t from-poke-yellow/20 to-transparent rounded-lg animate-pulse"></div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-300 mb-4 text-center italic">
        {starter.description}
      </p>

      {/* Stats */}
      <div className="mb-4">
        <h3 className="font-bold text-lg mb-2">Estadísticas</h3>
        <div className="space-y-2">
          {Object.entries(starter.stats || {}).map(([statName, value]) => {
            const percentage = (value / maxStat) * 100;
            const statLabel = {
              hp: 'HP',
              attack: 'Ataque',
              defense: 'Defensa',
              spAttack: 'At. Esp.',
              spDefense: 'Def. Esp.',
              speed: 'Velocidad',
            }[statName] || statName;

            return (
              <div key={statName}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{statLabel}</span>
                  <span className="font-bold">{value}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-poke-red to-poke-yellow h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-sm text-slate-400 mt-2 text-right">
          Total: {totalStats}
        </div>
      </div>

      {/* Abilities */}
      <div className="mb-4">
        <h3 className="font-bold text-lg mb-2">Habilidades</h3>
        <div className="space-y-2">
          {(starter.abilities || []).map((ability, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg ${ability.isHidden ? 'bg-poke-purple/20 border border-poke-purple' : 'bg-slate-800'
                }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold">{ability.name}</span>
                {ability.isHidden && (
                  <span className="text-xs bg-poke-purple px-2 py-0.5 rounded-full">Oculta</span>
                )}
              </div>
              <p className="text-sm text-slate-400">{ability.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Signature Moves */}
      {isFull && (starter.signatureMoves || []).length > 0 && (
        <div className="mb-4">
          <h3 className="font-bold text-lg mb-2">Movimientos Característicos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(starter.signatureMoves || []).map((move, index) => (
              <div key={index} className="p-2 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{move.name}</span>
                  <span
                    className={`type-badge text-xs ${TYPE_COLORS[move.type.toLowerCase()] || 'bg-slate-600'
                      }`}
                  >
                    {move.type}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-slate-400 mt-1">
                  <span>Poder: {move.power}</span>
                  <span>Precisión: {move.accuracy}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evolution Chain */}
      {isFull && (starter.evolutions || []).length > 0 && (
        <div className="mb-4">
          <h3 className="font-bold text-lg mb-2">Cadena Evolutiva</h3>
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex items-center gap-2 flex-nowrap">
              <span className="font-bold">{starter.nameEs}</span>
              {(starter.evolutions || []).map((evo, index) => (
                <div key={index} className="flex items-center gap-2">
                  <i className="fas fa-arrow-right text-poke-blue"></i>
                  <div className="text-center">
                    <div className="font-bold">{evo.name}</div>
                    <div className="text-xs text-slate-400">
                      {evo.level ? `Nv. ${evo.level}` : evo.method}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Physical Info */}
      {isFull && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-2 bg-slate-800 rounded-lg">
            <div className="text-slate-400">Altura</div>
            <div className="font-bold">{starter.height} m</div>
          </div>
          <div className="text-center p-2 bg-slate-800 rounded-lg">
            <div className="text-slate-400">Peso</div>
            <div className="font-bold">{starter.weight} kg</div>
          </div>
        </div>
      )}
    </div>
  );
}
