'use client';

import { useMemo, useState } from 'react';
import { parseAnalysisSections, extractScore, AnalysisSection } from '@/lib/analysis-parser';
import { ColoredText } from './ColoredText';
import { calculateTypeEffectiveness, getTypeIcon } from '@/lib/type-effectiveness';
import { getTypeColor } from '@/lib/pokemon-type-colors';

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

interface BattleData {
  winner?: { team?: Pokemon[]; username?: string };
  loser?: { team?: Pokemon[]; username?: string };
  totalTurns?: number;
  duration?: number;
}

interface FormattedAnalysisProps {
  analysisText: string;
  battleData?: BattleData;
}

// Animated star rating
function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => (
          <span 
            key={i} 
            className={`text-xl transition-all duration-300 ${
              i < score 
                ? 'text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]' 
                : 'text-gray-700'
            }`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {i < score ? '★' : '☆'}
          </span>
        ))}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white">{score}</span>
        <span className="text-gray-400">/10</span>
      </div>
      <span className={`text-sm px-2 py-0.5 rounded ${
        score >= 8 ? 'bg-green-500/20 text-green-400' :
        score >= 5 ? 'bg-yellow-500/20 text-yellow-400' :
        'bg-red-500/20 text-red-400'
      }`}>
        {score >= 8 ? '¡Excelente!' : score >= 5 ? 'Puede mejorar' : 'Necesita práctica'}
      </span>
    </div>
  );
}

// Battle stats bar
function BattleStatsBar({ battleData }: { battleData?: BattleData }) {
  if (!battleData) return null;
  
  const { totalTurns, duration } = battleData;
  
  return (
    <div className="flex items-center gap-4 text-sm">
      {totalTurns && totalTurns > 0 && (
        <div className="flex items-center gap-1.5 bg-gray-800 rounded-full px-3 py-1">
          <span className="text-purple-400">🔄</span>
          <span className="text-gray-300">{totalTurns} turnos</span>
        </div>
      )}
      {duration && duration > 0 && (
        <div className="flex items-center gap-1.5 bg-gray-800 rounded-full px-3 py-1">
          <span className="text-blue-400">⏱️</span>
          <span className="text-gray-300">{Math.floor(duration / 60000)}m {Math.floor((duration % 60000) / 1000)}s</span>
        </div>
      )}
    </div>
  );
}

// Type badge mini
function TypeBadgeMini({ type }: { type: string }) {
  return (
    <span 
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
      style={{ backgroundColor: getTypeColor(type) }}
    >
      {getTypeIcon(type)} {type}
    </span>
  );
}

