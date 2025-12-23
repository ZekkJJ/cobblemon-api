'use client';

import { useState, useEffect } from 'react';
import { tournamentsAPI } from '@/src/lib/api-client';

interface Tournament {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  status: 'upcoming' | 'active' | 'completed';
  maxParticipants: number;
  participants: string[];
  prizes?: string;
}

export default function TournamentTicker() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveTournaments();
  }, []);

  const fetchActiveTournaments = async () => {
    try {
      const data = await tournamentsAPI.getAll();
      // Filtrar solo torneos activos
      const active = Array.isArray(data) 
        ? data.filter((t: Tournament) => t.status === 'active')
        : [];
      setTournaments(active);
    } catch (err) {
      console.error('Error fetching tournaments:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || tournaments.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-poke-red via-poke-yellow to-poke-red py-3 overflow-hidden">
      <div className="relative">
        {/* Animated ticker */}
        <div className="flex animate-scroll-left whitespace-nowrap">
          {/* Duplicar contenido para scroll infinito */}
          {[...tournaments, ...tournaments].map((tournament, index) => (
            <div
              key={`${tournament._id}-${index}`}
              className="inline-flex items-center gap-4 px-8"
            >
              {/* Indicador pulsante */}
              <div className="relative flex h-3 w-3 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </div>

              {/* Título */}
              <span className="text-white font-bold text-lg">
                {tournament.title}
              </span>

              {/* Separador */}
              <span className="text-white/50">•</span>

              {/* Participantes */}
              <span className="text-white/90 text-sm">
                <i className="fas fa-users mr-1"></i>
                {tournament.participants?.length || 0}/{tournament.maxParticipants}
              </span>

              {/* Premios */}
              {tournament.prizes && (
                <>
                  <span className="text-white/50">•</span>
                  <span className="text-white/90 text-sm">
                    <i className="fas fa-trophy mr-1"></i>
                    {tournament.prizes}
                  </span>
                </>
              )}

              {/* Separador entre torneos */}
              <span className="text-white/30 mx-4">|</span>
            </div>
          ))}
        </div>
      </div>

      {/* CSS para la animación */}
      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll-left {
          animation: scroll-left 30s linear infinite;
        }

        .animate-scroll-left:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
