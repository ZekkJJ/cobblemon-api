'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { tournamentsAPI } from '@/lib/api-client';

export function TournamentTicker() {
    const [tournaments, setTournaments] = useState<any[]>([]);

    useEffect(() => {
        tournamentsAPI.getAll()
            .then(tournaments => {
                // Backend returns array directly, not {tournaments: []}
                if (Array.isArray(tournaments)) {
                    // Filter for active or upcoming
                    const active = tournaments.filter((t: any) => t.status === 'active' || t.status === 'upcoming');
                    setTournaments(active);
                } else {
                    console.error('Tournaments API returned invalid data:', tournaments);
                    setTournaments([]);
                }
            })
            .catch(err => {
                console.error('Tournaments fetch error:', err);
                setTournaments([]);
            });
    }, []);

    if (tournaments.length === 0) return null;

    return (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 backdrop-blur-sm overflow-hidden whitespace-nowrap relative h-12 flex items-center">
            <div className="animate-marquee inline-block px-4">
                {tournaments.map((t) => (
                    <span key={t._id} className="mx-8 text-yellow-200">
                        <span className="font-bold bg-yellow-500 text-black px-2 py-0.5 rounded text-xs mr-2 uppercase">
                            {t.status === 'active' ? '🏆 EN CURSO' : '📅 PRÓXIMAMENTE'}
                        </span>
                        <Link href="/torneos" className="hover:underline font-semibold">
                            {t.title} &mdash; {t.description}
                        </Link>
                    </span>
                ))}
            </div>
            {/* Duplicate for seamless scrolling loop if needed, or CSS animation trick */}
            <style jsx>{`
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        /* Pause on hover */
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
        </div>
    );
}