// Type matchup analysis
function TypeMatchupCard({ winnerTeam, loserTeam }: { winnerTeam: Pokemon[]; loserTeam: Pokemon[] }) {
  const analysis = useMemo(() => {
    const winnerTypes = new Set<string>();
    const loserWeaknesses: { pokemon: string; type: string; multiplier: string }[] = [];
    
    winnerTeam.forEach(p => p.types?.forEach(t => winnerTypes.add(t.toLowerCase())));
    
    loserTeam.forEach(pokemon => {
      if (!pokemon.types) return;
      const eff = calculateTypeEffectiveness(pokemon.types);
      
      eff.weaknesses4x.forEach(w => {
        if (winnerTypes.has(w)) {
          loserWeaknesses.push({ pokemon: pokemon.species, type: w, multiplier: '4x' });
        }
      });
      eff.weaknesses2x.forEach(w => {
        if (winnerTypes.has(w) && loserWeaknesses.length < 5) {
          loserWeaknesses.push({ pokemon: pokemon.species, type: w, multiplier: '2x' });
        }
      });
    });
    
    return loserWeaknesses.slice(0, 4);
  }, [winnerTeam, loserTeam]);
  
  if (analysis.length === 0) return null;
  
  return (
    <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">⚔️</span>
        <h4 className="font-bold text-white">Análisis de Tipos</h4>
      </div>
      <div className="space-y-2">
        {analysis.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
              item.multiplier === '4x' ? 'bg-red-500/30 text-red-300' : 'bg-orange-500/30 text-orange-300'
            }`}>
              {item.multiplier}
            </span>
            <span className="text-gray-300">{item.pokemon}</span>
            <span className="text-gray-500">débil a</span>
            <TypeBadgeMini type={item.type} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Section card component
function SectionCard({ 
  title, 
  icon, 
  children, 
  variant = 'default',
  collapsible = false,
  defaultOpen = true
}: { 
  title: string; 
  icon: string; 
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const variantStyles = {
    default: 'from-gray-800/50 to-gray-900/50 border-gray-700',
    success: 'from-green-900/30 to-emerald-900/30 border-green-500/30',
    warning: 'from-yellow-900/30 to-orange-900/30 border-yellow-500/30',
    error: 'from-red-900/30 to-rose-900/30 border-red-500/30',
    info: 'from-blue-900/30 to-cyan-900/30 border-blue-500/30',
  };
  
  const iconBgStyles = {
    default: 'bg-gray-700',
    success: 'bg-green-500/20',
    warning: 'bg-yellow-500/20',
    error: 'bg-red-500/20',
    info: 'bg-blue-500/20',
  };
  
  return (
    <div className={`bg-gradient-to-br ${variantStyles[variant]} border rounded-xl overflow-hidden`}>
      <button
        onClick={() => collapsible && setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 p-4 ${collapsible ? 'cursor-pointer hover:bg-white/5' : 'cursor-default'}`}
        disabled={!collapsible}
      >
        <div className={`w-10 h-10 rounded-lg ${iconBgStyles[variant]} flex items-center justify-center text-xl`}>
          {icon}
        </div>
        <h4 className="font-bold text-white flex-1 text-left">{title}</h4>
        {collapsible && (
          <span className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        )}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// Individual section renderer
function SectionRenderer({ section, pokemonData }: { section: AnalysisSection; pokemonData: Pokemon[] }) {
  switch (section.type) {
    case 'score':
      return null; // Handled separately in header
      
    case 'header':
      return (
        <h4 className="text-base font-semibold text-purple-300 mt-4 mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <ColoredText text={section.content} pokemonData={pokemonData} />
        </h4>
      );
    
    case 'list':
      return (
        <ul className="space-y-2 my-2">
          {section.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
              <span className="text-purple-400 mt-0.5">→</span>
              <span className="flex-1 leading-relaxed">
                <ColoredText text={item} pokemonData={pokemonData} />
              </span>
            </li>
          ))}
        </ul>
      );
    
    case 'tip':
      if (section.items && section.items.length > 0) {
        return (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 my-2">
            <ul className="space-y-1.5">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-green-200">
                  <span className="text-green-400">✓</span>
                  <ColoredText text={item} pokemonData={pokemonData} />
                </li>
              ))}
            </ul>
          </div>
        );
      }
      return (
        <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/20 rounded-lg p-3 my-2">
          <span className="text-green-400 text-lg">💡</span>
          <p className="text-green-200 text-sm flex-1">
            <ColoredText text={section.content} pokemonData={pokemonData} />
          </p>
        </div>
      );
    
    case 'error':
      if (section.items && section.items.length > 0) {
        return (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 my-2">
            <ul className="space-y-1.5">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-200">
                  <span className="text-red-400">✗</span>
                  <ColoredText text={item} pokemonData={pokemonData} />
                </li>
              ))}
            </ul>
          </div>
        );
      }
      return (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3 my-2">
          <span className="text-red-400 text-lg">⚠️</span>
          <p className="text-red-200 text-sm flex-1">
            <ColoredText text={section.content} pokemonData={pokemonData} />
          </p>
        </div>
      );
    
    case 'keyMoment':
      return (
        <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 my-2">
          <span className="text-yellow-400 text-lg">⚡</span>
          <p className="text-yellow-200 text-sm flex-1">
            <ColoredText text={section.content} pokemonData={pokemonData} />
          </p>
        </div>
      );
    
    case 'summary':
      return (
        <p className="text-gray-200 text-sm leading-relaxed bg-gray-800/50 rounded-lg p-3 my-2">
          <ColoredText text={section.content} pokemonData={pokemonData} />
        </p>
      );
    
    case 'paragraph':
    default:
      return (
        <p className="text-gray-300 text-sm leading-relaxed my-2">
          <ColoredText text={section.content} pokemonData={pokemonData} />
        </p>
      );
  }
}

