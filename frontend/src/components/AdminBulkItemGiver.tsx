'use client';

import { useState, useEffect } from 'react';
import { playSound } from '@/lib/sounds';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Player {
  uuid: string;
  username: string;
  discordId?: string;
  minecraftUuid?: string;
  minecraftUsername?: string;
}

interface ItemToGive {
  id: string;
  itemId: string;
  displayName: string;
  quantity: number;
  nbt?: string;
}

interface PendingDelivery {
  _id: string;
  playerUuid: string;
  playerName: string;
  items: ItemToGive[];
  status: 'pending' | 'delivered' | 'failed';
  createdAt: string;
  deliveredAt?: string;
}

// Presets de items comunes
const ITEM_PRESETS = {
  pokeballs: [
    { itemId: 'cobblemon:master_ball', displayName: 'Master Ball', quantity: 1 },
    { itemId: 'cobblemon:ultra_ball', displayName: 'Ultra Ball', quantity: 10 },
    { itemId: 'cobblemon:great_ball', displayName: 'Great Ball', quantity: 20 },
  ],
  megaItems: [
    { itemId: 'cobblemon:mega_bracelet', displayName: 'Mega Bracelet', quantity: 1 },
    { itemId: 'cobblemon:z_ring', displayName: 'Z-Ring', quantity: 1 },
  ],
  berries: [
    { itemId: 'cobblemon:oran_berry', displayName: 'Baya Aranja', quantity: 10 },
    { itemId: 'cobblemon:sitrus_berry', displayName: 'Baya Zidra', quantity: 10 },
    { itemId: 'cobblemon:lum_berry', displayName: 'Baya Lum', quantity: 5 },
  ],
  minerals: [
    { itemId: 'minecraft:diamond', displayName: 'Diamante', quantity: 64 },
    { itemId: 'minecraft:iron_ingot', displayName: 'Lingote de Hierro', quantity: 64 },
    { itemId: 'minecraft:gold_ingot', displayName: 'Lingote de Oro', quantity: 64 },
  ],
};

