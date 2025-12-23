'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { tournamentsAPI } from '@/src/lib/api-client';
import { Tournament, getStatusText, getStatusColor } from '@/src/lib/types/tournament';
import BracketVisualizer from '@/src/components/BracketVisualizer';
import { playSound } from '@/src/lib/sounds';

export default function TournamentDetailPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'bracket' | 'participants' | 'rules'>('bracket');

  const fetchTournament = useCallback(async () => {
    try {
      const response = await tournamentsAPI.getById(tournamentId);
      setTournament(response.data || response);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el torneo');
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchTournament();
    
    // Configurar WebSocket para actualizaciones en tiempo real
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket(`${wsUrl}/ws`);
        
        ws.onopen = () => {
          setWsConnected(true);
          ws?.send(JSON.stringify({ type: 'subscribe', tournamentId }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'TOURNAMENT_UPDATE' || data.type === 'MATCH_UPDATE') {
              fetchTournament();
              playSound('success');
            }
          } catch (e) {
            console.error('Error parsing WebSocket message:', e);
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          // Reconectar después de 5 segundos
          reconnectTimeout = setTimeout(connectWebSocket, 5000);
        };

        ws.onerror = () => {
          setWsConnected(false);
        };
      } catch (e) {
        console.error('WebSocket connection error:', e);
      }
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close();
      }
    };
  }, [tournamentId, fetchTournament]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-poke-yellow border-t-transparent mb-4"></div>
          <p className="text-xl">Cargando torneo...</p>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md text-center">
          <i className="fas fa-exclamation-triangle text-6xl text-poke-red mb-4"></i>
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-slate-300 mb-6">{error || 'Torneo no encontrado'}</p>
          <Link href="/torneos" className="btn-primary">
            <i className="fas fa-arrow-left mr-2"></i>
            Volver a Torneos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/torneos" 
            className="text-slate-400 hover:text-white transition-colors mb-4 inline-flex items-center gap-2"
          >
            <i className="fas fa-arrow-left"></i>
            Volver a Torneos
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold">{tournament.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(tournament.status)} bg-slate-800`}>
                  {getStatusText(tournament.status)}
                </span>
              </div>
              <p className="text-slate-400">{tournament.description}</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Indicador de conexión WebSocket */}
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-slate-400">
                  {wsConnected ? 'En vivo' : 'Desconectado'}
                </span>
              </div>
              
              {/* Código del torneo */}
              <div className="bg-slate-800 px-4 py-2 rounded-lg">
                <span className="text-slate-400 text-sm">Código: </span>
                <span className="font-mono font-bold text-poke-yellow">{tournament.code}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <InfoCard
            icon="fa-users"
            label="Participantes"
            value={`${tournament.participants.length} / ${tournament.maxParticipants}`}
          />
          <InfoCard
            icon="fa-calendar"
            label="Fecha de Inicio"
            value={new Date(tournament.startDate).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          />
          <InfoCard
            icon="fa-sitemap"
            label="Formato"
            value={tournament.bracketType === 'single' ? 'Eliminación Simple' : 'Eliminación Doble'}
          />
          <InfoCard
            icon="fa-trophy"
            label="Premios"
            value={tournament.prizes || 'Por anunciar'}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700 overflow-x-auto">
          <TabButton
            active={activeTab === 'bracket'}
            onClick={() => setActiveTab('bracket')}
            icon="fa-sitemap"
            label="Bracket"
          />
          <TabButton
            active={activeTab === 'participants'}
            onClick={() => setActiveTab('participants')}
            icon="fa-users"
            label="Participantes"
          />
          <TabButton
            active={activeTab === 'rules'}
            onClick={() => setActiveTab('rules')}
            icon="fa-book"
            label="Reglas"
          />
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'bracket' && (
            <BracketVisualizer tournament={tournament} />
          )}

          {activeTab === 'participants' && (
            <ParticipantsList tournament={tournament} />
          )}

          {activeTab === 'rules' && (
            <RulesSection tournament={tournament} />
          )}
        </div>
      </div>
    </div>
  );
}

// Componente de tarjeta de información
function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
          <i className={`fas ${icon} text-poke-yellow`}></i>
        </div>
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          <p className="font-bold text-white truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}

// Componente de botón de tab
function TabButton({ 
  active, 
  onClick, 
  icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: string; 
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap
        ${active 
          ? 'border-poke-yellow text-poke-yellow' 
          : 'border-transparent text-slate-400 hover:text-white'
        }
      `}
    >
      <i className={`fas ${icon}`}></i>
      <span>{label}</span>
    </button>
  );
}

// Lista de participantes
function ParticipantsList({ tournament }: { tournament: Tournament }) {
  const sortedParticipants = [...tournament.participants].sort((a, b) => a.seed - b.seed);

  if (sortedParticipants.length === 0) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-user-slash text-4xl text-slate-600 mb-4"></i>
        <p className="text-slate-400">Aún no hay participantes inscritos</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedParticipants.map((participant) => (
        <div
          key={participant.id}
          className={`
            bg-slate-800/50 rounded-xl p-4 border border-slate-700
            flex items-center gap-4
            ${participant.status === 'eliminated' ? 'opacity-50' : ''}
            ${participant.status === 'winner' ? 'border-yellow-500 bg-yellow-900/20' : ''}
          `}
        >
          <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold">
            #{participant.seed}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white truncate">{participant.username}</p>
            <p className="text-xs text-slate-400">
              {participant.status === 'eliminated' && 'Eliminado'}
              {participant.status === 'winner' && '🏆 Campeón'}
              {participant.status === 'active' && 'En competencia'}
              {participant.status === 'registered' && 'Inscrito'}
            </p>
          </div>
          {participant.status === 'winner' && (
            <i className="fas fa-trophy text-yellow-500 text-xl"></i>
          )}
        </div>
      ))}
    </div>
  );
}

// Sección de reglas
function RulesSection({ tournament }: { tournament: Tournament }) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <i className="fas fa-book text-poke-yellow"></i>
        Reglas del Torneo
      </h3>
      
      {tournament.rules ? (
        <div className="prose prose-invert max-w-none">
          <pre className="whitespace-pre-wrap text-slate-300 font-sans">
            {tournament.rules}
          </pre>
        </div>
      ) : (
        <p className="text-slate-400">No se han especificado reglas para este torneo.</p>
      )}

      {tournament.format && (
        <div className="mt-6 pt-6 border-t border-slate-700">
          <h4 className="font-bold mb-2">Formato</h4>
          <p className="text-slate-300">{tournament.format}</p>
        </div>
      )}
    </div>
  );
}
