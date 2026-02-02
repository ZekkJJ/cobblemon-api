'use client';

import { useState, useRef } from 'react';
import { 
  Tournament, 
  TournamentMatch, 
  getParticipantById,
} from '@/lib/types/tournament';

interface BracketVisualizerProps {
  tournament: Tournament;
  onMatchClick?: (match: TournamentMatch) => void;
}

export default function BracketVisualizer({ tournament, onMatchClick }: BracketVisualizerProps) {
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const bracket = tournament.bracket;
  const is2v2Tournament = tournament.battleFormat === '2v2';
  
  if (!bracket || !bracket.rounds || bracket.rounds.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-800 rounded-2xl border border-slate-700/50">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-purple-600/20 to-slate-800 rounded-full flex items-center justify-center border border-purple-500/30">
            <i className="fas fa-sitemap text-4xl text-purple-400/60"></i>
          </div>
          <p className="text-slate-300 font-semibold text-lg">El bracket aún no ha sido generado</p>
          <p className="text-sm text-slate-500 mt-2">
            <span className="text-poke-yellow font-bold">{tournament.participants.length}</span> / {tournament.maxParticipants} participantes
          </p>
          {is2v2Tournament && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 rounded-full border border-purple-500/30">
              <i className="fas fa-users text-purple-400"></i>
              <span className="text-purple-300 text-sm font-medium">Torneo 2v2</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom(prev => Math.min(Math.max(prev + delta, 0.3), 1.8));
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
    setZoom(0.85);
    setPan({ x: 0, y: 0 });
  };

  // Calculate dimensions - larger for 2v2 to show team members
  const matchHeight = is2v2Tournament ? 140 : 100;
  const matchWidth = is2v2Tournament ? 280 : 240;
  const horizontalGap = 100;
  const baseVerticalGap = 30;

  return (
    <div className="relative">
      {/* Tournament Mode Badge */}
      {is2v2Tournament && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-purple-600/90 to-indigo-600/90 rounded-full border border-purple-400/50 shadow-lg shadow-purple-500/30 backdrop-blur-sm">
            <div className="flex -space-x-1">
              <div className="w-6 h-6 rounded-full bg-purple-400 flex items-center justify-center border-2 border-purple-600">
                <i className="fas fa-user text-[10px] text-white"></i>
              </div>
              <div className="w-6 h-6 rounded-full bg-indigo-400 flex items-center justify-center border-2 border-indigo-600">
                <i className="fas fa-user text-[10px] text-white"></i>
              </div>
            </div>
            <span className="text-white font-bold text-sm tracking-wide">TORNEO 2v2</span>
            <i className="fas fa-bolt text-yellow-300 animate-pulse"></i>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button
          onClick={() => setZoom(prev => Math.min(prev + 0.15, 1.8))}
          className="w-11 h-11 bg-slate-800/95 hover:bg-slate-700 rounded-xl flex items-center justify-center transition-all border border-slate-600/50 backdrop-blur-sm hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10"
          title="Acercar"
        >
          <i className="fas fa-search-plus text-slate-300"></i>
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.3))}
          className="w-11 h-11 bg-slate-800/95 hover:bg-slate-700 rounded-xl flex items-center justify-center transition-all border border-slate-600/50 backdrop-blur-sm hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10"
          title="Alejar"
        >
          <i className="fas fa-search-minus text-slate-300"></i>
        </button>
        <button
          onClick={resetView}
          className="w-11 h-11 bg-slate-800/95 hover:bg-slate-700 rounded-xl flex items-center justify-center transition-all border border-slate-600/50 backdrop-blur-sm hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10"
          title="Restablecer vista"
        >
          <i className="fas fa-compress-arrows-alt text-slate-300"></i>
        </button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute top-4 left-4 z-20 px-4 py-2 bg-slate-800/95 rounded-xl text-sm font-mono text-slate-300 border border-slate-600/50 backdrop-blur-sm">
        <i className="fas fa-search text-slate-500 mr-2"></i>
        {Math.round(zoom * 100)}%
      </div>

      {/* Bracket Container */}
      <div
        ref={containerRef}
        className="overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/95 to-purple-900/20 rounded-2xl border border-slate-700/50 cursor-grab active:cursor-grabbing select-none shadow-2xl"
        style={{ height: is2v2Tournament ? '700px' : '600px' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              radial-gradient(circle at 2px 2px, ${is2v2Tournament ? '#a855f7' : '#64748b'} 1px, transparent 0),
              radial-gradient(circle at 50% 50%, ${is2v2Tournament ? '#7c3aed' : '#475569'} 0%, transparent 50%)
            `,
            backgroundSize: '50px 50px, 100% 100%'
          }}></div>
        </div>

        {/* Glow effects for 2v2 */}
        {is2v2Tournament && (
          <>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
          </>
        )}

        <div
          className="relative p-10 transition-transform duration-75"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'top left',
          }}
        >
          {/* SVG for connector lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
              <linearGradient id="activeLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#4ade80" />
              </linearGradient>
              <linearGradient id="purpleLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {bracket.rounds.map((round, roundIndex) => {
              if (roundIndex === bracket.rounds.length - 1) return null;
              
              const nextRound = bracket.rounds[roundIndex + 1];
              if (!nextRound) return null;

              return round.matches.map((match, matchIndex) => {
                const nextMatchIndex = Math.floor(matchIndex / 2);
                const nextMatch = nextRound.matches[nextMatchIndex];
                if (!nextMatch) return null;

                const currentSpacing = Math.pow(2, roundIndex) * (matchHeight + baseVerticalGap);
                const nextSpacing = Math.pow(2, roundIndex + 1) * (matchHeight + baseVerticalGap);
                
                const x1 = roundIndex * (matchWidth + horizontalGap) + matchWidth;
                const y1 = matchIndex * currentSpacing + currentSpacing / 2 + matchHeight / 2;
                
                const x2 = (roundIndex + 1) * (matchWidth + horizontalGap);
                const y2 = nextMatchIndex * nextSpacing + nextSpacing / 2 + matchHeight / 2;

                const isCompleted = match.status === 'completed';
                const isActive = match.status === 'active';
                const midX = x1 + (x2 - x1) / 2;

                let strokeColor = "url(#lineGradient)";
                let strokeWidth = 2;
                let opacity = 0.4;

                if (isCompleted) {
                  strokeColor = is2v2Tournament ? "url(#purpleLineGradient)" : "url(#activeLineGradient)";
                  strokeWidth = 3;
                  opacity = 0.9;
                } else if (isActive) {
                  strokeColor = "url(#activeLineGradient)";
                  strokeWidth = 3;
                  opacity = 0.8;
                }

                return (
                  <g key={`line-${roundIndex}-${matchIndex}`}>
                    <path
                      d={`M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={opacity}
                      filter={isActive ? "url(#glow)" : undefined}
                    />
                  </g>
                );
              });
            })}
          </svg>

          {/* Rounds */}
          <div className="flex relative z-10">
            {bracket.rounds.map((round, roundIndex) => {
              const spacing = Math.pow(2, roundIndex) * (matchHeight + baseVerticalGap);
              const isFinalRound = roundIndex === bracket.rounds.length - 1;
              
              return (
                <div 
                  key={round.roundNumber} 
                  className="flex flex-col"
                  style={{ 
                    width: matchWidth,
                    marginRight: roundIndex < bracket.rounds.length - 1 ? horizontalGap : 0
                  }}
                >
                  {/* Round Header */}
                  <div className="mb-8 text-center">
                    <div className={`
                      inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm
                      ${isFinalRound 
                        ? 'bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-white shadow-lg shadow-yellow-500/30 border border-yellow-400/50' 
                        : is2v2Tournament
                          ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/30 text-purple-200 border border-purple-500/40'
                          : 'bg-slate-800/80 text-slate-200 border border-slate-600/50'
                      }
                    `}>
                      {isFinalRound && <i className="fas fa-crown text-yellow-200"></i>}
                      {round.name || `Ronda ${round.roundNumber}`}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 font-medium">
                      {round.matches.length} {round.matches.length === 1 ? 'enfrentamiento' : 'enfrentamientos'}
                    </p>
                  </div>

                  {/* Matches */}
                  <div className="flex flex-col" style={{ gap: spacing - matchHeight }}>
                    {round.matches.map((match, matchIndex) => (
                      <div 
                        key={match.id}
                        style={{ 
                          height: matchHeight,
                          marginTop: matchIndex === 0 ? (spacing - matchHeight) / 2 : 0
                        }}
                      >
                        <MatchCard
                          match={match}
                          tournament={tournament}
                          isFinal={isFinalRound}
                          onClick={() => onMatchClick?.(match)}
                          is2v2Tournament={is2v2Tournament}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Champion Display */}
            {bracket.winnerId && (
              <ChampionDisplay 
                tournament={tournament}
                winnerId={bracket.winnerId}
                matchHeight={matchHeight}
                baseVerticalGap={baseVerticalGap}
                horizontalGap={horizontalGap}
                matchWidth={matchWidth}
                roundsCount={bracket.rounds.length}
                is2v2={is2v2Tournament}
              />
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between mt-5 px-2">
        <div className="flex flex-wrap gap-5">
          <LegendItem color="bg-slate-600" label="Pendiente" />
          <LegendItem color="bg-yellow-500" label="Listo" />
          <LegendItem color="bg-green-500" label="En curso" pulse />
          <LegendItem color={is2v2Tournament ? "bg-purple-500" : "bg-blue-500"} label="Completado" />
        </div>
        {is2v2Tournament && (
          <div className="flex items-center gap-2 text-sm text-purple-400">
            <i className="fas fa-info-circle"></i>
            <span>Cada equipo tiene 2 jugadores</span>
          </div>
        )}
      </div>
    </div>
  );
}


// Champion Display Component
function ChampionDisplay({
  tournament,
  winnerId,
  matchHeight,
  baseVerticalGap,
  horizontalGap,
  matchWidth,
  roundsCount,
  is2v2,
}: {
  tournament: Tournament;
  winnerId: string;
  matchHeight: number;
  baseVerticalGap: number;
  horizontalGap: number;
  matchWidth: number;
  roundsCount: number;
  is2v2: boolean;
}) {
  // For 2v2, find the winning team
  const winningTeam = is2v2 ? tournament.bracket?.teams?.find(t => t.id === winnerId) : null;
  const winnerParticipant = !is2v2 ? getParticipantById(tournament, winnerId) : null;

  return (
    <div 
      className="flex flex-col items-center justify-center"
      style={{ 
        width: matchWidth + 40,
        marginLeft: horizontalGap,
        marginTop: Math.pow(2, roundsCount - 1) * (matchHeight + baseVerticalGap) / 2 - 80
      }}
    >
      <div className="relative">
        {/* Animated glow rings */}
        <div className="absolute -inset-8 bg-gradient-to-r from-yellow-500/30 via-amber-500/30 to-orange-500/30 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute -inset-4 bg-gradient-to-r from-yellow-500/40 to-amber-500/40 rounded-full blur-xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        
        {/* Trophy container */}
        <div className="relative bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 p-8 rounded-3xl shadow-2xl shadow-yellow-500/40 border-2 border-yellow-300/50">
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-3xl"></div>
          <i className="fas fa-trophy text-5xl text-white drop-shadow-lg relative z-10"></i>
        </div>

        {/* Sparkles */}
        <div className="absolute -top-2 -right-2 text-yellow-300 animate-bounce" style={{ animationDelay: '0.2s' }}>
          <i className="fas fa-sparkles text-lg"></i>
        </div>
        <div className="absolute -bottom-1 -left-2 text-amber-300 animate-bounce" style={{ animationDelay: '0.4s' }}>
          <i className="fas fa-star text-sm"></i>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-yellow-400 font-bold uppercase tracking-[0.2em] mb-2">
          {is2v2 ? '🏆 Equipo Campeón 🏆' : '🏆 Campeón 🏆'}
        </p>
        
        {is2v2 && winningTeam ? (
          <div className="space-y-3">
            <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-300">
              {winningTeam.name}
            </p>
            <div className="flex items-center justify-center gap-3">
              <TeamMemberBadge name={winningTeam.player1.username} isChampion />
              <span className="text-yellow-500 font-bold">&</span>
              <TeamMemberBadge name={winningTeam.player2.username} isChampion />
            </div>
          </div>
        ) : (
          <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-300">
            {winnerParticipant?.username || 'Campeón'}
          </p>
        )}
      </div>
    </div>
  );
}

function TeamMemberBadge({ name, isChampion }: { name: string; isChampion?: boolean }) {
  return (
    <div className={`
      px-3 py-1.5 rounded-lg text-sm font-semibold
      ${isChampion 
        ? 'bg-gradient-to-r from-yellow-500/30 to-amber-500/30 text-yellow-200 border border-yellow-500/40' 
        : 'bg-slate-700/50 text-slate-300 border border-slate-600/50'
      }
    `}>
      <i className="fas fa-user mr-1.5 text-xs opacity-70"></i>
      {name}
    </div>
  );
}

function LegendItem({ color, label, pulse }: { color: string; label: string; pulse?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`w-3.5 h-3.5 rounded-full ${color} ${pulse ? 'animate-pulse shadow-lg shadow-green-500/50' : ''}`}></div>
      <span className="text-sm text-slate-400 font-medium">{label}</span>
    </div>
  );
}


// Match Card Component - Enhanced for 2v2
function MatchCard({
  match,
  tournament,
  isFinal,
  onClick,
  is2v2Tournament,
}: {
  match: TournamentMatch;
  tournament: Tournament;
  isFinal: boolean;
  onClick?: () => void;
  is2v2Tournament: boolean;
}) {
  const is2v2 = match.is2v2 || is2v2Tournament;
  
  // Get team/player data
  let slot1Data: { name: string | null; members?: string[]; seed?: number } = { name: null };
  let slot2Data: { name: string | null; members?: string[]; seed?: number } = { name: null };

  if (is2v2) {
    // Find teams from bracket
    const team1 = tournament.bracket?.teams?.find(t => t.id === match.team1Id);
    const team2 = tournament.bracket?.teams?.find(t => t.id === match.team2Id);
    
    slot1Data = {
      name: match.team1Name || team1?.name || null,
      members: match.team1Players || (team1 ? [team1.player1.username, team1.player2.username] : undefined),
      seed: team1?.combinedSeed,
    };
    slot2Data = {
      name: match.team2Name || team2?.name || null,
      members: match.team2Players || (team2 ? [team2.player1.username, team2.player2.username] : undefined),
      seed: team2?.combinedSeed,
    };
  } else {
    const player1 = match.player1Id ? getParticipantById(tournament, match.player1Id) : null;
    const player2 = match.player2Id ? getParticipantById(tournament, match.player2Id) : null;
    slot1Data = { name: player1?.username || null, seed: player1?.seed };
    slot2Data = { name: player2?.username || null, seed: player2?.seed };
  }

  const isActive = match.status === 'active';
  const isCompleted = match.status === 'completed';
  const isReady = match.status === 'ready';

  const slot1Id = is2v2 ? match.team1Id : match.player1Id;
  const slot2Id = is2v2 ? match.team2Id : match.player2Id;
  const isSlot1Winner = match.winnerId === slot1Id;
  const isSlot2Winner = match.winnerId === slot2Id;
  const isSlot1Loser = match.loserId === slot1Id;
  const isSlot2Loser = match.loserId === slot2Id;

  const getStatusStyles = () => {
    if (isActive) return {
      border: 'border-green-500 shadow-green-500/40',
      bar: 'bg-gradient-to-r from-green-500 to-emerald-400',
      glow: 'shadow-xl shadow-green-500/30',
    };
    if (isCompleted) return {
      border: is2v2 ? 'border-purple-500/70' : 'border-blue-500/70',
      bar: is2v2 ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500',
      glow: '',
    };
    if (isReady) return {
      border: 'border-yellow-500/70',
      bar: 'bg-gradient-to-r from-yellow-500 to-amber-400',
      glow: '',
    };
    return {
      border: 'border-slate-700/70',
      bar: 'bg-slate-600',
      glow: '',
    };
  };

  const styles = getStatusStyles();

  return (
    <div
      className={`
        relative h-full rounded-2xl overflow-hidden cursor-pointer
        transition-all duration-300 group
        bg-gradient-to-br from-slate-800/95 via-slate-800/90 to-slate-900/95
        border-2 ${styles.border} ${styles.glow}
        ${isFinal ? 'ring-2 ring-yellow-500/40 ring-offset-2 ring-offset-slate-900' : ''}
        hover:scale-[1.03] hover:shadow-2xl backdrop-blur-sm
      `}
      onClick={onClick}
    >
      {/* Status bar with gradient */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${styles.bar}`}></div>

      {/* Active match indicator */}
      {isActive && (
        <div className="absolute -top-1.5 -right-1.5 z-10">
          <span className="relative flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-gradient-to-br from-green-400 to-emerald-500 items-center justify-center shadow-lg">
              <i className="fas fa-bolt text-[9px] text-white"></i>
            </span>
          </span>
        </div>
      )}

      {/* 2v2 badge */}
      {is2v2 && (
        <div className="absolute top-2 left-2 z-10">
          <div className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[9px] font-bold px-2 py-1 rounded-lg shadow-lg border border-purple-400/30">
            <i className="fas fa-users text-[8px]"></i>
            <span>2v2</span>
          </div>
        </div>
      )}

      {/* Final badge */}
      {isFinal && !isCompleted && (
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-white text-[10px] font-black px-4 py-1 rounded-b-lg shadow-lg tracking-wider">
            ⚔️ FINAL ⚔️
          </div>
        </div>
      )}

      {/* Match number */}
      <div className="absolute bottom-1.5 right-2 text-[10px] text-slate-600 font-mono">
        #{match.matchNumber}
      </div>

      {/* Players/Teams Container */}
      <div className="h-full flex flex-col pt-1.5">
        <TeamSlot
          data={slot1Data}
          isWinner={isSlot1Winner}
          isLoser={isSlot1Loser}
          isBye={match.isBye && !slot1Data.name}
          position="top"
          is2v2={is2v2}
        />
        
        {/* VS Divider */}
        <div className="relative h-px mx-3">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 bg-slate-800 rounded text-[10px] font-bold text-slate-500">
            VS
          </div>
        </div>
        
        <TeamSlot
          data={slot2Data}
          isWinner={isSlot2Winner}
          isLoser={isSlot2Loser}
          isBye={match.isBye && !slot2Data.name}
          position="bottom"
          is2v2={is2v2}
        />
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
    </div>
  );
}


// Team/Player Slot Component - Enhanced for 2v2
function TeamSlot({
  data,
  isWinner,
  isLoser,
  isBye,
  position,
  is2v2,
}: {
  data: { name: string | null; members?: string[]; seed?: number };
  isWinner: boolean;
  isLoser: boolean;
  isBye: boolean;
  position: 'top' | 'bottom';
  is2v2: boolean;
}) {
  const getBackgroundStyle = () => {
    if (isWinner) return 'bg-gradient-to-r from-green-500/15 to-emerald-500/10';
    if (isLoser) return 'bg-gradient-to-r from-red-500/10 to-transparent opacity-60';
    return '';
  };

  return (
    <div
      className={`
        flex-1 px-3 py-2 flex flex-col justify-center min-w-0
        ${getBackgroundStyle()}
        ${position === 'top' ? 'rounded-t-2xl pt-3' : 'rounded-b-2xl pb-3'}
        transition-all duration-200
      `}
    >
      {data.name ? (
        <div className="space-y-1">
          {/* Team/Player Name Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Seed badge */}
              {data.seed && (
                <span className={`
                  text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md shrink-0
                  ${isWinner 
                    ? 'bg-green-500/30 text-green-300 border border-green-500/30' 
                    : 'bg-slate-700/80 text-slate-400 border border-slate-600/50'
                  }
                `}>
                  #{data.seed}
                </span>
              )}
              
              {/* Team icon for 2v2 */}
              {is2v2 && (
                <span className="text-purple-400 shrink-0">
                  <i className="fas fa-users text-xs"></i>
                </span>
              )}
              
              {/* Name */}
              <span className={`
                text-sm truncate font-semibold
                ${isWinner 
                  ? 'text-green-300' 
                  : isLoser 
                    ? 'text-slate-500 line-through decoration-red-500/50' 
                    : 'text-white'
                }
              `}>
                {data.name}
              </span>
            </div>

            {/* Winner crown */}
            {isWinner && (
              <div className="flex items-center gap-1 shrink-0">
                <i className="fas fa-crown text-yellow-400 text-sm drop-shadow-lg animate-pulse"></i>
              </div>
            )}
          </div>

          {/* Team Members for 2v2 */}
          {is2v2 && data.members && data.members.length > 0 && (
            <div className="flex items-center gap-1.5 ml-1">
              <div className="flex items-center gap-1 text-[10px]">
                {data.members.map((member, idx) => (
                  <span key={idx} className="flex items-center">
                    <span className={`
                      px-1.5 py-0.5 rounded
                      ${isWinner 
                        ? 'bg-green-500/20 text-green-400' 
                        : isLoser 
                          ? 'bg-slate-700/30 text-slate-500' 
                          : 'bg-purple-500/20 text-purple-300'
                      }
                    `}>
                      <i className="fas fa-user mr-1 text-[8px] opacity-60"></i>
                      {member}
                    </span>
                    {idx === 0 && data.members && data.members.length > 1 && (
                      <span className="mx-1 text-slate-600">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : isBye ? (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-700/50 flex items-center justify-center">
            <i className="fas fa-forward text-[10px] text-slate-500"></i>
          </div>
          <span className="text-xs text-slate-500 italic font-medium">Pase automático</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-700/30 flex items-center justify-center border border-dashed border-slate-600">
            <i className="fas fa-question text-[10px] text-slate-600"></i>
          </div>
          <span className="text-xs text-slate-600 font-medium">Por determinar</span>
        </div>
      )}
    </div>
  );
}
