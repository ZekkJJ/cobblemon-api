'use client';

import { useState, useEffect } from 'react';
import { getMoveData, MoveData } from '@/lib/move-data-cache';
import { getTypeColor } from '@/lib/pokemon-type-colors';

interface MoveTooltipProps {
  moveName: string;
  children: React.ReactNode;
}

export function MoveTooltip({ moveName, children }: MoveTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [moveData, setMoveData] = useState<MoveData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !moveData && !loading) {
      setLoading(true);
      getMoveData(moveName)
        .then(setMoveData)
        .finally(() => setLoading(false));
    }
  }, [isOpen, moveName, moveData, loading]);

  const typeColor = moveData ? getTypeColor(moveData.type) : '#A8A878';

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
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3 animate-in fade-in zoom-in-95 duration-150"
          style={{ borderTopColor: typeColor, borderTopWidth: '3px' }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-2">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-500" />
            </div>
          ) : moveData ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white">{moveData.name}</span>
                <span 
                  className="px-2 py-0.5 rounded text-xs font-medium text-white uppercase"
                  style={{ backgroundColor: typeColor }}
                >
                  {moveData.type}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                <div className="bg-gray-800 rounded p-1.5 text-center">
                  <div className="text-gray-500">Poder</div>
                  <div className="text-white font-medium">
                    {moveData.power ?? '—'}
                  </div>
                </div>
                <div className="bg-gray-800 rounded p-1.5 text-center">
                  <div className="text-gray-500">Precisión</div>
                  <div className="text-white font-medium">
                    {moveData.accuracy ? `${moveData.accuracy}%` : '—'}
                  </div>
                </div>
                <div className="bg-gray-800 rounded p-1.5 text-center">
                  <div className="text-gray-500">PP</div>
                  <div className="text-white font-medium">{moveData.pp}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  moveData.damageClass === 'physical' ? 'bg-orange-500/20 text-orange-400' :
                  moveData.damageClass === 'special' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {moveData.damageClass === 'physical' ? '💪 Físico' :
                   moveData.damageClass === 'special' ? '✨ Especial' : '📊 Estado'}
                </span>
              </div>
              
              <p className="text-xs text-gray-400 leading-relaxed">
                {moveData.effectShort}
              </p>
            </>
          ) : (
            <div className="text-gray-400 text-sm text-center py-2">
              No se pudo cargar información
            </div>
          )}
          
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

export default MoveTooltip;
