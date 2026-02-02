'use client';

import { useState, useMemo } from 'react';
import { getTypeColor, getIVColor, getIVPercentage, TYPE_COLORS } from '@/lib/pokemon-type-colors';
import { 
  calculateTypeEffectiveness, 
  getCounterSuggestions, 
  getTypeIcon,
  getNatureEffect,
  TypeEffectiveness 
} from '@/lib/type-effectiveness';

interface Stats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

interface PokemonData {
  species: string;
  level: number;
  nature: string;
  ability: string;
  ivs: Stats;
  evs?: Stats;
  moves: string[];
  heldItem?: string;
  shiny?: boolean;
  types?: string[];
}

interface PokemonTooltipProps {
  pokemon: PokemonData;
  children: React.ReactNode;
  showCounters?: boolean;
}

const STAT_LABELS = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'];

function getStatValue(stats: Stats, index: number): number {
  const keys: (keyof Stats)[] = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'];
  return stats[keys[index]];
}

function getPokemonSpriteUrl(species: string): string {
  const normalized = species.toLowerCase().replace(/[^a-z0-9-]/g, '');
  return `https://img.pokemondb.net/sprites/home/normal/${normalized}.png`;
}

// Type badge component
function TypeBadge({ type, size = 'sm' }: { type: string; size?: 'sm' | 'xs' }) {
  const color = getTypeColor(type);
  const icon = getTypeIcon(type);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-1.5 py-0.5 text-[10px]';
  
  return (
    <span 
      className={`inline-flex items-center gap-1 rounded font-medium text-white ${sizeClasses}`}
      style={{ backgroundColor: color }}
    >
      <span>{icon}</span>
      <span className="capitalize">{type}</span>
    </span>
  );
}

