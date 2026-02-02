'use client';

/**
 * Bid History Panel Component
 * Cobblemon Los Pitufos
 * 
 * Panel que muestra el historial de pujas de una subasta.
 */

import { motion } from 'framer-motion';
import { Gavel, Crown, Clock, User } from 'lucide-react';
import { Bid, formatPrice } from '@/lib/types/player-shop';

interface BidHistoryPanelProps {
  bids: Bid[];
  currentBidderId?: string;
}

export function BidHistoryPanel({ bids, currentBidderId }: BidHistoryPanelProps) {
  if (bids.length === 0) {
    return (
      <div className="text-center py-6">
        <Gavel className="w-10 h-10 text-gray-600 mx-auto mb-2" />
        <p className="text-gray-500">No hay pujas todavía</p>
        <p className="text-sm text-gray-600">¡Sé el primero en pujar!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Gavel className="w-4 h-4" />
        <span>{bids.length} {bids.length === 1 ? 'puja' : 'pujas'}</span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
        {bids.map((bid, index) => {
          const isWinning = bid.bidderId === currentBidderId && bid.status === 'active';
          const isOutbid = bid.status === 'outbid';
          const isWon = bid.status === 'won';
          
          return (
            <motion.div
              key={bid._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors
                        ${isWinning 
                          ? 'bg-green-500/10 border border-green-500/30' 
                          : isWon
                            ? 'bg-yellow-500/10 border border-yellow-500/30'
                            : isOutbid
                              ? 'bg-slate-700/30 border border-slate-600/30'
                              : 'bg-slate-700/50 border border-slate-600/50'}`}
            >
              <div className="flex items-center gap-3">
                {/* Position/Status Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center
                              ${isWinning || isWon
                                ? 'bg-yellow-500/20'
                                : 'bg-slate-600/50'}`}>
                  {isWinning || isWon ? (
                    <Crown className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <User className="w-4 h-4 text-gray-400" />
                  )}
                </div>

                {/* Bidder Info */}
                <div>
                  <p className={`font-medium ${isOutbid ? 'text-gray-500' : 'text-white'}`}>
                    {bid.bidderUsername}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(new Date(bid.createdAt))}
                    {isWinning && (
                      <span className="text-green-400 font-medium">• Ganando</span>
                    )}
                    {isWon && (
                      <span className="text-yellow-400 font-medium">• Ganador</span>
                    )}
                    {isOutbid && (
                      <span className="text-gray-500">• Superado</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bid Amount */}
              <div className="text-right">
                <p className={`font-bold ${isOutbid ? 'text-gray-500' : 'text-white'}`}>
                  {formatPrice(bid.amount)}
                  <span className="text-sm font-normal text-purple-400 ml-1">CD</span>
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  return `Hace ${diffDays}d`;
}
