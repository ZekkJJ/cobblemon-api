'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';
import { GachaBanner } from '@/lib/types/gacha';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cobblemon-los-pitufos-backend.onrender.com';

// Lista COMPLETA de Pokemon para seleccionar como featured (incluye todos los pseudos)
const AVAILABLE_POKEMON = [
  // ========== COMMON ==========
  { pokemonId: 19, name: 'Rattata', rarity: 'common' },
  { pokemonId: 16, name: 'Pidgey', rarity: 'common' },
  { pokemonId: 10, name: 'Caterpie', rarity: 'common' },
  { pokemonId: 13, name: 'Weedle', rarity: 'common' },
  { pokemonId: 41, name: 'Zubat', rarity: 'common' },
  
  // ========== UNCOMMON ==========
  { pokemonId: 25, name: 'Pikachu', rarity: 'uncommon' },
  { pokemonId: 133, name: 'Eevee', rarity: 'uncommon' },
  { pokemonId: 147, name: 'Dratini', rarity: 'uncommon' },
  { pokemonId: 37, name: 'Vulpix', rarity: 'uncommon' },
  { pokemonId: 58, name: 'Growlithe', rarity: 'uncommon' },
  { pokemonId: 123, name: 'Scyther', rarity: 'uncommon' },
  { pokemonId: 137, name: 'Porygon', rarity: 'uncommon' },
  { pokemonId: 782, name: 'Jangmo-o', rarity: 'uncommon' },
  
  // ========== RARE ==========
  { pokemonId: 6, name: 'Charizard', rarity: 'rare' },
  { pokemonId: 9, name: 'Blastoise', rarity: 'rare' },
  { pokemonId: 3, name: 'Venusaur', rarity: 'rare' },
  { pokemonId: 131, name: 'Lapras', rarity: 'rare' },
  { pokemonId: 143, name: 'Snorlax', rarity: 'rare' },
  { pokemonId: 149, name: 'Dragonite', rarity: 'rare' },
  { pokemonId: 130, name: 'Gyarados', rarity: 'rare' },
  { pokemonId: 65, name: 'Alakazam', rarity: 'rare' },
  { pokemonId: 94, name: 'Gengar', rarity: 'rare' },
  { pokemonId: 68, name: 'Machamp', rarity: 'rare' },
  { pokemonId: 76, name: 'Golem', rarity: 'rare' },
  { pokemonId: 212, name: 'Scizor', rarity: 'rare' },
  { pokemonId: 233, name: 'Porygon2', rarity: 'rare' },
  { pokemonId: 783, name: 'Hakamo-o', rarity: 'rare' },
  
  // ========== EPIC (PSEUDO-LEGENDARIOS) ==========
  // Gen 1
  { pokemonId: 149, name: 'Dragonite', rarity: 'epic' },
  // Gen 2
  { pokemonId: 248, name: 'Tyranitar', rarity: 'epic' },
  // Gen 3
  { pokemonId: 373, name: 'Salamence', rarity: 'epic' },
  { pokemonId: 376, name: 'Metagross', rarity: 'epic' },
  // Gen 4
  { pokemonId: 445, name: 'Garchomp', rarity: 'epic' },
  // Gen 5
  { pokemonId: 635, name: 'Hydreigon', rarity: 'epic' },
  // Gen 6
  { pokemonId: 706, name: 'Goodra', rarity: 'epic' },
  // Gen 7
  { pokemonId: 784, name: 'Kommo-o', rarity: 'epic' },
  // Gen 8
  { pokemonId: 887, name: 'Dragapult', rarity: 'epic' },
  // Gen 9
  { pokemonId: 998, name: 'Baxcalibur', rarity: 'epic' },
  // Otros épicos fuertes
  { pokemonId: 289, name: 'Slaking', rarity: 'epic' },
  { pokemonId: 474, name: 'Porygon-Z', rarity: 'epic' },
  { pokemonId: 462, name: 'Magnezone', rarity: 'epic' },
  { pokemonId: 473, name: 'Mamoswine', rarity: 'epic' },
  { pokemonId: 466, name: 'Electivire', rarity: 'epic' },
  { pokemonId: 467, name: 'Magmortar', rarity: 'epic' },
  { pokemonId: 468, name: 'Togekiss', rarity: 'epic' },
  { pokemonId: 475, name: 'Gallade', rarity: 'epic' },
  { pokemonId: 448, name: 'Lucario', rarity: 'epic' },
  { pokemonId: 612, name: 'Haxorus', rarity: 'epic' },
  { pokemonId: 625, name: 'Bisharp', rarity: 'epic' },
  { pokemonId: 637, name: 'Volcarona', rarity: 'epic' },
  { pokemonId: 681, name: 'Aegislash', rarity: 'epic' },
  { pokemonId: 715, name: 'Noivern', rarity: 'epic' },
  { pokemonId: 812, name: 'Rillaboom', rarity: 'epic' },
  { pokemonId: 815, name: 'Cinderace', rarity: 'epic' },
  { pokemonId: 818, name: 'Inteleon', rarity: 'epic' },
  { pokemonId: 823, name: 'Corviknight', rarity: 'epic' },
  { pokemonId: 839, name: 'Coalossal', rarity: 'epic' },
  { pokemonId: 849, name: 'Toxtricity', rarity: 'epic' },
  { pokemonId: 879, name: 'Copperajah', rarity: 'epic' },
  { pokemonId: 884, name: 'Duraludon', rarity: 'epic' },
  
  // ========== LEGENDARY ==========
  // Gen 1
  { pokemonId: 144, name: 'Articuno', rarity: 'legendary' },
  { pokemonId: 145, name: 'Zapdos', rarity: 'legendary' },
  { pokemonId: 146, name: 'Moltres', rarity: 'legendary' },
  { pokemonId: 150, name: 'Mewtwo', rarity: 'legendary' },
  // Gen 2
  { pokemonId: 243, name: 'Raikou', rarity: 'legendary' },
  { pokemonId: 244, name: 'Entei', rarity: 'legendary' },
  { pokemonId: 245, name: 'Suicune', rarity: 'legendary' },
  { pokemonId: 249, name: 'Lugia', rarity: 'legendary' },
  { pokemonId: 250, name: 'Ho-Oh', rarity: 'legendary' },
  // Gen 3
  { pokemonId: 377, name: 'Regirock', rarity: 'legendary' },
  { pokemonId: 378, name: 'Regice', rarity: 'legendary' },
  { pokemonId: 379, name: 'Registeel', rarity: 'legendary' },
  { pokemonId: 380, name: 'Latias', rarity: 'legendary' },
  { pokemonId: 381, name: 'Latios', rarity: 'legendary' },
  { pokemonId: 382, name: 'Kyogre', rarity: 'legendary' },
  { pokemonId: 383, name: 'Groudon', rarity: 'legendary' },
  { pokemonId: 384, name: 'Rayquaza', rarity: 'legendary' },
  // Gen 4
  { pokemonId: 480, name: 'Uxie', rarity: 'legendary' },
  { pokemonId: 481, name: 'Mesprit', rarity: 'legendary' },
  { pokemonId: 482, name: 'Azelf', rarity: 'legendary' },
  { pokemonId: 483, name: 'Dialga', rarity: 'legendary' },
  { pokemonId: 484, name: 'Palkia', rarity: 'legendary' },
  { pokemonId: 485, name: 'Heatran', rarity: 'legendary' },
  { pokemonId: 486, name: 'Regigigas', rarity: 'legendary' },
  { pokemonId: 487, name: 'Giratina', rarity: 'legendary' },
  { pokemonId: 488, name: 'Cresselia', rarity: 'legendary' },
  // Gen 5
  { pokemonId: 638, name: 'Cobalion', rarity: 'legendary' },
  { pokemonId: 639, name: 'Terrakion', rarity: 'legendary' },
  { pokemonId: 640, name: 'Virizion', rarity: 'legendary' },
  { pokemonId: 641, name: 'Tornadus', rarity: 'legendary' },
  { pokemonId: 642, name: 'Thundurus', rarity: 'legendary' },
  { pokemonId: 643, name: 'Reshiram', rarity: 'legendary' },
  { pokemonId: 644, name: 'Zekrom', rarity: 'legendary' },
  { pokemonId: 645, name: 'Landorus', rarity: 'legendary' },
  { pokemonId: 646, name: 'Kyurem', rarity: 'legendary' },
  // Gen 6
  { pokemonId: 716, name: 'Xerneas', rarity: 'legendary' },
  { pokemonId: 717, name: 'Yveltal', rarity: 'legendary' },
  { pokemonId: 718, name: 'Zygarde', rarity: 'legendary' },
  // Gen 7
  { pokemonId: 785, name: 'Tapu Koko', rarity: 'legendary' },
  { pokemonId: 786, name: 'Tapu Lele', rarity: 'legendary' },
  { pokemonId: 787, name: 'Tapu Bulu', rarity: 'legendary' },
  { pokemonId: 788, name: 'Tapu Fini', rarity: 'legendary' },
  { pokemonId: 789, name: 'Cosmog', rarity: 'legendary' },
  { pokemonId: 791, name: 'Solgaleo', rarity: 'legendary' },
  { pokemonId: 792, name: 'Lunala', rarity: 'legendary' },
  { pokemonId: 800, name: 'Necrozma', rarity: 'legendary' },
  // Gen 8
  { pokemonId: 888, name: 'Zacian', rarity: 'legendary' },
  { pokemonId: 889, name: 'Zamazenta', rarity: 'legendary' },
  { pokemonId: 890, name: 'Eternatus', rarity: 'legendary' },
  { pokemonId: 891, name: 'Kubfu', rarity: 'legendary' },
  { pokemonId: 892, name: 'Urshifu', rarity: 'legendary' },
  { pokemonId: 894, name: 'Regieleki', rarity: 'legendary' },
  { pokemonId: 895, name: 'Regidrago', rarity: 'legendary' },
  { pokemonId: 896, name: 'Glastrier', rarity: 'legendary' },
  { pokemonId: 897, name: 'Spectrier', rarity: 'legendary' },
  { pokemonId: 898, name: 'Calyrex', rarity: 'legendary' },
  // Gen 9
  { pokemonId: 1001, name: 'Wo-Chien', rarity: 'legendary' },
  { pokemonId: 1002, name: 'Chien-Pao', rarity: 'legendary' },
  { pokemonId: 1003, name: 'Ting-Lu', rarity: 'legendary' },
  { pokemonId: 1004, name: 'Chi-Yu', rarity: 'legendary' },
  { pokemonId: 1007, name: 'Koraidon', rarity: 'legendary' },
  { pokemonId: 1008, name: 'Miraidon', rarity: 'legendary' },
  
  // ========== MYTHIC ==========
  { pokemonId: 151, name: 'Mew', rarity: 'mythic' },
  { pokemonId: 251, name: 'Celebi', rarity: 'mythic' },
  { pokemonId: 385, name: 'Jirachi', rarity: 'mythic' },
  { pokemonId: 386, name: 'Deoxys', rarity: 'mythic' },
  { pokemonId: 489, name: 'Phione', rarity: 'mythic' },
  { pokemonId: 490, name: 'Manaphy', rarity: 'mythic' },
  { pokemonId: 491, name: 'Darkrai', rarity: 'mythic' },
  { pokemonId: 492, name: 'Shaymin', rarity: 'mythic' },
  { pokemonId: 493, name: 'Arceus', rarity: 'mythic' },
  { pokemonId: 494, name: 'Victini', rarity: 'mythic' },
  { pokemonId: 647, name: 'Keldeo', rarity: 'mythic' },
  { pokemonId: 648, name: 'Meloetta', rarity: 'mythic' },
  { pokemonId: 649, name: 'Genesect', rarity: 'mythic' },
  { pokemonId: 719, name: 'Diancie', rarity: 'mythic' },
  { pokemonId: 720, name: 'Hoopa', rarity: 'mythic' },
  { pokemonId: 721, name: 'Volcanion', rarity: 'mythic' },
  { pokemonId: 801, name: 'Magearna', rarity: 'mythic' },
  { pokemonId: 802, name: 'Marshadow', rarity: 'mythic' },
  { pokemonId: 807, name: 'Zeraora', rarity: 'mythic' },
  { pokemonId: 808, name: 'Meltan', rarity: 'mythic' },
  { pokemonId: 809, name: 'Melmetal', rarity: 'mythic' },
  { pokemonId: 893, name: 'Zarude', rarity: 'mythic' },
];