// Weakness/Resistance display
function TypeEffectivenessDisplay({ effectiveness }: { effectiveness: TypeEffectiveness }) {
  const hasWeaknesses = effectiveness.weaknesses4x.length > 0 || effectiveness.weaknesses2x.length > 0;
  const hasResistances = effectiveness.resistances4x.length > 0 || effectiveness.resistances2x.length > 0;
  
  return (
    <div className="space-y-2">
      {/* Weaknesses */}
      {hasWeaknesses && (
        <div>
          <div className="text-[10px] text-red-400 font-medium mb-1">⚠️ Débil a:</div>
          <div className="flex flex-wrap gap-1">
            {effectiveness.weaknesses4x.map(type => (
              <span key={type} className="relative">
                <TypeBadge type={type} size="xs" />
                <span className="absolute -top-1 -right-1 text-[8px] bg-red-600 text-white rounded px-0.5">4x</span>
              </span>
            ))}
            {effectiveness.weaknesses2x.map(type => (
              <TypeBadge key={type} type={type} size="xs" />
            ))}
          </div>
        </div>
      )}
      
      {/* Resistances */}
      {hasResistances && (
        <div>
          <div className="text-[10px] text-green-400 font-medium mb-1">🛡️ Resiste:</div>
          <div className="flex flex-wrap gap-1">
            {effectiveness.resistances4x.map(type => (
              <span key={type} className="relative">
                <TypeBadge type={type} size="xs" />
                <span className="absolute -top-1 -right-1 text-[8px] bg-green-600 text-white rounded px-0.5">¼x</span>
              </span>
            ))}
            {effectiveness.resistances2x.map(type => (
              <TypeBadge key={type} type={type} size="xs" />
            ))}
          </div>
        </div>
      )}
      
      {/* Immunities */}
      {effectiveness.immunities.length > 0 && (
        <div>
          <div className="text-[10px] text-blue-400 font-medium mb-1">🚫 Inmune a:</div>
          <div className="flex flex-wrap gap-1">
            {effectiveness.immunities.map(type => (
              <TypeBadge key={type} type={type} size="xs" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PokemonTooltip({ pokemon, children, showCounters = true }: PokemonTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'matchup' | 'counters'>('stats');
  
  const ivPercentage = getIVPercentage(pokemon.ivs);
  const types = pokemon.types || ['normal'];
  const primaryType = types[0];
  const typeColor = getTypeColor(primaryType);
  
  const spriteUrl = imageError 
    ? '/pokeballs/Poke Ball_model.png'
    : getPokemonSpriteUrl(pokemon.species);

  // Calculate type effectiveness
  const effectiveness = useMemo(() => calculateTypeEffectiveness(types), [types]);
  
  // Get counter suggestions
  const counters = useMemo(() => getCounterSuggestions(types), [types]);
  
  // Nature effect
  const natureEffect = getNatureEffect(pokemon.nature);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={() => setIsOpen(!isOpen)}
    >
      {children}
      
      {isOpen && (
        <div 
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
          style={{ borderTopColor: typeColor, borderTopWidth: '3px' }}
        >
          {/* Header with sprite and basic info */}
          <div className="p-3 bg-gradient-to-r from-gray-800 to-gray-900">
            <div className="flex items-start gap-3">
              <div className="relative w-16 h-16 bg-gray-800/50 rounded-lg flex items-center justify-center border border-gray-700">
                <img 
                  src={spriteUrl}
                  alt={pokemon.species}
                  className="w-14 h-14 object-contain"
                  onError={() => setImageError(true)}
                />
                {pokemon.shiny && (
                  <span className="absolute -top-1 -right-1 text-yellow-400 text-lg">✨</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-lg">{pokemon.species}</span>
                  <span className="text-gray-400 text-sm">Lv.{pokemon.level}</span>
                </div>
                
                {/* Types */}
                <div className="flex gap-1 mt-1">
                  {types.map(type => (
                    <TypeBadge key={type} type={type} />
                  ))}
                </div>
                
                {/* Nature & Ability */}
                <div className="text-xs text-gray-400 mt-1.5 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400">{pokemon.nature}</span>
                    <span className="text-gray-600">({natureEffect})</span>
                  </div>
                  <div className="text-cyan-400">{pokemon.ability}</div>
                </div>
              </div>
            </div>
            
            {/* Held Item */}
            {pokemon.heldItem && (
              <div className="mt-2 flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/10 rounded px-2 py-1">
                <span>📦</span>
                <span>{pokemon.heldItem}</span>
              </div>
            )}
          </div>
          
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700">
            {(['stats', 'matchup', 'counters'] as const).map(tab => (
              <button
                key={tab}
                onClick={(e) => { e.stopPropagation(); setActiveTab(tab); }}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                  activeTab === tab 
                    ? 'text-purple-400 bg-purple-500/10 border-b-2 border-purple-500' 
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                }`}
              >
                {tab === 'stats' && '📊 Stats'}
                {tab === 'matchup' && '⚔️ Matchup'}
                {tab === 'counters' && '🎯 Counters'}
              </button>
            ))}
          </div>
          
          {/* Tab Content */}
          <div className="p-3">
            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-3">
                {/* IV Bars */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-400">IVs</span>
                    <span className="text-xs font-bold" style={{ color: getIVColor(Math.round(ivPercentage * 0.31)) }}>
                      {ivPercentage}% Perfect
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {STAT_LABELS.map((label, i) => {
                      const value = getStatValue(pokemon.ivs, i);
                      return (
                        <div key={label} className="text-center">
                          <div className="text-[10px] text-gray-500 font-medium">{label}</div>
                          <div 
                            className="h-2 rounded-full bg-gray-700 overflow-hidden mt-0.5"
                            title={`${label}: ${value}/31`}
                          >
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${(value / 31) * 100}%`,
                                backgroundColor: getIVColor(value)
                              }}
                            />
                          </div>
                          <div className="text-[10px] font-bold mt-0.5" style={{ color: getIVColor(value) }}>
                            {value}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* EVs if available */}
                {pokemon.evs && (
                  <div>
                    <div className="text-xs text-gray-400 mb-1.5">EVs</div>
                    <div className="grid grid-cols-6 gap-1.5">
                      {STAT_LABELS.map((label, i) => {
                        const value = getStatValue(pokemon.evs!, i);
                        if (value === 0) return (
                          <div key={label} className="text-center">
                            <div className="text-[10px] text-gray-600">{label}</div>
                            <div className="text-[10px] text-gray-600">-</div>
                          </div>
                        );
                        return (
                          <div key={label} className="text-center">
                            <div className="text-[10px] text-gray-500">{label}</div>
                            <div className="text-[10px] font-bold text-blue-400">{value}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Moves */}
                <div>
                  <div className="text-xs text-gray-400 mb-1.5">Movimientos</div>
                  <div className="grid grid-cols-2 gap-1">
                    {pokemon.moves.slice(0, 4).map((move, i) => (
                      <div 
                        key={i}
                        className="text-xs bg-gray-800 rounded px-2 py-1.5 truncate text-gray-300 border border-gray-700"
                      >
                        {move}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Matchup Tab */}
            {activeTab === 'matchup' && (
              <TypeEffectivenessDisplay effectiveness={effectiveness} />
            )}
            
            {/* Counters Tab */}
            {activeTab === 'counters' && showCounters && (
              <div className="space-y-2">
                <div className="text-[10px] text-gray-400 mb-2">
                  Pokémon recomendados para contrarrestar:
                </div>
                {counters.length > 0 ? (
                  counters.slice(0, 3).map(({ type, pokemon: counterPokemon }) => (
                    <div key={type} className="flex items-center gap-2 bg-gray-800/50 rounded p-2">
                      <TypeBadge type={type} size="xs" />
                      <div className="flex-1 text-xs text-gray-300">
                        {counterPokemon.join(', ')}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-500 text-center py-2">
                    Sin counters específicos
                  </div>
                )}
                <div className="text-[10px] text-gray-500 mt-2 italic">
                  💡 Usa ataques de estos tipos para máximo daño
                </div>
              </div>
            )}
          </div>
          
          {/* Arrow */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

export default PokemonTooltip;
