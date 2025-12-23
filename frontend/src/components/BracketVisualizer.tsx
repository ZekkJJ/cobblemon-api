'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Tournament, 
  TournamentMatch, 
  TournamentRound,
  getParticipantById,
  getMatchStatusColor 
} from '@/src/lib/types/tournament';

interface BracketVisualizerProps {
  tournament: Tournament;
  onMatchClick?: (match: TournamentMatch) => void;
}

export default function BracketVisualizer({ tournament, onMatchClick }: BracketVisualizerProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const bracket = tournament.bracket;
  
  if (!bracket || bracket.rounds.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-800/50 rounded-xl">
        <div className="text-center">
          <i className="fas fa-sitemap text-4xl text-slate-600 mb-3"></i>
          <p className="text-slate-400">El bracket aún no ha sido generado</p>
          <p className="text-sm text-slate-500 mt-1">
            {tournament.participants.length} / {tournament.maxParticipants} participantes
          </p>
        </div>
      </div>
    );
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 2));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative">
      {/* Controles de zoom */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={() => setZoom(prev => Math.min(prev + 0.2, 2))}
          className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors"
          title="Acercar"
        >
          <i className="fas fa-plus"></i>
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))}
          className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors"
          title="Alejar"
        >
          <i className="fas fa-minus"></i>
        </button>
        <button
          onClick={resetView}
          className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors"
          title="Restablecer vista"
        >
          <i className="fas fa-compress-arrows-alt"></i>
        </button>
      </div>

      {/* Contenedor del bracket */}
      <div
        ref={containerRef}
        className="overflow-hidden bg-slate-900/50 rounded-xl border border-slate-700 cursor-grab active:cursor-grabbing"
        style={{ height: '500px' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="flex gap-8 p-8 transition-transform duration-100"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'top left',
          }}
        >
          {bracket.rounds.map((round, roundIndex) => (
            <RoundColumn
              key={round.roundNumber}
              round={round}
              tournament={tournament}
              roundIndex={roundIndex}
              totalRounds={bracket.totalRounds}
              onMatchClick={onMatchClick}
            />
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-600"></div>
          <span className="text-slate-400">Pendiente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
          <span className="text-slate-400">Listo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-600 animate-pulse"></div>
          <span className="text-slate-400">En curso</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <span className="text-slate-400">Completado</span>
        </div>
      </div>
    </div>
  );
}


// Componente de columna de ronda
function RoundColumn({
  round,
  tournament,
  roundIndex,
  totalRounds,
  onMatchClick,
}: {
  round: TournamentRound;
  tournament: Tournament;
  roundIndex: number;
  totalRounds: number;
  onMatchClick?: (match: TournamentMatch) => void;
}) {
  // Calcular espaciado vertical basado en la ronda
  const verticalSpacing = Math.pow(2, roundIndex) * 60;

  return (
    <div className="flex flex-col items-center min-w-[200px]">
      {/* Nombre de la ronda */}
      <div className="mb-4 text-center">
        <h3 className="text-lg font-bold text-white">{round.name}</h3>
        <p className="text-xs text-slate-500">
          {round.matches.length} {round.matches.length === 1 ? 'match' : 'matches'}
        </p>
      </div>

      {/* Matches de la ronda */}
      <div 
        className="flex flex-col justify-around flex-1"
        style={{ gap: `${verticalSpacing}px` }}
      >
        {round.matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            tournament={tournament}
            onClick={() => onMatchClick?.(match)}
          />
        ))}
      </div>
    </div>
  );
}

// Componente de tarjeta de match
function MatchCard({
  match,
  tournament,
  onClick,
}: {
  match: TournamentMatch;
  tournament: Tournament;
  onClick?: () => void;
}) {
  const player1 = match.player1Id ? getParticipantById(tournament, match.player1Id) : null;
  const player2 = match.player2Id ? getParticipantById(tournament, match.player2Id) : null;

  const isActive = match.status === 'active';
  const isCompleted = match.status === 'completed';

  return (
    <div
      className={`
        relative bg-slate-800 rounded-lg border-2 overflow-hidden
        transition-all duration-300 cursor-pointer
        ${isActive ? 'border-green-500 shadow-lg shadow-green-500/20' : 'border-slate-600'}
        ${isCompleted ? 'border-blue-500/50' : ''}
        hover:border-slate-500 hover:scale-105
      `}
      onClick={onClick}
    >
      {/* Indicador de estado */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${getMatchStatusColor(match.status)}`}></div>

      {/* Jugador 1 */}
      <PlayerSlot
        player={player1}
        isWinner={match.winnerId === match.player1Id}
        isLoser={match.loserId === match.player1Id}
        isBye={match.isBye && !player1}
      />

      {/* Separador */}
      <div className="h-px bg-slate-700"></div>

      {/* Jugador 2 */}
      <PlayerSlot
        player={player2}
        isWinner={match.winnerId === match.player2Id}
        isLoser={match.loserId === match.player2Id}
        isBye={match.isBye && !player2}
      />

      {/* Badge de match activo */}
      {isActive && (
        <div className="absolute -top-1 -right-1">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        </div>
      )}
    </div>
  );
}

// Componente de slot de jugador
function PlayerSlot({
  player,
  isWinner,
  isLoser,
  isBye,
}: {
  player: { username: string; seed: number } | null | undefined;
  isWinner: boolean;
  isLoser: boolean;
  isBye: boolean;
}) {
  return (
    <div
      className={`
        px-3 py-2 flex items-center justify-between min-w-[180px]
        ${isWinner ? 'bg-green-900/30' : ''}
        ${isLoser ? 'bg-red-900/20 opacity-60' : ''}
      `}
    >
      <div className="flex items-center gap-2">
        {player ? (
          <>
            <span className="text-xs text-slate-500 w-4">#{player.seed}</span>
            <span className={`text-sm ${isWinner ? 'text-green-400 font-bold' : 'text-white'}`}>
              {player.username}
            </span>
          </>
        ) : isBye ? (
          <span className="text-sm text-slate-500 italic">BYE</span>
        ) : (
          <span className="text-sm text-slate-500">Por determinar</span>
        )}
      </div>

      {isWinner && (
        <i className="fas fa-trophy text-yellow-500 text-xs"></i>
      )}
    </div>
  );
}