export default function AdminBulkItemGiver() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<ItemToGive[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingDeliveries, setPendingDeliveries] = useState<PendingDelivery[]>([]);
  const [showPending, setShowPending] = useState(false);
  
  // Form para nuevo item
  const [newItem, setNewItem] = useState({ itemId: '', displayName: '', quantity: 1, nbt: '' });
  
  // JSON mode
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  useEffect(() => {
    loadPlayers();
    loadPendingDeliveries();
  }, []);

  const loadPlayers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/players`);
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.players || []);
      }
    } catch (err) {
      console.error('Error loading players:', err);
    }
  };

  const loadPendingDeliveries = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/bulk-items/pending`);
      if (res.ok) {
        const data = await res.json();
        setPendingDeliveries(data.deliveries || []);
      }
    } catch (err) {
      console.error('Error loading pending deliveries:', err);
    }
  };

  const filteredPlayers = players.filter(p => {
    const name = p.username || p.minecraftUsername || '';
    const id = p.discordId || p.uuid || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           id.includes(searchQuery);
  });

  const addItem = () => {
    if (!newItem.itemId || !newItem.displayName) {
      setError('Item ID y nombre son requeridos');
      return;
    }
    const item: ItemToGive = {
      id: Date.now().toString(),
      itemId: newItem.itemId,
      displayName: newItem.displayName,
      quantity: newItem.quantity || 1,
      nbt: newItem.nbt || undefined,
    };
    setItems([...items, item]);
    setNewItem({ itemId: '', displayName: '', quantity: 1, nbt: '' });
    playSound('click');
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
    playSound('click');
  };

  const addPreset = (presetKey: keyof typeof ITEM_PRESETS) => {
    const presetItems = ITEM_PRESETS[presetKey].map(item => ({
      ...item,
      id: Date.now().toString() + Math.random(),
    }));
    setItems([...items, ...presetItems]);
    playSound('click');
  };

  const parseJsonItems = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        setError('El JSON debe ser un array de items');
        return;
      }
      const newItems: ItemToGive[] = parsed.map((item, i) => ({
        id: Date.now().toString() + i,
        itemId: item.itemId || item.item || item.id,
        displayName: item.displayName || item.name || item.itemId,
        quantity: item.quantity || item.count || item.amount || 1,
        nbt: item.nbt || item.data || undefined,
      }));
      setItems([...items, ...newItems]);
      setJsonInput('');
      setJsonMode(false);
      playSound('confirm');
    } catch (err) {
      setError('JSON inválido: ' + (err instanceof Error ? err.message : 'Error'));
      playSound('error');
    }
  };

  const sendItems = async () => {
    if (!selectedPlayer) {
      setError('Selecciona un jugador');
      return;
    }
    if (items.length === 0) {
      setError('Agrega al menos un item');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/bulk-items/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerUuid: selectedPlayer.uuid || selectedPlayer.minecraftUuid,
          playerName: selectedPlayer.username || selectedPlayer.minecraftUsername,
          items: items.map(({ id, ...rest }) => rest),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al enviar items');
      }

      const data = await res.json();
      setSuccess(`Items enviados! El jugador los recibirá cuando entre al servidor. ID: ${data.deliveryId}`);
      setItems([]);
      playSound('confirm');
      loadPendingDeliveries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  const cancelDelivery = async (deliveryId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/bulk-items/${deliveryId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        playSound('confirm');
        loadPendingDeliveries();
      }
    } catch (err) {
      console.error('Error canceling delivery:', err);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fas fa-gift text-poke-yellow"></i>
            Bulk Item Giver
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Envía múltiples items a un jugador via el plugin
          </p>
        </div>
        <button
          onClick={() => setShowPending(!showPending)}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm flex items-center gap-2"
        >
          <i className="fas fa-clock"></i>
          Pendientes ({pendingDeliveries.filter(d => d.status === 'pending').length})
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-poke-red/20 border border-poke-red/30 rounded-lg text-poke-red text-sm flex items-center gap-2">
          <i className="fas fa-exclamation-circle"></i>
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><i className="fas fa-times"></i></button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-poke-green/20 border border-poke-green/30 rounded-lg text-poke-green text-sm flex items-center gap-2">
          <i className="fas fa-check-circle"></i>
          {success}
          <button onClick={() => setSuccess(null)} className="ml-auto"><i className="fas fa-times"></i></button>
        </div>
      )}

      {/* Pending Deliveries Panel */}
      {showPending && (
        <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <h3 className="font-bold text-white mb-3">Entregas Pendientes</h3>
          {pendingDeliveries.length === 0 ? (
            <p className="text-slate-400 text-sm">No hay entregas pendientes</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pendingDeliveries.map(d => (
                <div key={d._id} className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
                  <div>
                    <span className="text-white font-medium">{d.playerName}</span>
                    <span className="text-slate-400 text-sm ml-2">
                      {d.items.length} items - {d.status}
                    </span>
                  </div>
                  {d.status === 'pending' && (
                    <button onClick={() => cancelDelivery(d._id)} className="text-poke-red hover:text-red-400">
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Player Selection */}
      <div className="mb-6">
        <label className="block text-sm text-slate-400 mb-2">Seleccionar Jugador</label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre o Discord ID..."
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white mb-2"
        />
        {searchQuery && filteredPlayers.length > 0 && !selectedPlayer && (
          <div className="max-h-32 overflow-y-auto bg-slate-800 rounded-lg border border-slate-600">
            {filteredPlayers.slice(0, 5).map(p => (
              <button
                key={p.uuid || p.discordId}
                onClick={() => { setSelectedPlayer(p); setSearchQuery(p.username || p.minecraftUsername || ''); }}
                className="w-full px-3 py-2 text-left hover:bg-slate-700 text-white"
              >
                {p.username || p.minecraftUsername} <span className="text-slate-400 text-sm">({p.uuid || p.discordId})</span>
              </button>
            ))}
          </div>
        )}
        {selectedPlayer && (
          <div className="flex items-center gap-2 p-2 bg-poke-green/20 border border-poke-green/30 rounded-lg">
            <i className="fas fa-user text-poke-green"></i>
            <span className="text-white">{selectedPlayer.username || selectedPlayer.minecraftUsername}</span>
            <button onClick={() => { setSelectedPlayer(null); setSearchQuery(''); }} className="ml-auto text-slate-400 hover:text-white">
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setJsonMode(false)}
          className={`px-4 py-2 rounded-lg font-medium ${!jsonMode ? 'bg-poke-blue text-white' : 'bg-slate-700 text-slate-300'}`}
        >
          <i className="fas fa-list mr-2"></i>Manual
        </button>
        <button
          onClick={() => setJsonMode(true)}
          className={`px-4 py-2 rounded-lg font-medium ${jsonMode ? 'bg-poke-blue text-white' : 'bg-slate-700 text-slate-300'}`}
        >
          <i className="fas fa-code mr-2"></i>JSON
        </button>
      </div>

      {jsonMode ? (
        /* JSON Mode */
        <div className="mb-6">
          <label className="block text-sm text-slate-400 mb-2">
            Pega tu JSON de items (array)
          </label>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={8}
            placeholder={`[
  { "itemId": "cobblemon:master_ball", "displayName": "Master Ball", "quantity": 2 },
  { "itemId": "minecraft:diamond", "quantity": 64 },
  { "itemId": "minecraft:netherite_pickaxe", "displayName": "Pico Netherite", "nbt": "{Enchantments:[{id:silk_touch,lvl:1},{id:efficiency,lvl:5},{id:unbreaking,lvl:3}]}" }
]`}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono text-sm"
          />
          <button
            onClick={parseJsonItems}
            className="mt-2 px-4 py-2 bg-poke-green hover:bg-green-600 text-white rounded-lg"
          >
            <i className="fas fa-plus mr-2"></i>Agregar Items del JSON
          </button>
        </div>
      ) : (
        /* Manual Mode */
        <div className="mb-6">
          {/* Presets */}
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-2">Presets Rápidos</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => addPreset('pokeballs')} className="px-3 py-1 bg-poke-red/20 text-poke-red rounded-lg text-sm hover:bg-poke-red/30">
                🔴 Pokéballs
              </button>
              <button onClick={() => addPreset('megaItems')} className="px-3 py-1 bg-poke-purple/20 text-poke-purple rounded-lg text-sm hover:bg-poke-purple/30">
                💎 Mega Items
              </button>
              <button onClick={() => addPreset('berries')} className="px-3 py-1 bg-poke-green/20 text-poke-green rounded-lg text-sm hover:bg-poke-green/30">
                🍇 Bayas
              </button>
              <button onClick={() => addPreset('minerals')} className="px-3 py-1 bg-poke-blue/20 text-poke-blue rounded-lg text-sm hover:bg-poke-blue/30">
                💎 Minerales
              </button>
            </div>
          </div>

          {/* Add Item Form */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
            <input
              type="text"
              value={newItem.itemId}
              onChange={(e) => setNewItem({ ...newItem, itemId: e.target.value })}
              placeholder="minecraft:diamond"
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
            />
            <input
              type="text"
              value={newItem.displayName}
              onChange={(e) => setNewItem({ ...newItem, displayName: e.target.value })}
              placeholder="Nombre display"
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
            />
            <input
              type="number"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
              min={1}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
            />
            <button onClick={addItem} className="px-4 py-2 bg-poke-green hover:bg-green-600 text-white rounded-lg text-sm">
              <i className="fas fa-plus"></i> Agregar
            </button>
          </div>
          <input
            type="text"
            value={newItem.nbt}
            onChange={(e) => setNewItem({ ...newItem, nbt: e.target.value })}
            placeholder="NBT opcional: {Enchantments:[{id:unbreaking,lvl:3}]}"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm font-mono"
          />
        </div>
      )}

      {/* Items List */}
      {items.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-white mb-2">Items a Enviar ({items.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-poke-yellow font-bold">{item.quantity}x</span>
                  <div>
                    <span className="text-white">{item.displayName}</span>
                    <span className="text-slate-400 text-xs ml-2">{item.itemId}</span>
                    {item.nbt && <span className="text-poke-purple text-xs ml-2">[NBT]</span>}
                  </div>
                </div>
                <button onClick={() => removeItem(item.id)} className="text-poke-red hover:text-red-400">
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Send Button */}
      <button
        onClick={sendItems}
        disabled={loading || !selectedPlayer || items.length === 0}
        className="w-full px-4 py-3 bg-poke-yellow hover:bg-yellow-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-black font-bold rounded-lg flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
            Enviando...
          </>
        ) : (
          <>
            <i className="fas fa-paper-plane"></i>
            Enviar {items.length} Item{items.length !== 1 ? 's' : ''} a {selectedPlayer?.username || selectedPlayer?.minecraftUsername || '...'}
          </>
        )}
      </button>

      {/* Help */}
      <div className="mt-4 p-3 bg-slate-800/50 rounded-lg text-xs text-slate-400">
        <p className="font-bold text-slate-300 mb-1">💡 Cómo funciona:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Los items se guardan en una cola de entregas pendientes</li>
          <li>El plugin del servidor hace polling cada 5 segundos</li>
          <li>Cuando el jugador está online, recibe los items via /give</li>
          <li>Para items con encantamientos, usa el campo NBT</li>
        </ul>
      </div>
    </div>
  );
}