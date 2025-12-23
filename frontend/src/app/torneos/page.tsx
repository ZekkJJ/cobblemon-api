'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { tournamentsAPI } from '@/src/lib/api-client';
import { Tournament, getStatusText } from '@/src/lib/types/tournament';
import { playSound } from '@/src/lib/sounds';

export default function TorneosPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await tournamentsAPI.getAll();
      const data = response.data || response;
      setTournaments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar torneos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar torneos
  const filteredTournaments = tournaments.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'active') return t.status === 'active';
    if (filter === 'upcoming') return t.status === 'registration' || t.status === 'upcoming';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  // Organizar torneos por estado
  const activeTournaments = filteredTournaments.filter(t => t.status === 'active');
  const upcomingTournaments = filteredTournaments.filter(t => t.status === 'registration' || t.status === 'upcoming');
  const completedTournaments = filteredTournaments.filter(t => t.status === 'completed');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-poke-yellow border-t-transparent mb-4"></div>
          <p className="text-xl">Cargando torneos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md text-center">
          <i className="fas fa-exclamation-triangle text-6xl text-poke-red mb-4"></i>
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <button onClick={fetchTournaments} className="btn-primary">
            <i className="fas fa-redo mr-2"></i>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 pixel-font text-poke-yellow">
            <i className="fas fa-trophy mr-3"></i>
            TORNEOS
          </h1>
          <p className="text-lg md:text-xl text-slate-300">
            Compite con otros entrenadores y demuestra tu habilidad
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <FilterButton
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            label="Todos"
            count={tournaments.length}
          />
          <FilterButton
            active={filter === 'active'}
            onClick={() => setFilter('active')}
            label="En Curso"
            count={activeTournaments.length}
            color="green"
          />
          <FilterButton
            active={filter === 'upcoming'}
            onClick={() => setFilter('upcoming')}
            label="Próximos"
            count={upcomingTournaments.length}
            color="blue"
          />
          <FilterButton
            active={filter === 'completed'}
            onClick={() => setFilter('completed')}
            label="Finalizados"
            count={completedTournaments.length}
            color="gray"
          />
        </div>

        {/* Torneos Activos */}
        {(filter === 'all' || filter === 'active') && activeTournaments.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-green-400">En Curso</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTournaments.map(tournament => (
                <TournamentCard key={tournament._id} tournament={tournament} onRegister={fetchTournaments} />
              ))}
            </div>
          </section>
        )}

        {/* Torneos Próximos */}
        {(filter === 'all' || filter === 'upcoming') && upcomingTournaments.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-blue-400 mb-6">
              <i className="fas fa-calendar-alt mr-3"></i>
              Próximamente
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingTournaments.map(tournament => (
                <TournamentCard key={tournament._id} tournament={tournament} onRegister={fetchTournaments} />
              ))}
            </div>
          </section>
        )}

        {/* Torneos Completados */}
        {(filter === 'all' || filter === 'completed') && completedTournaments.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-500 mb-6">
              <i className="fas fa-history mr-3"></i>
              Historial
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
              {completedTournaments.map(tournament => (
                <TournamentCard key={tournament._id} tournament={tournament} onRegister={fetchTournaments} />
              ))}
            </div>
          </section>
        )}

        {/* Estado vacío */}
        {filteredTournaments.length === 0 && (
          <div className="card text-center py-16">
            <i className="fas fa-calendar-times text-6xl text-slate-600 mb-4"></i>
            <h3 className="text-2xl font-bold mb-2">No hay torneos</h3>
            <p className="text-slate-400">
              {filter === 'all' 
                ? 'Vuelve pronto para ver los próximos eventos'
                : `No hay torneos ${filter === 'active' ? 'activos' : filter === 'upcoming' ? 'próximos' : 'finalizados'}`
              }
            </p>
          </div>
        )}

        {/* Cómo participar */}
        <section className="mt-12 bg-slate-800/50 rounded-xl p-6 md:p-8 border border-slate-700">
          <h2 className="text-2xl font-bold mb-6 text-center">
            <i className="fas fa-question-circle text-poke-yellow mr-2"></i>
            ¿Cómo participar?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard
              number={1}
              icon="fa-search"
              title="Encuentra un torneo"
              description="Busca un torneo con inscripciones abiertas que te interese"
            />
            <StepCard
              number={2}
              icon="fa-terminal"
              title="Inscríbete in-game"
              description="Usa el comando /torneo join [CÓDIGO] en el servidor"
            />
            <StepCard
              number={3}
              icon="fa-gamepad"
              title="¡Compite!"
              description="Cuando el torneo comience, tus batallas se registrarán automáticamente"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

