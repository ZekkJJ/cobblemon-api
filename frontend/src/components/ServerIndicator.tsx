'use client';

import { useState, useEffect } from 'react';
import { serverAPI } from '@/src/lib/api-client';

interface ServerStatus {
  online: boolean;
  players: {
    online: number;
    max: number;
  };
}

export default function ServerIndicator() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const data = await serverAPI.getStatus();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching server status:', error);
      setStatus({ online: false, players: { online: 0, max: 0 } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse"></div>
        <span className="hidden md:inline">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div
        className={`w-2 h-2 rounded-full ${
          status?.online ? 'bg-poke-green glow-green' : 'bg-poke-red glow-red'
        }`}
      ></div>
      <span className="hidden md:inline">
        {status?.online ? (
          <>
            <span className="text-poke-green font-bold">Online</span>
            {' '}({status.players.online}/{status.players.max})
          </>
        ) : (
          <span className="text-poke-red font-bold">Offline</span>
        )}
      </span>
    </div>
  );
}
