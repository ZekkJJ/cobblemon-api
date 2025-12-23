'use client';

import { useEffect, useState } from 'react';
import { shopAPI, playersAPI } from '@/lib/api-client';

interface Ball {
    id: string;
    name: string;
    type: string;
    catchRate: number;
    basePrice: number;
    currentPrice: number;
    description: string;
    sprite: string;
    currentStock: number;
    maxStock: number;
}

export default function TiendaPage() {
    const [localUser, setLocalUser] = useState<any>(null);
    const [balls, setBalls] = useState<Ball[]>([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [nextRefresh, setNextRefresh] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    useEffect(() => {
        const stored = localStorage.getItem('cobblemon_user');
        if (stored) {
            setLocalUser(JSON.parse(stored));
        }
    }, []);

    useEffect(() => {
        loadShopData();
        const interval = setInterval(() => {
            if (Date.now() >= nextRefresh) {
                loadShopData();
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [nextRefresh]);

    async function loadShopData() {
        try {
            const stockData = await shopAPI.getStock();

            // Validate that balls/stock is an array
            if (Array.isArray(stockData.stock)) {
                setBalls(stockData.stock);
                setNextRefresh((stockData as any).nextRefresh || 0);
            } else {
                console.error('Shop stock API returned invalid data:', stockData);
                setBalls([]);
            }

            if (localUser) {
                const discordId = localUser.discordId;
                console.log('[SHOP] Fetching balance for Discord ID:', discordId);

                if (discordId) {
                    try {
                        // First get user data by Discord ID to find UUID
                        const userData = await playersAPI.getByDiscordId(discordId);
                        const uuid = userData.minecraftUuid;

                        if (uuid) {
                            console.log('[SHOP] Found UUID:', uuid);
                            const balanceData = await shopAPI.getBalance(uuid);
                            console.log('[SHOP] Balance loaded:', balanceData.balance);
                            setBalance(balanceData.balance || 0);
                        } else {
                            console.log('[SHOP] No Minecraft UUID found for user');
                        }
                    } catch (e) {
                        console.error('[SHOP] Error fetching balance:', e);
                    }
                }
            }
            setBalls([]);
        } catch (error) {
            console.error('Failed to load shop data:', error);
            setErrorMessage('No se pudo conectar con la tienda. Verifica tu conexión.');
            setBalls([]);
        } finally {
            setLoading(false);
        }
    }

    async function handlePurchase(ballId: string, quantity: number) {
        if (!localUser) {
            alert('Debes iniciar sesión para comprar');
            return;
        }

        const uuid = localUser.minecraftUuid;
        if (!uuid) {
            alert('No se encontró tu UUID de Minecraft');
            return;
        }

        setPurchasing(ballId);

        try {
            const data = await shopAPI.purchase({ uuid, itemId: ballId, quantity });

            alert(`✅ ${data.message}`);
            setBalance(data.newBalance);
            setQuantities(prev => ({ ...prev, [ballId]: 1 }));
            await loadShopData();
        } catch (error: any) {
            alert(`❌ ${error.message || 'Error al realizar la compra'}`);
            console.error(error);
        } finally {
            setPurchasing(null);
        }
    }

    const filteredBalls = (balls || []).filter(ball => {
        if (!ball) return false;
        const matchesSearch = (ball.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || ball.type === filterType;
        return matchesSearch && matchesType;
    });

    const getStockColor = (stock: number, maxStock: number) => {
        const ratio = stock / maxStock;
        if (ratio === 0) return 'text-gray-500';
        if (ratio < 0.1) return 'text-red-500';
        if (ratio < 0.25) return 'text-orange-500';
        if (ratio < 0.5) return 'text-yellow-500';
        return 'text-green-500';
    };

    const getPriceMultiplier = (currentPrice: number, basePrice: number) => {
        const mult = currentPrice / basePrice;
        if (mult >= 3) return '🔥 +200%';
        if (mult >= 2) return '⚠️ +100%';
        if (mult >= 1.5) return '📈 +50%';
        return '✅ Normal';
    };

    const timeUntilRefresh = Math.max(0, nextRefresh - Date.now());
    const minutes = Math.floor(timeUntilRefresh / 60000);
    const seconds = Math.floor((timeUntilRefresh % 60000) / 1000);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
                <div className="text-white text-2xl">Cargando tienda...</div>
            </div>
        );
    }

    /* 
    if (errorMessage) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
                <div className="bg-red-900/50 border border-red-500 rounded-xl p-8 text-center max-w-lg">
                    <i className="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                    <h2 className="text-2xl font-bold text-white mb-2">Error de Conexión</h2>
                    <p className="text-gray-300 mb-6">{errorMessage}</p>
                    <button 
                        onClick={() => { setErrorMessage(null); setLoading(true); loadShopData(); }}
                        className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                    >
                        Reintentar
                    </button>
                    <p className="text-xs text-gray-500 mt-4">
                        Si el problema persiste, asegúrate de que el backend esté actualizado y corriendo.
                    </p>
                </div>
            </div>
        );
    }
    */

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-blue-500/30">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">🏪 Tienda de Pokéballs</h1>
                            <p className="text-gray-300">Stocks aleatorios • Actualización cada hora</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-yellow-400 mb-1">
                                💰 {balance.toLocaleString()} Cobbledollars
                            </div>
                            <div className="text-sm text-gray-400">
                                Próxima actualización: {minutes}m {seconds}s
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-blue-500/30">
                    <div className="flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Buscar pokéball..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                        />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                        >
                            <option value="all">Todas las categorías</option>
                            <option value="standard">Estándar</option>
                            <option value="special">Especiales</option>
                            <option value="apricorn">Apricorn</option>
                            <option value="ancient">Antiguas</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredBalls.map(ball => {
                        const qty = quantities[ball.id] || 1;
                        const totalCost = ball.currentPrice * qty;
                        const canAfford = balance >= totalCost;
                        const inStock = ball.currentStock > 0;

                        return (
                            <div
                                key={ball.id}
                                className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:scale-105"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                                        <img src={ball.sprite} alt={ball.name} className="w-12 h-12 object-contain" />
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-sm font-bold ${getStockColor(ball.currentStock, ball.maxStock)}`}>
                                            {ball.currentStock}/{ball.maxStock}
                                        </div>
                                        <div className="text-xs text-gray-400">{getPriceMultiplier(ball.currentPrice, ball.basePrice)}</div>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2">{ball.name}</h3>
                                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{ball.description}</p>

                                <div className="flex items-center gap-2 mb-4 text-sm">
                                    <span className="px-2 py-1 bg-blue-600/30 text-blue-300 rounded text-xs">
                                        {ball.type}
                                    </span>
                                    <span className="text-gray-400">
                                        Tasa: {ball.catchRate}×
                                    </span>
                                </div>

                                <div className="border-t border-gray-700 pt-4 mt-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <button
                                            onClick={() => setQuantities(prev => ({ ...prev, [ball.id]: Math.max(1, qty - 1) }))}
                                            className="w-8 h-8 bg-gray-700 text-white rounded hover:bg-gray-600"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            min="1"
                                            max={ball.currentStock}
                                            value={qty}
                                            onChange={(e) => setQuantities(prev => ({ ...prev, [ball.id]: Math.max(1, Math.min(ball.currentStock, parseInt(e.target.value) || 1)) }))}
                                            className="w-16 text-center bg-gray-700 text-white rounded py-1"
                                        />
                                        <button
                                            onClick={() => setQuantities(prev => ({ ...prev, [ball.id]: Math.min(ball.currentStock, qty + 1) }))}
                                            className="w-8 h-8 bg-gray-700 text-white rounded hover:bg-gray-600"
                                        >
                                            +
                                        </button>
                                        <button
                                            onClick={() => setQuantities(prev => ({ ...prev, [ball.id]: ball.currentStock }))}
                                            className="ml-auto text-xs text-blue-400 hover:text-blue-300"
                                        >
                                            MAX
                                        </button>
                                    </div>

                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-gray-400">Total:</span>
                                        <span className="text-yellow-400 font-bold">
                                            💰 {totalCost.toLocaleString()}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => handlePurchase(ball.id, qty)}
                                        disabled={!inStock || !canAfford || purchasing === ball.id}
                                        className={`w-full py-2 rounded-lg font-bold transition-colors ${!inStock
                                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                            : !canAfford
                                                ? 'bg-red-600/50 text-red-300 cursor-not-allowed'
                                                : purchasing === ball.id
                                                    ? 'bg-blue-500 text-white cursor-wait'
                                                    : 'bg-blue-600 text-white hover:bg-blue-500'
                                            }`}
                                    >
                                        {!inStock ? 'AGOTADO' : !canAfford ? 'SIN FONDOS' : purchasing === ball.id ? 'COMPRANDO...' : 'COMPRAR'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredBalls.length === 0 && (
                    <div className="text-center text-gray-400 py-12">
                        No se encontraron pokéballs con ese filtro
                    </div>
                )}
            </div>
        </div>
    );
}
