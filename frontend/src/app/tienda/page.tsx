'use client';

import { useState, useEffect } from 'react';
import { shopAPI, verificationAPI } from '@/src/lib/api-client';
import { LocalUser } from '@/src/lib/types/user';
import { ShopItem } from '@/src/lib/types/shop';
import { playSound } from '@/src/lib/sounds';

type CategoryType = 'all' | 'pokeball' | 'food' | 'candy';

export default function TiendaPage() {
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<CategoryType>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [nextRefresh, setNextRefresh] = useState<Date | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setLocalUser(user);
        loadShopData(user.discordId, user);
      } catch (error) {
        console.error('Error parsing user:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const loadShopData = async (discordId: string, user: LocalUser) => {
    try {
      const [stockData, balanceData, verificationStatus] = await Promise.all([
        shopAPI.getStock(),
        shopAPI.getBalance(discordId),
        verificationAPI.getStatus(discordId),
      ]);

      // Transform balls to ShopItem format and add category
      const shopItems: ShopItem[] = (stockData.balls || []).map((item: any) => ({
        ...item,
        category: item.category || (item.type === 'food' ? 'minecraft' : item.type === 'candy' ? 'pokemon' : 'pokeball'),
      }));

      setItems(shopItems);
      setBalance(balanceData.balance || 0);

      const minecraftUuid = balanceData.minecraftUuid || verificationStatus.minecraftUuid;
      
      if (minecraftUuid) {
        const updatedUser = { ...user, minecraftUuid };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setLocalUser(updatedUser);
      }

      const now = new Date();
      const next = new Date(now);
      next.setHours(next.getHours() + 1, 0, 0, 0);
      setNextRefresh(next);
    } catch (error: any) {
      console.error('Error loading shop data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (itemId: string, value: number) => {
    playSound('click');
    setQuantities({ ...quantities, [itemId]: Math.max(0, value) });
  };

  const handlePurchase = async (item: ShopItem) => {
    if (!localUser) {
      playSound('error');
      setError('Debes iniciar sesión para comprar');
      return;
    }

    const userMinecraftUuid = localUser.minecraftUuid;
    
    if (!userMinecraftUuid) {
      playSound('error');
      setError('Debes verificar tu cuenta de Minecraft para comprar.');
      return;
    }

    const quantity = quantities[item.id] || 1;
    const totalCost = item.currentPrice * quantity;

    if (totalCost > balance) {
      playSound('error');
      setError('No tienes suficiente balance');
      return;
    }

    if (quantity > item.currentStock) {
      playSound('error');
      setError('No hay suficiente stock');
      return;
    }

    setPurchasing(item.id);
    setError(null);

    try {
      const result = await shopAPI.purchase({
        uuid: userMinecraftUuid,
        itemId: item.id,
        quantity,
      });

      playSound('success');
      alert(`✅ ${result.message || '¡Compra exitosa!'}\n\nRecibirás automáticamente ${quantity}x ${item.name} en el juego.`);

      setBalance(result.newBalance);
      setItems(items.map(i =>
        i.id === item.id ? { ...i, currentStock: i.currentStock - quantity } : i
      ));
      setQuantities({ ...quantities, [item.id]: 1 });
      setError(null);
    } catch (error: any) {
      playSound('error');
      setError(error.message || 'Error al realizar la compra');
    } finally {
      setPurchasing(null);
    }
  };

  const getStockColor = (item: ShopItem): string => {
    const percentage = (item.currentStock / item.maxStock) * 100;
    if (percentage === 0) return 'text-slate-500';
    if (percentage < 10) return 'text-poke-red';
    if (percentage < 25) return 'text-orange-500';
    if (percentage < 50) return 'text-poke-yellow';
    return 'text-poke-green';
  };

  const getStockLabel = (item: ShopItem): string => {
    if (item.currentStock === 0) return 'Agotado';
    if (item.currentStock < 10) return 'Crítico';
    if (item.currentStock < 25) return 'Bajo';
    if (item.currentStock < 50) return 'Medio';
    return 'Alto';
  };

  const getRarityColor = (rarity?: string): string => {
    switch (rarity) {
      case 'common': return 'text-slate-400';
      case 'uncommon': return 'text-poke-green';
      case 'rare': return 'text-poke-blue';
      case 'epic': return 'text-purple-400';
      case 'legendary': return 'text-poke-yellow';
      default: return 'text-slate-400';
    }
  };

  const getCategoryIcon = (item: ShopItem): string => {
    if (item.type === 'food' || item.category === 'minecraft') return 'fa-drumstick-bite';
    if (item.type === 'candy' || item.category === 'pokemon') return 'fa-candy-cane';
    return 'fa-circle'; // Pokeball
  };

  const getItemCategory = (item: ShopItem): CategoryType => {
    if (item.type === 'food' || item.category === 'minecraft') return 'food';
    if (item.type === 'candy' || item.category === 'pokemon') return 'candy';
    return 'pokeball';
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const itemCategory = getItemCategory(item);
    const matchesCategory = filterCategory === 'all' || itemCategory === filterCategory;
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesCategory && matchesType;
  });

  // Get unique types for the current category
  const availableTypes = ['all', ...Array.from(new Set(
    items
      .filter(i => filterCategory === 'all' || getItemCategory(i) === filterCategory)
      .map(i => i.type)
  ))];

  const categories: { id: CategoryType; label: string; icon: string }[] = [
    { id: 'all', label: 'Todo', icon: 'fa-store' },
    { id: 'pokeball', label: 'Pokéballs', icon: 'fa-circle' },
    { id: 'food', label: 'Comida', icon: 'fa-drumstick-bite' },
    { id: 'candy', label: 'Candies', icon: 'fa-candy-cane' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-poke-blue border-t-transparent"></div>
          <p className="mt-4 text-xl">Cargando tienda...</p>
        </div>
      </div>
    );
  }

  if (!localUser) {
    return (
      <div className="min-h-screen flex items-center justify-center py-8">
        <div className="card max-w-md text-center">
          <i className="fas fa-user-lock text-6xl text-poke-blue mb-4"></i>
          <h2 className="text-2xl font-bold mb-4">Inicia Sesión</h2>
          <p className="text-slate-300 mb-6">Necesitas iniciar sesión para acceder a la tienda</p>
          <a href="/" className="btn-primary"><i className="fas fa-home mr-2"></i>Ir al Inicio</a>
        </div>
      </div>
    );
  }

  const isVerified = !!localUser.minecraftUuid;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 pixel-font text-poke-blue">TIENDA</h1>
          <p className="text-xl text-slate-300">Compra items con tus CobbleDollars</p>
        </div>

        {/* Balance */}
        <div className="max-w-md mx-auto mb-8 card text-center">
          <div className="text-sm text-slate-400 mb-2">Tu Balance</div>
          <div className="text-4xl font-bold text-poke-yellow">
            <i className="fas fa-coins mr-2"></i>{balance.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-2">CobbleDollars</div>
        </div>

        {/* Verification Warning */}
        {!isVerified && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-poke-yellow/20 border border-poke-yellow rounded-lg text-center">
            <i className="fas fa-exclamation-triangle text-poke-yellow mr-2"></i>
            <span className="text-poke-yellow font-medium">Necesitas verificar tu cuenta de Minecraft para comprar.</span>
            <a href="/verificar" className="block mt-2 text-sm text-poke-blue hover:underline">
              <i className="fas fa-shield-alt mr-1"></i>Verificar ahora
            </a>
          </div>
        )}

        {/* Next Refresh Timer */}
        {nextRefresh && (
          <div className="max-w-md mx-auto mb-8 text-center text-sm text-slate-400">
            <i className="fas fa-clock mr-2"></i>
            Próxima actualización de stock: {nextRefresh.toLocaleTimeString('es-ES')}
          </div>
        )}

        {/* Category Tabs */}
        <div className="max-w-4xl mx-auto mb-6 flex flex-wrap justify-center gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setFilterCategory(cat.id); setFilterType('all'); }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterCategory === cat.id
                  ? 'bg-poke-blue text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              <i className={`fas ${cat.icon} mr-2`}></i>{cat.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="max-w-4xl mx-auto mb-6 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar item..."
            className="input-field flex-1"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field md:w-48"
          >
            {availableTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'Todos los tipos' : type}
              </option>
            ))}
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6 p-4 bg-poke-red/20 border border-poke-red rounded-lg text-poke-red">
            <i className="fas fa-exclamation-triangle mr-2"></i>{error}
          </div>
        )}

        {/* Items Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => {
            const quantity = quantities[item.id] || 1;
            const totalCost = item.currentPrice * quantity;
            const canAfford = totalCost <= balance;
            const hasStock = item.currentStock >= quantity;
            const canPurchase = canAfford && hasStock && item.currentStock > 0 && isVerified;
            const itemCategory = getItemCategory(item);

            return (
              <div key={item.id} className="card group">
                {/* Category Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded text-xs ${getRarityColor(item.rarity)} bg-slate-800/80`}>
                    <i className={`fas ${getCategoryIcon(item)} mr-1`}></i>
                    {item.rarity || itemCategory}
                  </span>
                </div>

                {/* Item Image */}
                <div className="flex justify-center mb-4 relative h-28 items-center">
                  {item.spriteOpen ? (
                    <>
                      {/* Closed Ball (default) - hides on hover */}
                      <img
                        src={item.sprite}
                        alt={item.name}
                        className="w-20 h-20 object-contain absolute transition-all duration-300 group-hover:opacity-0 group-hover:scale-90"
                        loading="lazy"
                      />
                      {/* Open Ball (on hover) - shows on hover */}
                      <img
                        src={item.spriteOpen}
                        alt={`${item.name} abierta`}
                        className="w-20 h-20 object-contain absolute transition-all duration-300 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100"
                        loading="lazy"
                      />
                    </>
                  ) : (
                    /* Single image for non-pokeball items */
                    <img
                      src={item.sprite}
                      alt={item.name}
                      className="w-20 h-20 object-contain transition-all duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                  )}
                </div>

                {/* Item Info */}
                <h3 className="text-xl font-bold text-center mb-2">{item.name}</h3>
                <p className="text-sm text-slate-400 text-center mb-4">{item.description}</p>

                {/* Stats */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Precio:</span>
                    <span className="font-bold text-poke-yellow">
                      <i className="fas fa-coins mr-1"></i>{item.currentPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Stock:</span>
                    <span className={`font-bold ${getStockColor(item)}`}>
                      {item.currentStock} / {item.maxStock} ({getStockLabel(item)})
                    </span>
                  </div>
                  {item.catchRate && (
                    <div className="flex justify-between text-sm">
                      <span>Tasa de captura:</span>
                      <span className="font-bold">{item.catchRate}x</span>
                    </div>
                  )}
                </div>

                {/* Stock Bar */}
                <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      item.currentStock === 0 ? 'bg-slate-500' :
                      item.currentStock < 10 ? 'bg-poke-red' :
                      item.currentStock < 25 ? 'bg-orange-500' :
                      item.currentStock < 50 ? 'bg-poke-yellow' : 'bg-poke-green'
                    }`}
                    style={{ width: `${(item.currentStock / item.maxStock) * 100}%` }}
                  ></div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => handleQuantityChange(item.id, quantity - 1)}
                    disabled={quantity <= 1}
                    className="btn-secondary py-1 px-3 text-sm"
                  >
                    <i className="fas fa-minus"></i>
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                    min="1"
                    max={item.currentStock}
                    className="input-field text-center flex-1"
                  />
                  <button
                    onClick={() => handleQuantityChange(item.id, quantity + 1)}
                    disabled={quantity >= item.currentStock}
                    className="btn-secondary py-1 px-3 text-sm"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                  <button
                    onClick={() => handleQuantityChange(item.id, item.currentStock)}
                    disabled={item.currentStock === 0}
                    className="btn-secondary py-1 px-3 text-sm"
                  >
                    MAX
                  </button>
                </div>

                {/* Total Cost */}
                <div className="text-center mb-4">
                  <div className="text-sm text-slate-400">Total</div>
                  <div className={`text-2xl font-bold ${canAfford ? 'text-poke-yellow' : 'text-poke-red'}`}>
                    <i className="fas fa-coins mr-1"></i>{totalCost.toLocaleString()}
                  </div>
                </div>

                {/* Purchase Button */}
                <button
                  onClick={() => handlePurchase(item)}
                  disabled={!canPurchase || purchasing === item.id}
                  className="btn-primary w-full"
                >
                  {purchasing === item.id ? (
                    <><i className="fas fa-spinner fa-spin mr-2"></i>Comprando...</>
                  ) : !hasStock ? (
                    <><i className="fas fa-times mr-2"></i>Sin Stock</>
                  ) : !canAfford ? (
                    <><i className="fas fa-exclamation-triangle mr-2"></i>Saldo Insuficiente</>
                  ) : (
                    <><i className="fas fa-shopping-cart mr-2"></i>Comprar</>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-search text-6xl text-slate-600 mb-4"></i>
            <p className="text-xl text-slate-400">No se encontraron items</p>
          </div>
        )}
      </div>
    </div>
  );
}
