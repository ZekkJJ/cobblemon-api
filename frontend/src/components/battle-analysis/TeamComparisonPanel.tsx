'use client';

import { useState, useMemo } from 'react';
import { getTypeColor, getIVColor, getIVPercentage } from '@/lib/pokemon-type-colors';
import { getTypeIcon, calculateTypeEffectiveness } from '@/lib/type-effectiveness';
import { PokemonTooltip } from './PokemonTooltip';

interface Stats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

interface Pokemon {
  species: string;
  level: number;
  nature: string;
  ability: string;
  moves: string[];
  ivs: Stats;
  evs?: Stats;
  heldItem?: string;
  shiny?: boolean;
  types?: string[];
  fainted?: boolean;
}

interface PlayerData {
  username: string;
  uuid?: string;
  team: Pokemon[];
  isWinner: boolean;
}

interface TeamComparisonPanelProps {
  player1: PlayerData;
  player2: PlayerData;
}

function getPokemonSpriteUrl(species: string): string {
  const normalized = species.toLowerCase().replace(/[^a-z0-9-]/g, '');
  return `https://img.pokemondb.net/sprites/home/normal/${normalized}.png`;
}

// Type badge component
function TypeBadge({ type }: { type: string }) {
  return (
    <span 
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
      style={{ backgroundColor: getTypeColor(type) }}
    >
      {getTypeIcon(type)}
    </span>
  );
}