const RARITY_COLORS: Record<string, string> = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
  mythic: '#EC4899',
};

interface FeaturedPokemon {
  pokemonId: number;
  name: string;
  rarity: string;
  sprite?: string;
}

interface NewBanner {
  bannerId: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  type: 'standard' | 'limited' | 'event';
  artwork: string;
  singlePullCost: number;
  multiPullCost: number;
  endDate?: string;
  featuredPokemon: FeaturedPokemon[];
  allowEpic: boolean;
  allowLegendary: boolean;
  allowMythic: boolean;
}

export default function AdminGachaPanel() {
  const [banners, setBanners] = useState<GachaBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [newBanner, setNewBanner] = useState<NewBanner>({
    bannerId: '',
    name: '',
    nameEs: '',
    description: '',
    descriptionEs: '',
    type: 'limited',
    artwork: '',
    singlePullCost: 500,
    multiPullCost: 4500,
    featuredPokemon: [],
    allowEpic: false,
    allowLegendary: false,
    allowMythic: false,
  });

  const [editBanner, setEditBanner] = useState<NewBanner & { originalId: string } | null>(null);
  const [pokemonSearch, setPokemonSearch] = useState('');
  const [editPokemonSearch, setEditPokemonSearch] = useState('');

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await apiClient.get('/api/pokemon-gacha/banners');
      if (res.banners) {
        setBanners(res.banners);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBanner = async () => {
    if (!newBanner.bannerId || !newBanner.nameEs) {
      setMessage({ type: 'error', text: 'ID y nombre son requeridos' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/pokemon-gacha/banners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBanner,
          isActive: true,
          allowEpic: newBanner.allowEpic,
          allowLegendary: newBanner.allowLegendary,
          allowMythic: newBanner.allowMythic,
          featuredPokemon: newBanner.featuredPokemon.map(p => ({
            ...p,
            sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemonId}.png`,
          })),
          featuredItems: [],
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Banner creado exitosamente' });
        setShowCreateModal(false);
        setNewBanner({
          bannerId: '',
          name: '',
          nameEs: '',
          description: '',
          descriptionEs: '',
          type: 'limited',
          artwork: '',
          singlePullCost: 500,
          multiPullCost: 4500,
          featuredPokemon: [],
          allowEpic: false,
          allowLegendary: false,
          allowMythic: false,
        });
        setPokemonSearch('');
        fetchBanners();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Error creando banner' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBanner = async (bannerId: string, isActive: boolean) => {
    try {
      const res = await fetch(`${API_URL}/api/pokemon-gacha/banners/${bannerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (res.ok) {
        fetchBanners();
        setMessage({ type: 'success', text: `Banner ${!isActive ? 'activado' : 'desactivado'}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error actualizando banner' });
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm('¿Estás seguro de eliminar este banner?')) return;

    try {
      const res = await fetch(`${API_URL}/api/pokemon-gacha/banners/${bannerId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchBanners();
        setMessage({ type: 'success', text: 'Banner eliminado' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error eliminando banner' });
    }
  };

  const handleOpenEdit = (banner: GachaBanner) => {
    setEditBanner({
      originalId: banner.bannerId,
      bannerId: banner.bannerId,
      name: banner.name || '',
      nameEs: banner.nameEs || '',
      description: banner.description || '',
      descriptionEs: banner.descriptionEs || '',
      type: banner.type as 'standard' | 'limited' | 'event',
      artwork: banner.artwork || '',
      singlePullCost: banner.singlePullCost || 500,
      multiPullCost: banner.multiPullCost || 4500,
      endDate: banner.endDate ? new Date(banner.endDate).toISOString().slice(0, 16) : undefined,
      featuredPokemon: (banner.featuredPokemon || []).map((p: any) => ({
        pokemonId: p.pokemonId,
        name: p.name || p.nameEs || '',
        rarity: p.rarity,
        sprite: p.sprite,
      })),
      allowEpic: (banner as any).allowEpic ?? false,
      allowLegendary: (banner as any).allowLegendary ?? false,
      allowMythic: (banner as any).allowMythic ?? false,
    });
    setEditPokemonSearch('');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editBanner) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/pokemon-gacha/banners/${editBanner.originalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editBanner.name,
          nameEs: editBanner.nameEs,
          description: editBanner.description,
          descriptionEs: editBanner.descriptionEs,
          type: editBanner.type,
          artwork: editBanner.artwork,
          singlePullCost: editBanner.singlePullCost,
          multiPullCost: editBanner.multiPullCost,
          endDate: editBanner.endDate || null,
          allowEpic: editBanner.allowEpic,
          allowLegendary: editBanner.allowLegendary,
          allowMythic: editBanner.allowMythic,
          featuredPokemon: editBanner.featuredPokemon.map(p => ({
            ...p,
            sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemonId}.png`,
          })),
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Banner actualizado exitosamente' });
        setShowEditModal(false);
        setEditBanner(null);
        fetchBanners();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Error actualizando banner' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span>🎰</span>
          Gestión de Gacha
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-500 hover:to-pink-500 transition-all"
        >
          + Crear Banner
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-4 ${
          message.type === 'success' 
            ? 'bg-green-500/20 border border-green-500/50 text-green-300' 
            : 'bg-red-500/20 border border-red-500/50 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Banners List */}
      <div className="space-y-4">
        {banners.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No hay banners creados
          </div>
        ) : (
          banners.map((banner) => (
            <div
              key={banner.bannerId}
              className={`p-4 rounded-xl border ${
                banner.isActive 
                  ? 'bg-gray-800/50 border-green-500/30' 
                  : 'bg-gray-900/50 border-gray-700 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Banner Image */}
                <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                  {banner.artwork ? (
                    <Image
                      src={banner.artwork}
                      alt={banner.nameEs}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      🎰
                    </div>
                  )}
                </div>

                {/* Banner Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white">{banner.nameEs}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      banner.type === 'limited' ? 'bg-purple-500/30 text-purple-300' :
                      banner.type === 'event' ? 'bg-amber-500/30 text-amber-300' :
                      'bg-blue-500/30 text-blue-300'
                    }`}>
                      {banner.type === 'limited' ? 'Limitado' : 
                       banner.type === 'event' ? 'Evento' : 'Estándar'}
                    </span>
                    {banner.isActive ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-500/30 text-green-300">
                        Activo
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-500/30 text-red-300">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-1">
                    {banner.descriptionEs || banner.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    1x: {banner.singlePullCost} CD | 10x: {banner.multiPullCost} CD
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(banner)}
                    className="px-3 py-1 rounded text-sm font-bold bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleToggleBanner(banner.bannerId, banner.isActive)}
                    className={`px-3 py-1 rounded text-sm font-bold ${
                      banner.isActive
                        ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                        : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                    }`}
                  >
                    {banner.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                  {banner.bannerId !== 'standard' && (
                    <button
                      onClick={() => handleDeleteBanner(banner.bannerId)}
                      className="px-3 py-1 rounded text-sm font-bold bg-red-500/20 text-red-300 hover:bg-red-500/30"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Banner Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Crear Nuevo Banner</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">ID del Banner *</label>
                <input
                  type="text"
                  value={newBanner.bannerId}
                  onChange={(e) => setNewBanner({ ...newBanner, bannerId: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                  placeholder="ej: mewtwo-banner"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Nombre (EN)</label>
                  <input
                    type="text"
                    value={newBanner.name}
                    onChange={(e) => setNewBanner({ ...newBanner, name: e.target.value })}
                    placeholder="Mewtwo Banner"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Nombre (ES) *</label>
                  <input
                    type="text"
                    value={newBanner.nameEs}
                    onChange={(e) => setNewBanner({ ...newBanner, nameEs: e.target.value })}
                    placeholder="Banner de Mewtwo"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Descripción (ES)</label>
                <textarea
                  value={newBanner.descriptionEs}
                  onChange={(e) => setNewBanner({ ...newBanner, descriptionEs: e.target.value })}
                  placeholder="¡Banner especial con Mewtwo destacado!"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Tipo</label>
                <select
                  value={newBanner.type}
                  onChange={(e) => setNewBanner({ ...newBanner, type: e.target.value as any })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                >
                  <option value="standard">Estándar</option>
                  <option value="limited">Limitado</option>
                  <option value="event">Evento</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">URL de Imagen</label>
                <input
                  type="text"
                  value={newBanner.artwork}
                  onChange={(e) => setNewBanner({ ...newBanner, artwork: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tip: Usa sprites de PokeAPI: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/[ID].png
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Costo x1</label>
                  <input
                    type="number"
                    value={newBanner.singlePullCost}
                    onChange={(e) => setNewBanner({ ...newBanner, singlePullCost: parseInt(e.target.value) || 500 })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Costo x10</label>
                  <input
                    type="number"
                    value={newBanner.multiPullCost}
                    onChange={(e) => setNewBanner({ ...newBanner, multiPullCost: parseInt(e.target.value) || 4500 })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Fecha de Fin (opcional)</label>
                <input
                  type="datetime-local"
                  value={newBanner.endDate || ''}
                  onChange={(e) => setNewBanner({ ...newBanner, endDate: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                />
              </div>

              {/* Rarity Toggles */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <label className="block text-sm font-bold mb-3">⚠️ Rarezas Permitidas</label>
                <p className="text-xs text-gray-400 mb-3">
                  Por defecto TODO está deshabilitado. Habilita solo lo que quieras que salga.
                </p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newBanner.allowEpic}
                      onChange={(e) => setNewBanner({ ...newBanner, allowEpic: e.target.checked })}
                      className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: RARITY_COLORS.epic }}></span>
                      <span>Épicos (Pseudo-legendarios)</span>
                      <span className="text-xs text-gray-500">0.49%</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newBanner.allowLegendary}
                      onChange={(e) => setNewBanner({ ...newBanner, allowLegendary: e.target.checked })}
                      className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: RARITY_COLORS.legendary }}></span>
                      <span>Legendarios</span>
                      <span className="text-xs text-gray-500">0.009%</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newBanner.allowMythic}
                      onChange={(e) => setNewBanner({ ...newBanner, allowMythic: e.target.checked })}
                      className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-pink-500 focus:ring-pink-500"
                    />
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: RARITY_COLORS.mythic }}></span>
                      <span>Míticos</span>
                      <span className="text-xs text-gray-500">0.001%</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Featured Pokemon Selector */}
              <div>
                <label className="block text-sm font-bold mb-1">
                  Pokémon Destacados (máx. 3) - +3% probabilidad
                </label>
                
                {/* Selected Featured */}
                {newBanner.featuredPokemon.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newBanner.featuredPokemon.map((pokemon) => (
                      <div
                        key={pokemon.pokemonId}
                        className="flex items-center gap-2 px-2 py-1 rounded-lg bg-gray-800"
                        style={{ borderLeft: `3px solid ${RARITY_COLORS[pokemon.rarity]}` }}
                      >
                        <Image
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemonId}.png`}
                          alt={pokemon.name}
                          width={24}
                          height={24}
                          unoptimized
                        />
                        <span className="text-sm">{pokemon.name}</span>
                        <button
                          onClick={() => setNewBanner({
                            ...newBanner,
                            featuredPokemon: newBanner.featuredPokemon.filter(p => p.pokemonId !== pokemon.pokemonId)
                          })}
                          className="text-red-400 hover:text-red-300 ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search and Add */}
                {newBanner.featuredPokemon.length < 3 && (
                  <>
                    <input
                      type="text"
                      value={pokemonSearch}
                      onChange={(e) => setPokemonSearch(e.target.value)}
                      placeholder="Buscar Pokémon..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 mb-2"
                    />
                    
                    {pokemonSearch && (
                      <div className="max-h-40 overflow-y-auto bg-gray-800 rounded-lg border border-gray-700">
                        {AVAILABLE_POKEMON
                          .filter(p => 
                            p.name.toLowerCase().includes(pokemonSearch.toLowerCase()) &&
                            !newBanner.featuredPokemon.some(fp => fp.pokemonId === p.pokemonId)
                          )
                          .slice(0, 10)
                          .map((pokemon) => (
                            <button
                              key={pokemon.pokemonId}
                              onClick={() => {
                                setNewBanner({
                                  ...newBanner,
                                  featuredPokemon: [...newBanner.featuredPokemon, pokemon]
                                });
                                setPokemonSearch('');
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 text-left"
                            >
                              <Image
                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemonId}.png`}
                                alt={pokemon.name}
                                width={32}
                                height={32}
                                unoptimized
                              />
                              <span>{pokemon.name}</span>
                              <span 
                                className="text-xs px-2 py-0.5 rounded ml-auto"
                                style={{ backgroundColor: `${RARITY_COLORS[pokemon.rarity]}30`, color: RARITY_COLORS[pokemon.rarity] }}
                              >
                                {pokemon.rarity}
                              </span>
                            </button>
                          ))}
                      </div>
                    )}
                  </>
                )}
                
                <p className="text-xs text-gray-500 mt-1">
                  Los Pokémon destacados tienen +3% de probabilidad sobre su rareza base
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateBanner}
                disabled={saving}
                className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-500 hover:to-pink-500 disabled:opacity-50"
              >
                {saving ? 'Creando...' : 'Crear Banner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Banner Modal */}
      {showEditModal && editBanner && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Editar Banner: {editBanner.nameEs}</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Nombre (EN)</label>
                  <input
                    type="text"
                    value={editBanner.name}
                    onChange={(e) => setEditBanner({ ...editBanner, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Nombre (ES)</label>
                  <input
                    type="text"
                    value={editBanner.nameEs}
                    onChange={(e) => setEditBanner({ ...editBanner, nameEs: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Descripción (ES)</label>
                <textarea
                  value={editBanner.descriptionEs}
                  onChange={(e) => setEditBanner({ ...editBanner, descriptionEs: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Tipo</label>
                <select
                  value={editBanner.type}
                  onChange={(e) => setEditBanner({ ...editBanner, type: e.target.value as any })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                >
                  <option value="standard">Estándar</option>
                  <option value="limited">Limitado</option>
                  <option value="event">Evento</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">URL de Imagen</label>
                <input
                  type="text"
                  value={editBanner.artwork}
                  onChange={(e) => setEditBanner({ ...editBanner, artwork: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Costo x1</label>
                  <input
                    type="number"
                    value={editBanner.singlePullCost}
                    onChange={(e) => setEditBanner({ ...editBanner, singlePullCost: parseInt(e.target.value) || 500 })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Costo x10</label>
                  <input
                    type="number"
                    value={editBanner.multiPullCost}
                    onChange={(e) => setEditBanner({ ...editBanner, multiPullCost: parseInt(e.target.value) || 4500 })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Fecha de Fin</label>
                <input
                  type="datetime-local"
                  value={editBanner.endDate || ''}
                  onChange={(e) => setEditBanner({ ...editBanner, endDate: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                />
              </div>

              {/* Rarity Toggles for Edit */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <label className="block text-sm font-bold mb-3">⚠️ Rarezas Permitidas</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editBanner.allowEpic}
                      onChange={(e) => setEditBanner({ ...editBanner, allowEpic: e.target.checked })}
                      className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: RARITY_COLORS.epic }}></span>
                      <span>Épicos (Pseudo-legendarios)</span>
                      <span className="text-xs text-gray-500">0.49%</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editBanner.allowLegendary}
                      onChange={(e) => setEditBanner({ ...editBanner, allowLegendary: e.target.checked })}
                      className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: RARITY_COLORS.legendary }}></span>
                      <span>Legendarios</span>
                      <span className="text-xs text-gray-500">0.009%</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editBanner.allowMythic}
                      onChange={(e) => setEditBanner({ ...editBanner, allowMythic: e.target.checked })}
                      className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-pink-500 focus:ring-pink-500"
                    />
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: RARITY_COLORS.mythic }}></span>
                      <span>Míticos</span>
                      <span className="text-xs text-gray-500">0.001%</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Featured Pokemon Selector for Edit */}
              <div>
                <label className="block text-sm font-bold mb-1">
                  Pokémon Destacados (máx. 3) - +3% probabilidad
                </label>
                
                {editBanner.featuredPokemon.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editBanner.featuredPokemon.map((pokemon) => (
                      <div
                        key={pokemon.pokemonId}
                        className="flex items-center gap-2 px-2 py-1 rounded-lg bg-gray-800"
                        style={{ borderLeft: `3px solid ${RARITY_COLORS[pokemon.rarity]}` }}
                      >
                        <Image
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemonId}.png`}
                          alt={pokemon.name}
                          width={24}
                          height={24}
                          unoptimized
                        />
                        <span className="text-sm">{pokemon.name}</span>
                        <button
                          onClick={() => setEditBanner({
                            ...editBanner,
                            featuredPokemon: editBanner.featuredPokemon.filter(p => p.pokemonId !== pokemon.pokemonId)
                          })}
                          className="text-red-400 hover:text-red-300 ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {editBanner.featuredPokemon.length < 3 && (
                  <>
                    <input
                      type="text"
                      value={editPokemonSearch}
                      onChange={(e) => setEditPokemonSearch(e.target.value)}
                      placeholder="Buscar Pokémon..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 mb-2"
                    />
                    
                    {editPokemonSearch && (
                      <div className="max-h-40 overflow-y-auto bg-gray-800 rounded-lg border border-gray-700">
                        {AVAILABLE_POKEMON
                          .filter(p => 
                            p.name.toLowerCase().includes(editPokemonSearch.toLowerCase()) &&
                            !editBanner.featuredPokemon.some(fp => fp.pokemonId === p.pokemonId)
                          )
                          .slice(0, 10)
                          .map((pokemon) => (
                            <button
                              key={pokemon.pokemonId}
                              onClick={() => {
                                setEditBanner({
                                  ...editBanner,
                                  featuredPokemon: [...editBanner.featuredPokemon, pokemon]
                                });
                                setEditPokemonSearch('');
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 text-left"
                            >
                              <Image
                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemonId}.png`}
                                alt={pokemon.name}
                                width={32}
                                height={32}
                                unoptimized
                              />
                              <span>{pokemon.name}</span>
                              <span 
                                className="text-xs px-2 py-0.5 rounded ml-auto"
                                style={{ backgroundColor: `${RARITY_COLORS[pokemon.rarity]}30`, color: RARITY_COLORS[pokemon.rarity] }}
                              >
                                {pokemon.rarity}
                              </span>
                            </button>
                          ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowEditModal(false); setEditBanner(null); }}
                className="flex-1 py-2 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-bold hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
