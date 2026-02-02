'use client';

/**
 * My Listings Page
 * Cobblemon Los Pitufos
 * 
 * Página para ver y gestionar los listings del usuario.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ShoppingCart, 
  ArrowLeft, 
  Plus,
} from 'lucide-react';
import { MyListingsPage } from '@/components/player-shop/MyListingsPage';
import { CreateListingModal } from '@/components/player-shop/CreateListingModal';
import { AnimatePresence } from 'framer-motion';
import { LocalUser } from '@/lib/types/user';

export default function MisVentasPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userSession, setUserSession] = useState<{ minecraftUuid: string } | null>(null);

  // Load user from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    console.log('[MisVentasPage] localStorage user:', userStr);
    if (userStr) {
      try {
        const user: LocalUser = JSON.parse(userStr);
        console.log('[MisVentasPage] Parsed user:', user);
        console.log('[MisVentasPage] minecraftUuid:', user.minecraftUuid);
        if (user.minecraftUuid) {
          setUserSession({ minecraftUuid: user.minecraftUuid });
        } else {
          console.log('[MisVentasPage] No minecraftUuid in user - not verified?');
        }
      } catch (error) {
        console.error('Error parsing user:', error);
      }
    } else {
      console.log('[MisVentasPage] No user in localStorage');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/mercado"
                className="p-2 rounded-lg bg-slate-800/50 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                  <ShoppingCart className="w-7 h-7 text-purple-400" />
                  Mis Ventas
                </h1>
                <p className="text-gray-400 mt-1">
                  Gestiona tus listings en el mercado
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 
                       text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              <Plus className="w-5 h-5" />
              Vender Pokémon
            </motion.button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <MyListingsPage userSession={userSession} />
      </div>

      {/* Create Listing Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateListingModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              window.location.reload();
            }}
            userSession={userSession}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
