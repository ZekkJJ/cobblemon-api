'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BannerCard,
  PullAnimation,
  ResultsModal,
  PityDisplay,
  DailyPullSection,
  StardustDisplay,
  EpitomizedPathSelector,
} from '@/components/gacha';
import {
  GachaBanner,
  GachaReward,
  PityStatus,
  GachaPullResult,
  GachaMultiPullResult
} from '@/lib/types/gacha';
import { apiClient } from '@/lib/api-client';

// Canciones para el gacha - archivos en /public/sounds/
const GACHA_MUSIC = [
  { name: 'Littleroot Town', src: '/sounds/littleroot-town.mp3' },
  { name: 'White Forest', src: '/sounds/white-forest.mp3' },
];

interface LocalUser {
  discordId: string;
  discordUsername: string;
  avatar?: string;
  minecraftUuid?: string;
  minecraftUsername?: string;
  isMinecraftVerified?: boolean;
  cobbleDollarsBalance?: number;
}

// Componente de música del gacha
function GachaMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.15;
    audio.loop = false;
    audioRef.current = audio;

    audio.addEventListener('ended', () => {
      setCurrentTrack((prev) => (prev + 1) % GACHA_MUSIC.length);
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    if (audioRef.current && hasInteracted) {
      audioRef.current.src = GACHA_MUSIC[currentTrack].src;
      audioRef.current.play().catch(() => { });
      setIsPlaying(true);
    }
  }, [currentTrack, hasInteracted]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        if (audioRef.current) {
          audioRef.current.src = GACHA_MUSIC[currentTrack].src;
          audioRef.current.play().catch(() => { });
          setIsPlaying(true);
        }
      }
    };

    document.addEventListener('click', handleFirstInteraction, { once: true });
    return () => document.removeEventListener('click', handleFirstInteraction);
  }, [hasInteracted, currentTrack]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setHasInteracted(true);
      audioRef.current.src = GACHA_MUSIC[currentTrack].src;
      audioRef.current.play().catch(() => { });
      setIsPlaying(true);
    }
  };

  const nextTrack = () => {
    setCurrentTrack((prev) => (prev + 1) % GACHA_MUSIC.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-40"
    >
      <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2 border border-purple-500/30 shadow-lg">
        <button
          onClick={togglePlay}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-600/50 hover:bg-purple-600 transition-colors"
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>

        <div className="w-28 overflow-hidden">
          <motion.div
            animate={isPlaying ? { x: [0, -100, 0] } : {}}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="whitespace-nowrap text-xs text-gray-300"
          >
            🎵 {GACHA_MUSIC[currentTrack].name}
          </motion.div>
        </div>

        <button
          onClick={nextTrack}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-700/50 hover:bg-gray-600 transition-colors text-xs"
        >
          ⏭️
        </button>
      </div>
    </motion.div>
  );
}

