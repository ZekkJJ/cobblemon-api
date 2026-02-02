'use client';

/**
 * Create Listing Modal
 * Cobblemon Los Pitufos
 * 
 * Modal para crear un nuevo listing en el mercado de jugadores.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  X,
  ShoppingCart,
  Gavel,
  TrendingUp,
  Sparkles,
  Clock,
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import {
  SaleMethod,
  CreateListingData,
  getPowerTier,
  getPowerColor,
  formatPrice
} from '@/lib/types/player-shop';
import { Pokemon } from '@/lib/types/pokemon';

interface CreateListingModalProps {
  onClose: () => void;
  onSuccess: () => void;
  userSession: any;
}

type StorageTab = 'party' | 'pc';

interface PokemonWithPitufipuntos extends Pokemon {
  estimatedPitufipuntos?: number;
}

export function CreateListingModal({ onClose, onSuccess, userSession }: CreateListingModalProps) {
  // State
  const [step, setStep] = useState<'select' | 'configure' | 'confirm'>('select');
  const [storageTab, setStorageTab] = useState<StorageTab>('party');
  const [pcBoxIndex, setPcBoxIndex] = useState(0);

  const [partyPokemon, setPartyPokemon] = useState<PokemonWithPitufipuntos[]>([]);
  const [pcBoxes, setPcBoxes] = useState<{ name: string; pokemon: (PokemonWithPitufipuntos | null)[] }[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonWithPitufipuntos | null>(null);

  const [saleMethod, setSaleMethod] = useState<SaleMethod>('direct');
  const [price, setPrice] = useState('');
  const [startingBid, setStartingBid] = useState('');
  const [duration, setDuration] = useState<24 | 48 | 72>(24);

  const [loading, setLoading] = useState(false);
  const [loadingPokemon, setLoadingPokemon] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch user's Pokemon
  useEffect(() => {
    fetchUserPokemon();
  }, [userSession]);

  const fetchUserPokemon = async () => {
    // No user session - show not logged in state
    if (!userSession?.minecraftUuid) {
      console.log('[CreateListingModal] No minecraftUuid in userSession:', userSession);
      setError('You must sign in with Discord and verify your Minecraft account to sell Pokémon.');
      setLoadingPokemon(false);
      return;
    }

    console.log('[CreateListingModal] Fetching pokemon for UUID:', userSession.minecraftUuid);
    setLoadingPokemon(true);
    try {
      const response = await apiClient.get(`/api/players/${userSession.minecraftUuid}`);
      console.log('[CreateListingModal] API Response:', response);

      // Backend returns 'profile' not 'player'
      if (response.success && response.profile) {
        const player = response.profile;
        console.log('[CreateListingModal] Player data:', player);
        console.log('[CreateListingModal] Party:', player.party);
        console.log('[CreateListingModal] PC Storage:', player.pcStorage);

        // Set party Pokemon (backend uses 'party' not 'pokemonParty')
        setPartyPokemon(player.party || []);

        // Set PC boxes - backend stores as array of boxes with pokemon arrays
        const pcPokemon = player.pcStorage || [];
        console.log('[CreateListingModal] PC Storage raw:', JSON.stringify(pcPokemon).slice(0, 500));

        if (Array.isArray(pcPokemon) && pcPokemon.length > 0) {
          // Check if it's in box format (has boxNumber or pokemon array)
          if (pcPokemon[0]?.pokemon !== undefined || pcPokemon[0]?.boxNumber !== undefined) {
            // Already in box format - convert to expected structure
            const boxes = pcPokemon.map((box: any, index: number) => ({
              name: box.name || `Box ${(box.boxNumber ?? index) + 1}`,
              pokemon: box.pokemon || []
            }));
            console.log('[CreateListingModal] Converted boxes:', boxes.length, 'boxes');
            boxes.forEach((box: any, i: number) => {
              console.log(`  Box ${i}: ${box.pokemon?.length || 0} pokemon`);
            });
            setPcBoxes(boxes);
          } else if (pcPokemon[0]?.species) {
            // Flat array of pokemon - convert to boxes of 30
            const boxes: { name: string; pokemon: (PokemonWithPitufipuntos | null)[] }[] = [];
            for (let i = 0; i < pcPokemon.length; i += 30) {
              const boxPokemon = pcPokemon.slice(i, i + 30);
              boxes.push({
                name: `Box ${boxes.length + 1}`,
                pokemon: boxPokemon
              });
            }
            setPcBoxes(boxes);
          } else {
            console.log('[CreateListingModal] Unknown PC format');
            setPcBoxes([]);
          }
        } else {
          setPcBoxes([]);
        }
      } else {
        console.log('[CreateListingModal] No profile in response or success=false');
        setError('Could not load your Pokémon');
      }
    } catch (err: any) {
      console.error('[CreateListingModal] Error:', err);
      setError(err.message || 'Error loading Pokémon');
    } finally {
      setLoadingPokemon(false);
    }
  };

  // Calculate estimated Pitufipuntos (client-side approximation)
  const estimatePitufipuntos = (pokemon: Pokemon): number => {
    if (!pokemon) return 0;

    let total = 0;

    // Base stat estimate (simplified)
    total += 400;

    // IV bonus
    const ivTotal = pokemon.ivs.hp + pokemon.ivs.attack + pokemon.ivs.defense +
      pokemon.ivs.spAttack + pokemon.ivs.spDefense + pokemon.ivs.speed;
    total += ivTotal * 2;

    // EV bonus
    const evTotal = pokemon.evs.hp + pokemon.evs.attack + pokemon.evs.defense +
      pokemon.evs.spAttack + pokemon.evs.spDefense + pokemon.evs.speed;
    total += Math.floor(evTotal / 4);

    // Level bonus
    total += pokemon.level * 5;

    // Shiny bonus
    if (pokemon.shiny) total += 200;

    return total;
  };

  // Handle Pokemon selection
  const handleSelectPokemon = (pokemon: PokemonWithPitufipuntos) => {
    setSelectedPokemon({
      ...pokemon,
      estimatedPitufipuntos: estimatePitufipuntos(pokemon)
    });
    setStep('configure');
    setError(null);
  };

  // Validate listing configuration
  const validateConfig = (): boolean => {
    if (saleMethod === 'direct') {
      const priceNum = parseInt(price);
      if (!priceNum || priceNum < 100 || priceNum > 10000000) {
        setError('Price must be between 100 and 10,000,000 CobbleDollars');
        return false;
      }
    } else {
      const bidNum = parseInt(startingBid);
      if (!bidNum || bidNum < 100) {
        setError('Minimum starting bid is 100 CobbleDollars');
        return false;
      }
    }
    return true;
  };

  // Handle create listing
  const handleCreateListing = async () => {
    if (!selectedPokemon || !validateConfig()) return;

    setLoading(true);
    setError(null);

    try {
      const data: CreateListingData = {
        pokemonUuid: selectedPokemon.uuid,
        saleMethod,
        sellerUuid: userSession.minecraftUuid, // Include seller UUID
        ...(saleMethod === 'direct'
          ? { price: parseInt(price) }
          : { startingBid: parseInt(startingBid), duration }
        ),
      };

      const response = await apiClient.post('/api/player-shop/listings', data);

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setError(response.error || 'Error creating listing');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  // Get sprite URL
  const getSpriteUrl = (pokemon: Pokemon) => {
    if (!pokemon) return '';
    return pokemon.shiny
      ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.speciesId}.png`
      : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.speciesId}.png`;
  };

  // Current PC box
  const currentPcBox = pcBoxes[pcBoxIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-b 
                 from-slate-800 to-slate-900 rounded-2xl border border-slate-700 shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-slate-800/95 
                      border-b border-slate-700 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {step !== 'select' && (
              <button
                onClick={() => setStep(step === 'confirm' ? 'configure' : 'select')}
                className="p-2 rounded-lg bg-slate-700 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-bold text-white">
              {step === 'select' && 'Select Pokémon'}
              {step === 'configure' && 'Configure Sale'}
              {step === 'confirm' && 'Confirm Listing'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-700/50 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Success State */}
          {success && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 
                            flex items-center justify-center">
                <Check className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Listing Created!</h3>
              <p className="text-gray-400">Your Pokémon is now on the market</p>
            </motion.div>
          )}

          {/* Error Display */}
          {error && !success && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl 
                          flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Step 1: Select Pokemon */}
          {step === 'select' && !success && (
            <div className="space-y-4">
              {/* Storage Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setStorageTab('party')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors
                            ${storageTab === 'party'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-gray-400 hover:text-white'}`}
                >
                  Party ({partyPokemon.length})
                </button>
                <button
                  onClick={() => setStorageTab('pc')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors
                            ${storageTab === 'pc'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-gray-400 hover:text-white'}`}
                >
                  PC ({pcBoxes.reduce((acc, box) => acc + (box.pokemon?.filter(Boolean).length || 0), 0)})
                </button>
              </div>

              {/* Loading State */}
              {loadingPokemon && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-square bg-slate-700/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              )}

              {/* Party Pokemon */}
              {!loadingPokemon && storageTab === 'party' && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {partyPokemon.length === 0 ? (
                    <p className="col-span-full text-center text-gray-500 py-8">
                      You have no Pokémon in your party
                    </p>
                  ) : (
                    partyPokemon.map((pokemon) => (
                      <PokemonSlot
                        key={pokemon.uuid}
                        pokemon={pokemon}
                        onClick={() => handleSelectPokemon(pokemon)}
                        getSpriteUrl={getSpriteUrl}
                      />
                    ))
                  )}
                </div>
              )}

              {/* PC Pokemon */}
              {!loadingPokemon && storageTab === 'pc' && (
                <div className="space-y-4">
                  {/* PC Box Navigation */}
                  {pcBoxes.length > 0 && (
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setPcBoxIndex(Math.max(0, pcBoxIndex - 1))}
                        disabled={pcBoxIndex === 0}
                        className="p-2 rounded-lg bg-slate-700 text-gray-400 hover:text-white 
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-gray-300 font-medium">
                        {currentPcBox?.name || `Box ${pcBoxIndex + 1}`}
                      </span>
                      <button
                        onClick={() => setPcBoxIndex(Math.min(pcBoxes.length - 1, pcBoxIndex + 1))}
                        disabled={pcBoxIndex >= pcBoxes.length - 1}
                        className="p-2 rounded-lg bg-slate-700 text-gray-400 hover:text-white 
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {/* PC Box Grid */}
                  <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                    {pcBoxes.length === 0 ? (
                      <p className="col-span-full text-center text-gray-500 py-8">
                        You have no Pokémon in PC
                      </p>
                    ) : (
                      [...Array(30)].map((_, i) => {
                        const pokemon = currentPcBox?.pokemon?.[i];
                        return pokemon ? (
                          <PokemonSlot
                            key={pokemon.uuid}
                            pokemon={pokemon}
                            onClick={() => handleSelectPokemon(pokemon)}
                            getSpriteUrl={getSpriteUrl}
                            small
                          />
                        ) : (
                          <div key={i} className="aspect-square bg-slate-700/30 rounded-lg" />
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Configure Sale */}
          {step === 'configure' && selectedPokemon && !success && (
            <div className="space-y-6">
              {/* Selected Pokemon Preview */}
              <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-xl">
                <div className="relative w-20 h-20">
                  {selectedPokemon.shiny && (
                    <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400" />
                  )}
                  <Image
                    src={getSpriteUrl(selectedPokemon)}
                    alt={selectedPokemon.species}
                    fill
                    className="object-contain pixelated"
                    unoptimized
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white capitalize">
                    {selectedPokemon.nickname || selectedPokemon.species}
                  </h3>
                  <p className="text-sm text-gray-400">Lv. {selectedPokemon.level}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <TrendingUp
                      className="w-4 h-4"
                      style={{ color: getPowerColor(selectedPokemon.estimatedPitufipuntos || 0) }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: getPowerColor(selectedPokemon.estimatedPitufipuntos || 0) }}
                    >
                      ~{(selectedPokemon.estimatedPitufipuntos || 0).toLocaleString()} PP
                    </span>
                  </div>
                </div>
              </div>

              {/* Sale Method */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Sale Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSaleMethod('direct')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                              ${saleMethod === 'direct'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'}`}
                  >
                    <ShoppingCart className={`w-8 h-8 ${saleMethod === 'direct' ? 'text-green-400' : 'text-gray-400'}`} />
                    <span className={`font-medium ${saleMethod === 'direct' ? 'text-green-400' : 'text-gray-300'}`}>
                      Direct Buy
                    </span>
                    <span className="text-xs text-gray-500">Fixed price</span>
                  </button>
                  <button
                    onClick={() => setSaleMethod('bidding')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                              ${saleMethod === 'bidding'
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'}`}
                  >
                    <Gavel className={`w-8 h-8 ${saleMethod === 'bidding' ? 'text-orange-400' : 'text-gray-400'}`} />
                    <span className={`font-medium ${saleMethod === 'bidding' ? 'text-orange-400' : 'text-gray-300'}`}>
                      Auction
                    </span>
                    <span className="text-xs text-gray-500">Competitive bidding</span>
                  </button>
                </div>
              </div>

              {/* Price Configuration */}
              {saleMethod === 'direct' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Price (CobbleDollars)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Minimum 100"
                    min={100}
                    max={10000000}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl
                             text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Range: 100 - 10,000,000 CobbleDollars
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Starting Bid (CobbleDollars)
                    </label>
                    <input
                      type="number"
                      value={startingBid}
                      onChange={(e) => setStartingBid(e.target.value)}
                      placeholder="Minimum 100"
                      min={100}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl
                               text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Auction Duration
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {([24, 48, 72] as const).map((hours) => (
                        <button
                          key={hours}
                          onClick={() => setDuration(hours)}
                          className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all
                                    ${duration === hours
                              ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                              : 'border-slate-600 bg-slate-700/50 text-gray-400 hover:border-slate-500'}`}
                        >
                          <Clock className="w-4 h-4" />
                          {hours}h
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Continue Button */}
              <button
                onClick={() => {
                  if (validateConfig()) {
                    setStep('confirm');
                  }
                }}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white 
                         font-bold rounded-xl hover:from-purple-500 hover:to-blue-500 transition-all"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && selectedPokemon && !success && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="p-4 bg-slate-700/50 rounded-xl space-y-4">
                <h3 className="font-bold text-white">Listing Summary</h3>

                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16">
                    <Image
                      src={getSpriteUrl(selectedPokemon)}
                      alt={selectedPokemon.species}
                      fill
                      className="object-contain pixelated"
                      unoptimized
                    />
                  </div>
                  <div>
                    <p className="font-medium text-white capitalize">
                      {selectedPokemon.nickname || selectedPokemon.species}
                    </p>
                    <p className="text-sm text-gray-400">Lv. {selectedPokemon.level}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-600 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Method:</span>
                    <span className="text-white">
                      {saleMethod === 'direct' ? 'Direct Buy' : 'Auction'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      {saleMethod === 'direct' ? 'Price:' : 'Starting Bid:'}
                    </span>
                    <span className="text-white font-bold">
                      {formatPrice(parseInt(saleMethod === 'direct' ? price : startingBid))} CD
                    </span>
                  </div>
                  {saleMethod === 'bidding' && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white">{duration} hours</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Warning */}
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <p className="text-yellow-400 text-sm">
                  ⚠️ Your Pokémon will be removed from your storage while listed.
                  {saleMethod === 'bidding' && ' You cannot cancel the auction if there are active bids.'}
                </p>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleCreateListing}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white 
                         font-bold rounded-xl hover:from-green-500 hover:to-emerald-500 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Creating...' : 'Confirm and Publish'}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Pokemon Slot Component
function PokemonSlot({
  pokemon,
  onClick,
  getSpriteUrl,
  small = false
}: {
  pokemon: Pokemon;
  onClick: () => void;
  getSpriteUrl: (p: Pokemon) => string;
  small?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative bg-slate-700/50 rounded-xl border border-slate-600 
                hover:border-purple-500 transition-all overflow-hidden group
                ${small ? 'aspect-square' : 'aspect-square'}`}
    >
      {pokemon.shiny && (
        <div className="absolute top-1 right-1 z-10">
          <Sparkles className="w-3 h-3 text-yellow-400" />
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <Image
          src={getSpriteUrl(pokemon)}
          alt={pokemon.species}
          width={small ? 40 : 60}
          height={small ? 40 : 60}
          className="pixelated group-hover:scale-110 transition-transform"
          unoptimized
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-1">
        <p className="text-xs text-white truncate capitalize text-center">
          {pokemon.nickname || pokemon.species}
        </p>
        <p className="text-xs text-gray-400 text-center">Lv.{pokemon.level}</p>
      </div>
    </motion.button>
  );
}
