'use client';

import { useRef, useEffect, useState } from 'react';
import { getTypeColor } from '@/lib/pokemon-type-colors';

interface Turn {
  turnNumber: number;
  player1Move?: string;
  player2Move?: string;
  player1Pokemon?: string;
  player2Pokemon?: string;
  events?: ('ko' | 'switch' | 'critical')[];
}

interface TurnTimelineProps {
  turns: Turn[];
  totalTurns: number;
  onTurnClick: (turnNumber: number) => void;
  selectedTurn?: number;
}

function TurnMarker({ 
  turn, 
  isSelected, 
  onClick 
}: { 
  turn: Turn; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  const hasKO = turn.events?.includes('ko');
  const hasSwitch = turn.events?.includes('switch');
  const hasCritical = turn.events?.includes('critical');

  const getMarkerStyle = () => {
    if (isSelected) return 'bg-purple-500 ring-2 ring-purple-400 ring-offset-2 ring-offset-gray-900 scale-110';
    if (hasKO) return 'bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/30';
    if (hasSwitch) return 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30';
    if (hasCritical) return 'bg-gradient-to-br from-yellow-500 to-orange-600 shadow-lg shadow-yellow-500/30';
    return 'bg-gray-700 hover:bg-gray-600';
  };

  return (
    <div 
      className="flex flex-col items-center cursor-pointer transition-all hover:scale-105 group"
      onClick={onClick}
    >
      {/* Turn number */}
      <span className={`text-xs mb-1 font-medium transition-colors ${
        isSelected ? 'text-purple-400' : 'text-gray-500 group-hover:text-gray-300'
      }`}>
        T{turn.turnNumber}
      </span>
      
      {/* Marker */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${getMarkerStyle()}`}>
        <span className="text-lg">
          {hasKO ? '💀' : hasSwitch ? '🔄' : hasCritical ? '💥' : '⚔️'}
        </span>
      </div>
      
      {/* Move preview on hover */}
      <div className="mt-1.5 text-[10px] text-center max-w-[70px] h-8 overflow-hidden">
        {turn.player1Move && (
          <div className="text-purple-400 truncate">{turn.player1Move}</div>
        )}
        {turn.player2Move && (
          <div className="text-cyan-400 truncate">{turn.player2Move}</div>
        )}
      </div>
    </div>
  );
}

function TurnDetails({ turn }: { turn: Turn }) {
  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-600 rounded-xl p-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
          <span className="text-purple-400 font-bold">{turn.turnNumber}</span>
        </div>
        <h4 className="font-bold text-white">Turno {turn.turnNumber}</h4>
        
        {/* Event badges */}
        {turn.events && turn.events.length > 0 && (
          <div className="flex gap-1 ml-auto">
            {turn.events.map((event, i) => (
              <span 
                key={i}
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  event === 'ko' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  event === 'switch' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                }`}
              >
                {event === 'ko' ? '💀 KO' : event === 'switch' ? '🔄 Switch' : '💥 Crítico'}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Player 1 action */}
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
          <div className="text-xs text-purple-400 font-medium mb-2">👤 Jugador 1</div>
          {turn.player1Pokemon && (
            <div className="text-sm text-white font-medium mb-1">{turn.player1Pokemon}</div>
          )}
          {turn.player1Move ? (
            <div className="flex items-center gap-1.5">
              <span className="text-purple-400">→</span>
              <span className="text-sm text-purple-300 font-medium">{turn.player1Move}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-500">Sin datos</span>
          )}
        </div>
        
        {/* Player 2 action */}
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
          <div className="text-xs text-cyan-400 font-medium mb-2">👤 Jugador 2</div>
          {turn.player2Pokemon && (
            <div className="text-sm text-white font-medium mb-1">{turn.player2Pokemon}</div>
          )}
          {turn.player2Move ? (
            <div className="flex items-center gap-1.5">
              <span className="text-cyan-400">→</span>
              <span className="text-sm text-cyan-300 font-medium">{turn.player2Move}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-500">Sin datos</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Legend component
function TimelineLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-gray-400">
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <span>KO</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-full bg-blue-500" />
        <span>Switch</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <span>Crítico</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-full bg-gray-600" />
        <span>Normal</span>
      </div>
    </div>
  );
}

export function TurnTimeline({ turns, totalTurns, onTurnClick, selectedTurn }: TurnTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLegend, setShowLegend] = useState(false);
  
  // Auto-scroll to selected turn
  useEffect(() => {
    if (selectedTurn && scrollRef.current) {
      const selectedElement = scrollRef.current.querySelector(`[data-turn="${selectedTurn}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      }
    }
  }, [selectedTurn]);

  const selectedTurnData = turns.find(t => t.turnNumber === selectedTurn);
  
  // Count events
  const koCount = turns.filter(t => t.events?.includes('ko')).length;
  const switchCount = turns.filter(t => t.events?.includes('switch')).length;

  if (turns.length === 0) {
    return (
      <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6 text-center">
        <span className="text-4xl mb-2 block">📊</span>
        <p className="text-gray-400">No hay datos de turnos disponibles</p>
        <p className="text-gray-500 text-sm mt-1">La batalla tuvo {totalTurns} turnos</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h3 className="font-bold text-white">Timeline de Batalla</h3>
              <p className="text-xs text-gray-400">Haz clic en un turno para ver detalles</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Stats badges */}
            <div className="flex items-center gap-2">
              <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-xs font-medium">
                🔄 {totalTurns} turnos
              </span>
              {koCount > 0 && (
                <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs font-medium">
                  💀 {koCount} KOs
                </span>
              )}
              {switchCount > 0 && (
                <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs font-medium">
                  🔄 {switchCount} switches
                </span>
              )}
            </div>
            
            <button 
              onClick={() => setShowLegend(!showLegend)}
              className="text-gray-400 hover:text-white text-sm"
            >
              {showLegend ? '✕' : 'ℹ️'}
            </button>
          </div>
        </div>
        
        {showLegend && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <TimelineLegend />
          </div>
        )}
      </div>
      
      {/* Timeline scroll container */}
      <div className="p-4">
        <div 
          ref={scrollRef}
          className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
        >
          <div className="flex items-start gap-1 min-w-max px-2">
            {/* Start marker */}
            <div className="flex flex-col items-center mr-2">
              <span className="text-xs text-green-400 mb-1 font-medium">Inicio</span>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                <span className="text-lg">🎮</span>
              </div>
              <div className="h-8" />
            </div>
            
            {/* Connection line */}
            <div className="w-6 h-0.5 bg-gradient-to-r from-green-500 to-gray-600 mt-6" />
            
            {/* Turn markers */}
            {turns.map((turn, i) => (
              <div key={turn.turnNumber} className="flex items-start" data-turn={turn.turnNumber}>
                <TurnMarker 
                  turn={turn}
                  isSelected={selectedTurn === turn.turnNumber}
                  onClick={() => onTurnClick(turn.turnNumber)}
                />
                {i < turns.length - 1 && (
                  <div className="w-4 h-0.5 bg-gray-600 mt-6 mx-0.5" />
                )}
              </div>
            ))}
            
            {/* Connection line */}
            <div className="w-6 h-0.5 bg-gradient-to-r from-gray-600 to-purple-500 mt-6" />
            
            {/* End marker */}
            <div className="flex flex-col items-center ml-2">
              <span className="text-xs text-purple-400 mb-1 font-medium">Fin</span>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <span className="text-lg">🏆</span>
              </div>
              <div className="h-8" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Selected turn details */}
      {selectedTurnData && (
        <div className="px-4 pb-4">
          <TurnDetails turn={selectedTurnData} />
        </div>
      )}
    </div>
  );
}

export default TurnTimeline;