// Group and organize sections
function organizeContent(sections: AnalysisSection[]) {
  const organized = {
    summary: [] as AnalysisSection[],
    keyMoments: [] as AnalysisSection[],
    errors: [] as AnalysisSection[],
    tips: [] as AnalysisSection[],
    other: [] as AnalysisSection[],
  };
  
  let currentContext: keyof typeof organized = 'other';
  
  for (const section of sections) {
    if (section.type === 'score') continue;
    
    if (section.type === 'summary' || 
        (section.type === 'header' && section.content.toLowerCase().includes('resumen'))) {
      currentContext = 'summary';
      if (section.type !== 'header') organized.summary.push(section);
    } else if (section.type === 'keyMoment' || 
               (section.type === 'header' && section.content.toLowerCase().includes('momento'))) {
      currentContext = 'keyMoments';
      if (section.type !== 'header') organized.keyMoments.push(section);
    } else if (section.type === 'error' || 
               (section.type === 'header' && (section.content.toLowerCase().includes('error') || 
                section.content.toLowerCase().includes('perdedor')))) {
      currentContext = 'errors';
      if (section.type !== 'header') organized.errors.push(section);
    } else if (section.type === 'tip' || 
               (section.type === 'header' && (section.content.toLowerCase().includes('consejo') ||
                section.content.toLowerCase().includes('mejora')))) {
      currentContext = 'tips';
      if (section.type !== 'header') organized.tips.push(section);
    } else if (section.type === 'header') {
      currentContext = 'other';
    } else {
      organized[currentContext].push(section);
    }
  }
  
  return organized;
}

export function FormattedAnalysis({ analysisText, battleData }: FormattedAnalysisProps) {
  const allPokemon = useMemo(() => {
    const pokemon: Pokemon[] = [];
    if (battleData?.winner?.team) pokemon.push(...battleData.winner.team);
    if (battleData?.loser?.team) pokemon.push(...battleData.loser.team);
    return pokemon;
  }, [battleData]);

  const sections = useMemo(() => parseAnalysisSections(analysisText), [analysisText]);
  const organized = useMemo(() => organizeContent(sections), [sections]);
  
  const overallScore = useMemo(() => {
    const sectionScore = sections.find(s => s.type === 'score')?.score;
    return sectionScore || extractScore(analysisText);
  }, [analysisText, sections]);

  const winnerTeam = battleData?.winner?.team || [];
  const loserTeam = battleData?.loser?.team || [];

  return (
    <div className="bg-gray-900/80 backdrop-blur border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/60 via-pink-900/40 to-purple-900/60 p-5 border-b border-gray-700">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
              <span className="text-2xl">🤖</span>
              Análisis IA de Batalla
            </h3>
            <BattleStatsBar battleData={battleData} />
          </div>
          {overallScore && (
            <div className="bg-gray-900/60 rounded-xl px-4 py-3">
              <StarRating score={overallScore} />
            </div>
          )}
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        {/* Type Matchup */}
        {winnerTeam.length > 0 && loserTeam.length > 0 && (
          <TypeMatchupCard winnerTeam={winnerTeam} loserTeam={loserTeam} />
        )}
        
        {/* Summary */}
        {organized.summary.length > 0 && (
          <SectionCard title="Resumen de la Batalla" icon="📋" variant="info">
            {organized.summary.map((s, i) => <SectionRenderer key={i} section={s} pokemonData={allPokemon} />)}
          </SectionCard>
        )}
        
        {/* Key Moments */}
        {organized.keyMoments.length > 0 && (
          <SectionCard title="Momentos Clave" icon="⚡" variant="warning">
            {organized.keyMoments.map((s, i) => <SectionRenderer key={i} section={s} pokemonData={allPokemon} />)}
          </SectionCard>
        )}
        
        {/* Errors */}
        {organized.errors.length > 0 && (
          <SectionCard title="Errores Identificados" icon="⚠️" variant="error">
            {organized.errors.map((s, i) => <SectionRenderer key={i} section={s} pokemonData={allPokemon} />)}
          </SectionCard>
        )}
        
        {/* Tips */}
        {organized.tips.length > 0 && (
          <SectionCard title="Consejos de Mejora" icon="💡" variant="success">
            {organized.tips.map((s, i) => <SectionRenderer key={i} section={s} pokemonData={allPokemon} />)}
          </SectionCard>
        )}
        
        {/* Other content */}
        {organized.other.length > 0 && (
          <SectionCard title="Análisis Adicional" icon="📝" variant="default" collapsible defaultOpen={false}>
            {organized.other.map((s, i) => <SectionRenderer key={i} section={s} pokemonData={allPokemon} />)}
          </SectionCard>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-800">
          <span>💡 Hover sobre nombres de Pokémon para ver detalles y counters</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Análisis por IA
          </span>
        </div>
      </div>
    </div>
  );
}

export default FormattedAnalysis;