function PokemonCard({ pokemon, isWinner, showWeaknesses = false }: { pokemon: Pokemon; isWinner: boolean; showWeaknesses?: boolean }) {
  const [imageError, setImageError] = useState(false);
  const ivPercentage = getIVPercentage(pokemon.ivs);
  const types = pokemon.types || ['normal'];
  const primaryType = types[0];
  const typeColor = getTypeColor(primaryType);
  
  const spriteUrl = imageError 
    ? '/pokeballs/Poke Ball_model.png'
    : getPokemonSpriteUrl(pokemon.species);

  // Calculate weaknesses
  const weaknesses = useMemo(() => {
    const eff = calculateTypeEffectiveness(types);
    return [...eff.weaknesses4x, ...eff.weaknesses2x].slice(0, 3);
  }, [types]);

  return (
    <PokemonTooltip pokemon={pokemon}>
      <div 
        className={`
          relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 border rounded-xl p-3 
          cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg
          ${pokemon.fainted 
            ? 'opacity-60 border-red-500/50 grayscale' 
            : 'border-gray-700 hover:border-gray-500'
          }
        `}
        style={{ borderLeftColor: typeColor, borderLeftWidth: '4px' }}
      >
        {/* Status badges */}
        <div className="absolute top-2 right-2 flex gap-1">
          {pokemon.fainted && (
            <span className="bg-red-500/20 text-red-400 text-xs px-1.5 py-0.5 rounded">💀 KO</span>
          )}
          {pokemon.shiny && (
            <span className="bg-yellow-500/20 text-yellow-400 text-xs px-1.5 py-0.5 rounded">✨</span>
          )}
        </div>
        
        <div className="flex items-start gap-3">
          {/* Sprite */}
          <div className="w-14 h-14 bg-gray-900/50 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-700">
            <img 
              src={spriteUrl}
              alt={pokemon.species}
              className="w-12 h-12 object-contain"
              onError={() => setImageError(true)}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Name and level */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-white truncate">{pokemon.species}</span>
              <span className="text-gray-500 text-xs bg-gray-800 px-1.5 py-0.5 rounded">
                Lv.{pokemon.level}
              </span>
            </div>
            
            {/* Types */}
            <div className="flex gap-1 mb-1.5">
              {types.map(type => (
                <TypeBadge key={type} type={type} />
              ))}
            </div>
            
            {/* Nature & Ability */}
            <div className="text-xs text-gray-400 truncate">
              {pokemon.nature} • <span className="text-cyan-400">{pokemon.ability}</span>
            </div>
          </div>
        </div>
        
        {/* IV Bar */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-gray-500">IVs</span>
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all"
              style={{ 
                width: `${ivPercentage}%`,
                backgroundColor: getIVColor(Math.round(ivPercentage * 0.31))
              }}
            />
          </div>
          <span className="text-xs font-medium" style={{ color: getIVColor(Math.round(ivPercentage * 0.31)) }}>
            {ivPercentage}%
          </span>
        </div>
        
        {/* Moves */}
        <div className="mt-2 grid grid-cols-2 gap-1">
          {pokemon.moves.slice(0, 4).map((move, i) => (
            <span 
              key={i}
              className="text-[10px] bg-gray-800 rounded px-2 py-1 text-gray-300 truncate text-center"
            >
              {move}
            </span>
          ))}
        </div>
        
        {/* Held Item */}
        {pokemon.heldItem && (
          <div className="mt-2 flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/10 rounded px-2 py-1">
            <span>📦</span>
            <span className="truncate">{pokemon.heldItem}</span>
          </div>
        )}
        
        {/* Weaknesses (optional) */}
        {showWeaknesses && weaknesses.length > 0 && (
          <div className="mt-2 flex items-center gap-1">
            <span className="text-[10px] text-red-400">Débil:</span>
            {weaknesses.map(w => (
              <TypeBadge key={w} type={w} />
            ))}
          </div>
        )}
      </div>
    </PokemonTooltip>
  );
}

// Team stats summary
function TeamStats({ team, isWinner }: { team: Pokemon[]; isWinner: boolean }) {
  const stats = useMemo(() => {
    const avgLevel = Math.round(team.reduce((sum, p) => sum + p.level, 0) / team.length);
    const avgIV = Math.round(team.reduce((sum, p) => sum + getIVPercentage(p.ivs), 0) / team.length);
    const faintedCount = team.filter(p => p.fainted).length;
    const shinyCount = team.filter(p => p.shiny).length;
    
    // Collect all types
    const types = new Set<string>();
    team.forEach(p => p.types?.forEach(t => types.add(t)));
    
    return { avgLevel, avgIV, faintedCount, shinyCount, typeCount: types.size };
  }, [team]);
  
  return (
    <div className="flex items-center gap-2 flex-wrap text-xs">
      <span className="bg-gray-800 px-2 py-1 rounded text-gray-300">
        Avg Lv.{stats.avgLevel}
      </span>
      <span className="bg-gray-800 px-2 py-1 rounded" style={{ color: getIVColor(Math.round(stats.avgIV * 0.31)) }}>
        {stats.avgIV}% IVs
      </span>
      <span className="bg-gray-800 px-2 py-1 rounded text-purple-400">
        {stats.typeCount} tipos
      </span>
      {stats.faintedCount > 0 && (
        <span className="bg-red-500/20 px-2 py-1 rounded text-red-400">
          💀 {stats.faintedCount} KO
        </span>
      )}
      {stats.shinyCount > 0 && (
        <span className="bg-yellow-500/20 px-2 py-1 rounded text-yellow-400">
          ✨ {stats.shinyCount}
        </span>
      )}
    </div>
  );
}

export function TeamComparisonPanel({ player1, player2 }: TeamComparisonPanelProps) {
  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700 p-4">
        <h3 className="text-lg font-bold text-white text-center flex items-center justify-center gap-2">
          <span className="text-2xl">⚔️</span>
          Comparación de Equipos
        </h3>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Player 1 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                player1.isWinner 
                  ? 'bg-gradient-to-br from-yellow-500 to-amber-600' 
                  : 'bg-gradient-to-br from-gray-600 to-gray-700'
              }`}>
                {player1.isWinner ? '👑' : '👤'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-lg ${player1.isWinner ? 'text-green-400' : 'text-white'}`}>
                    {player1.username}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    player1.isWinner 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {player1.isWinner ? '🏆 Victoria' : 'Derrota'}
                  </span>
                </div>
                <TeamStats team={player1.team} isWinner={player1.isWinner} />
              </div>
            </div>
            
            <div className="space-y-2">
              {player1.team.map((pokemon, i) => (
                <PokemonCard key={i} pokemon={pokemon} isWinner={player1.isWinner} />
              ))}
            </div>
          </div>
          
          {/* VS Divider (visible on large screens) */}
          <div className="hidden lg:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <span className="text-purple-400 font-bold">VS</span>
            </div>
          </div>
          
          {/* Player 2 */}
          <div>
            <div className="flex items-center gap-3 mb-4 lg:flex-row-reverse lg:text-right">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                player2.isWinner 
                  ? 'bg-gradient-to-br from-yellow-500 to-amber-600' 
                  : 'bg-gradient-to-br from-gray-600 to-gray-700'
              }`}>
                {player2.isWinner ? '👑' : '👤'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 lg:justify-end">
                  <span className={`font-bold text-lg ${player2.isWinner ? 'text-green-400' : 'text-white'}`}>
                    {player2.username}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    player2.isWinner 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {player2.isWinner ? '🏆 Victoria' : 'Derrota'}
                  </span>
                </div>
                <div className="lg:flex lg:justify-end">
                  <TeamStats team={player2.team} isWinner={player2.isWinner} />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              {player2.team.map((pokemon, i) => (
                <PokemonCard key={i} pokemon={pokemon} isWinner={player2.isWinner} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeamComparisonPanel;