// Componente de botón de filtro
function FilterButton({ 
  active, 
  onClick, 
  label, 
  count, 
  color = 'yellow' 
}: { 
  active: boolean; 
  onClick: () => void; 
  label: string; 
  count: number;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    yellow: 'bg-poke-yellow text-black',
    green: 'bg-green-600 text-white',
    blue: 'bg-blue-600 text-white',
    gray: 'bg-slate-600 text-white',
  };

  return (
    <button
      onClick={() => {
        playSound('click');
        onClick();
      }}
      className={`
        px-4 py-2 rounded-full font-medium transition-all
        ${active 
          ? colorClasses[color] 
          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
        }
      `}
    >
      {label}
      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${active ? 'bg-black/20' : 'bg-slate-700'}`}>
        {count}
      </span>
    </button>
  );
}

// Componente de tarjeta de torneo
function TournamentCard({ tournament, onRegister }: { tournament: Tournament; onRegister?: () => void }) {
  const isActive = tournament.status === 'active';
  const isRegistration = tournament.status === 'registration';
  const isCompleted = tournament.status === 'completed';
  const [registering, setRegistering] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        // Check if user is already registered
        const registered = tournament.participants?.some(
          (p: any) => p.minecraftUuid === userData.minecraftUuid
        );
        setIsRegistered(registered || false);
      } catch (e) {}
    }
  }, [tournament.participants]);

  const handleRegister = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      playSound('error');
      alert('Debes iniciar sesión con Discord primero');
      return;
    }

    if (!user.minecraftUuid) {
      playSound('error');
      alert('Debes verificar tu cuenta de Minecraft primero. Ve a la página de verificación.');
      return;
    }

    try {
      setRegistering(true);
      await tournamentsAPI.register(
        tournament.code,
        user.minecraftUuid,
        user.minecraftUsername || user.discordUsername
      );
      playSound('success');
      setIsRegistered(true);
      if (onRegister) onRegister();
    } catch (err: any) {
      playSound('error');
      alert(err.message || 'Error al inscribirse');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div
      className={`
        bg-slate-800 rounded-xl border-2 overflow-hidden
        transition-all duration-300 hover:shadow-xl
        ${isActive ? 'border-green-500/50 shadow-lg shadow-green-500/10' : ''}
        ${isRegistration ? 'border-blue-500/50' : ''}
        ${isCompleted ? 'border-slate-700 grayscale-[30%]' : ''}
        ${!isActive && !isRegistration && !isCompleted ? 'border-slate-700' : ''}
      `}
    >
      {/* Header con estado */}
      <Link href={`/torneos/${tournament._id}`} onClick={() => playSound('click')}>
        <div className="relative p-4 pb-0">
          <div className="flex justify-between items-start mb-3">
            <span className={`
              px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
              ${isActive ? 'bg-green-500/20 text-green-400' : ''}
              ${isRegistration ? 'bg-blue-500/20 text-blue-400' : ''}
              ${isCompleted ? 'bg-slate-700 text-slate-400' : ''}
              ${tournament.status === 'upcoming' ? 'bg-yellow-500/20 text-yellow-400' : ''}
            `}>
              {getStatusText(tournament.status)}
            </span>
            
            {/* Código del torneo */}
            <span className="font-mono text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
              {tournament.code}
            </span>
          </div>

          {/* Indicador pulsante para torneos activos */}
          {isActive && (
            <div className="absolute top-4 right-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-4">
          <h3 className="text-xl font-bold mb-2 line-clamp-1">{tournament.name}</h3>
          <p className="text-slate-400 text-sm mb-4 line-clamp-2">{tournament.description}</p>

          {/* Info */}
          <div className="space-y-2 border-t border-slate-700 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-2">
                <i className="fas fa-users w-4"></i>
                Participantes
              </span>
              <span className="text-slate-300 font-medium">
                {tournament.participants?.length || 0} / {tournament.maxParticipants}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-2">
                <i className="fas fa-calendar w-4"></i>
                Fecha
              </span>
              <span className="text-slate-300">
                {new Date(tournament.startDate).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-2">
                <i className="fas fa-sitemap w-4"></i>
                Formato
              </span>
              <span className="text-slate-300">
                {tournament.bracketType === 'single' ? 'Eliminación Simple' : 'Eliminación Doble'}
              </span>
            </div>

            {tournament.prizes && (
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="text-slate-500 text-xs mb-2 flex items-center gap-2">
                  <i className="fas fa-trophy text-yellow-500"></i>
                  Premios
                </div>
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-3 border border-yellow-500/20">
                  <div className="text-sm text-yellow-200 space-y-1">
                    {tournament.prizes.split(/[-,]/).map((prize: string, idx: number) => {
                      const trimmed = prize.trim();
                      if (!trimmed) return null;
                      const placeMatch = trimmed.match(/^(\d+[°#]?\s*(?:Lugar)?:?\s*)/i);
                      if (placeMatch) {
                        return (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="text-yellow-400 font-bold min-w-[60px]">
                              {placeMatch[1].replace('Lugar', '').replace(':', '').trim()}°
                            </span>
                            <span className="text-yellow-100">
                              {trimmed.replace(placeMatch[1], '').trim()}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <i className="fas fa-star text-yellow-500 text-xs"></i>
                          <span>{trimmed}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Ganador si está completado */}
            {isCompleted && tournament.winnerUsername && (
              <div className="flex justify-between text-sm mt-2 pt-2 border-t border-slate-700">
                <span className="text-slate-500 flex items-center gap-2">
                  <i className="fas fa-crown w-4 text-yellow-500"></i>
                  Campeón
                </span>
                <span className="text-yellow-400 font-bold">
                  {tournament.winnerUsername}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Footer con CTA */}
      <div className="px-4 pb-4">
        {isRegistration ? (
          <div className="space-y-2">
            {isRegistered ? (
              <div className="w-full py-2 rounded-lg text-center text-sm font-medium bg-green-600/20 text-green-400">
                <i className="fas fa-check mr-2"></i>
                ¡Ya estás inscrito!
              </div>
            ) : (
              <button
                onClick={handleRegister}
                disabled={registering || (tournament.participants?.length || 0) >= tournament.maxParticipants}
                className={`
                  w-full py-3 rounded-lg text-sm font-bold transition-all
                  ${registering ? 'bg-blue-600/50 cursor-wait' : 'bg-blue-600 hover:bg-blue-500 active:scale-95'}
                  text-white disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {registering ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Inscribiendo...
                  </>
                ) : (tournament.participants?.length || 0) >= tournament.maxParticipants ? (
                  <>
                    <i className="fas fa-ban mr-2"></i>
                    Torneo lleno
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus mr-2"></i>
                    ¡Inscribirme ahora!
                  </>
                )}
              </button>
            )}
            <p className="text-xs text-slate-500 text-center">
              O usa <code className="bg-slate-700 px-1 rounded">/torneo join {tournament.code}</code> in-game
            </p>
          </div>
        ) : (
          <Link
            href={`/torneos/${tournament._id}`}
            className={`
              block w-full py-2 rounded-lg text-center text-sm font-medium
              ${isActive ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' : ''}
              ${isCompleted ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : ''}
              ${tournament.status === 'upcoming' ? 'bg-yellow-600/20 text-yellow-400' : ''}
            `}
          >
            {isActive && 'Ver bracket en vivo'}
            {isCompleted && 'Ver resultados'}
            {tournament.status === 'upcoming' && 'Próximamente'}
          </Link>
        )}
      </div>
    </div>
  );
}

// Componente de paso
function StepCard({ 
  number, 
  icon, 
  title, 
  description 
}: { 
  number: number; 
  icon: string; 
  title: string; 
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="relative inline-block mb-4">
        <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center">
          <i className={`fas ${icon} text-2xl text-poke-yellow`}></i>
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-poke-yellow rounded-full flex items-center justify-center text-black font-bold">
          {number}
        </div>
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}