export default function GachaPage() {
  const router = useRouter();

  // State
  const [banners, setBanners] = useState<GachaBanner[]>([]);
  const [selectedBanner, setSelectedBanner] = useState<GachaBanner | null>(null);
  const [pityStatus, setPityStatus] = useState<PityStatus | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPulling, setIsPulling] = useState(false);
  const [pullResults, setPullResults] = useState<GachaReward[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<LocalUser | null>(null);
  const [epitomizedTarget, setEpitomizedTarget] = useState<string | undefined>();
  const [isFirstTimeObtain, setIsFirstTimeObtain] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const userStr = localStorage.getItem('user');
        let localUser: LocalUser | null = null;

        if (userStr) {
          try {
            localUser = JSON.parse(userStr);
            setUser(localUser);
          } catch (e) {
            console.error('Error parsing user from localStorage:', e);
          }
        }

        if (localUser?.discordId) {
          try {
            const sessionRes = await apiClient.get(`/api/auth/session?discordId=${localUser.discordId}`);
            if (sessionRes.success && sessionRes.user) {
              setUser(sessionRes.user);
              setBalance(sessionRes.user.cobbleDollarsBalance || 0);
            }
          } catch (err) {
            console.error('Error fetching session:', err);
            setBalance(localUser.cobbleDollarsBalance || 0);
          }
        }

        const bannersRes = await apiClient.get('/api/pokemon-gacha/banners');
        if (bannersRes.banners) {
          const bannerList = bannersRes.banners;
          setBanners(bannerList);
          if (bannerList.length > 0) {
            setSelectedBanner(bannerList[0]);
          }
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('Error loading gacha data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch pity when banner changes
  useEffect(() => {
    const fetchPity = async () => {
      if (!selectedBanner || !user?.discordId) return;

      try {
        const res = await apiClient.get(`/api/pokemon-gacha/pity/${selectedBanner.bannerId}?discordId=${user.discordId}`);
        if (res.pityStatus) {
          setPityStatus(res.pityStatus);
        }
      } catch (err) {
        console.error('Error fetching pity:', err);
      }
    };

    fetchPity();
  }, [selectedBanner, user]);

  const generateIdempotencyKey = () => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  };

  // Handle single pull
  const handleSinglePull = async () => {
    if (!selectedBanner || !user?.discordId) {
      setError('You must sign in to make pulls');
      return;
    }

    if (balance < selectedBanner.singlePullCost) {
      setError(`Insufficient balance. You need ${selectedBanner.singlePullCost} CD`);
      return;
    }

    try {
      setIsPulling(true);
      setError(null);
      setShowAnimation(true);

      const res = await apiClient.post('/api/pokemon-gacha/pull', {
        bannerId: selectedBanner.bannerId,
        discordId: user.discordId,
        idempotencyKey: generateIdempotencyKey(),
      });

      if (res.success || res.data?.success) {
        const result = (res.data || res) as GachaPullResult;
        setPullResults([result.reward]);
        setBalance(result.newBalance);
        setPityStatus(result.pityStatus);
        // Check if first time obtain (would come from backend)
        setIsFirstTimeObtain(result.reward.rarity === 'mythic' || result.reward.isShiny);
      } else {
        setError(res.error || 'Error making pull');
        setShowAnimation(false);
      }
    } catch (err: any) {
      console.error('Pull error:', err);
      setError(err.message || 'Error making pull');
      setShowAnimation(false);
    } finally {
      setIsPulling(false);
    }
  };

  // Handle multi pull
  const handleMultiPull = async () => {
    if (!selectedBanner || !user?.discordId) {
      setError('You must sign in to make pulls');
      return;
    }

    if (balance < selectedBanner.multiPullCost) {
      setError(`Insufficient balance. You need ${selectedBanner.multiPullCost} CD`);
      return;
    }

    try {
      setIsPulling(true);
      setError(null);
      setShowAnimation(true);

      const res = await apiClient.post('/api/pokemon-gacha/multi-pull', {
        bannerId: selectedBanner.bannerId,
        discordId: user.discordId,
        idempotencyKey: generateIdempotencyKey(),
      });

      if (res.success || res.data?.success) {
        const result = (res.data || res) as GachaMultiPullResult;
        setPullResults(result.rewards);
        setBalance(result.newBalance);
        setPityStatus(result.pityStatus);
        // Check for first time mythic/shiny
        const hasSpecial = result.rewards.some(r => r.rarity === 'mythic' || r.isShiny);
        setIsFirstTimeObtain(hasSpecial);
      } else {
        setError(res.error || 'Error making pulls');
        setShowAnimation(false);
      }
    } catch (err: any) {
      setError(err.message || 'Error making pulls');
      setShowAnimation(false);
    } finally {
      setIsPulling(false);
    }
  };

  // Handle daily pull
  const handleDailyPull = async () => {
    if (!user?.discordId) {
      setError('You must sign in');
      return;
    }

    try {
      setIsPulling(true);
      setError(null);
      setShowAnimation(true);

      const res = await apiClient.post('/api/pokemon-gacha/daily-pull', {
        discordId: user.discordId,
      });

      if (res.success) {
        setPullResults([res.reward]);
        setBalance(res.newBalance);
        setPityStatus(res.pityStatus);
        setIsFirstTimeObtain(res.reward.rarity === 'mythic' || res.reward.isShiny);
      } else {
        setError(res.error || 'Error making daily pull');
        setShowAnimation(false);
      }
    } catch (err: any) {
      setError(err.message || 'Error making daily pull');
      setShowAnimation(false);
    } finally {
      setIsPulling(false);
    }
  };

  const handleAnimationComplete = useCallback(() => {
    setShowAnimation(false);
    setShowResults(true);
  }, []);

  const handleResultsClose = () => {
    setShowResults(false);
    setPullResults([]);
    setIsFirstTimeObtain(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading Gacha...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-white text-center mb-2">
            🎰 Pokémon Gacha
          </h1>
          <p className="text-white/80 text-center">
            Pull to get Pokémon and rare items!
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Balance Display */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800/80 rounded-xl px-6 py-3 flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <p className="text-xs text-gray-400">Your Balance</p>
              <p className="text-2xl font-bold text-yellow-400">{balance.toLocaleString()} CD</p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mb-6 bg-red-500/20 border border-red-500 rounded-xl p-4 text-center"
          >
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Not logged in warning */}
        {!user && (
          <div className="max-w-md mx-auto mb-8 bg-yellow-500/20 border border-yellow-500 rounded-xl p-4 text-center">
            <p className="text-yellow-400 mb-2">You must sign in to make pulls</p>
            <button
              onClick={() => router.push('/auth/callback')}
              className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Sign In
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Banners List */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-white mb-4">Available Banners</h2>

            {banners.length === 0 ? (
              <div className="bg-gray-800/50 rounded-xl p-8 text-center">
                <p className="text-gray-400">No banners available</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {banners.map((banner) => (
                  <BannerCard
                    key={banner.bannerId}
                    banner={banner}
                    onSelect={setSelectedBanner}
                    isSelected={selectedBanner?.bannerId === banner.bannerId}
                    hasEpitomizedPath={banner.type === 'limited' && !!epitomizedTarget}
                    epitomizedTarget={epitomizedTarget}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pull Controls */}
          <div className="space-y-6">
            {/* Daily Pull Section */}
            {user && (
              <DailyPullSection
                discordId={user.discordId}
                onPull={handleDailyPull}
                isPulling={isPulling}
              />
            )}

            {/* Stardust Display */}
            {user && (
              <StardustDisplay
                discordId={user.discordId}
                onBalanceChange={(newBalance) => {
                  // Stardust balance changed
                }}
              />
            )}

            {/* Pity Display */}
            {selectedBanner && (
              <PityDisplay pityStatus={pityStatus} isLoading={!pityStatus && !!user} />
            )}

            {/* Epitomized Path (for limited banners) */}
            {selectedBanner && selectedBanner.type === 'limited' && user && (
              <EpitomizedPathSelector
                banner={selectedBanner}
                discordId={user.discordId}
                onTargetSet={(target) => setEpitomizedTarget(target.nameEs || target.name)}
              />
            )}

            {/* Pull Buttons */}
            {selectedBanner && user && (
              <div className="bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 text-center">
                  {selectedBanner.nameEs}
                </h3>

                <div className="space-y-3">
                  {/* Single Pull */}
                  <button
                    onClick={handleSinglePull}
                    disabled={isPulling || balance < selectedBanner.singlePullCost}
                    className={`
                      w-full py-4 rounded-xl font-bold text-lg transition-all
                      ${balance >= selectedBanner.singlePullCost
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500 hover:scale-105'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }
                      ${isPulling ? 'opacity-50 cursor-wait' : ''}
                    `}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>Pull x1</span>
                      <span className="text-yellow-300">{selectedBanner.singlePullCost} CD</span>
                    </span>
                  </button>

                  {/* Multi Pull */}
                  <button
                    onClick={handleMultiPull}
                    disabled={isPulling || balance < selectedBanner.multiPullCost}
                    className={`
                      w-full py-4 rounded-xl font-bold text-lg transition-all
                      ${balance >= selectedBanner.multiPullCost
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 hover:scale-105'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }
                      ${isPulling ? 'opacity-50 cursor-wait' : ''}
                    `}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>Pull x10</span>
                      <span className="text-yellow-300">{selectedBanner.multiPullCost} CD</span>
                      <span className="text-xs bg-green-500/30 text-green-400 px-2 py-0.5 rounded">-10%</span>
                    </span>
                  </button>
                </div>

                {/* Rates Info */}
                <div className="mt-4 text-xs text-gray-500 text-center">
                  <p>Epic: 1% | Legendary: 0.4% | Mythic: 0.1%</p>
                  <p>Shiny: 1/4096 | Soft Pity: 350 | Hard Pity: 400</p>
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="bg-gray-800/50 rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-3">Quick Links</h3>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/gacha/history')}
                  className="w-full py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm text-left"
                >
                  📜 View History
                </button>
                <button
                  onClick={() => router.push('/gacha/stats')}
                  className="w-full py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm text-left"
                >
                  📊 View Statistics
                </button>
                <button
                  onClick={() => router.push('/tienda')}
                  className="w-full py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm text-left"
                >
                  🛒 Buy CobbleDollars
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pull Animation */}
      <PullAnimation
        isPlaying={showAnimation}
        rewards={pullResults}
        onComplete={handleAnimationComplete}
      />

      {/* Results Modal */}
      <ResultsModal
        isOpen={showResults}
        rewards={pullResults}
        onClose={handleResultsClose}
        isFirstTimeObtain={isFirstTimeObtain}
      />

      {/* Gacha Music Player */}
      <GachaMusicPlayer />
    </div>
  );
}
