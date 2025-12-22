'use client';

import { useState, useEffect } from 'react';
import { shopAPI } from '@/src/lib/api-client';
import { LocalUser } from '@/src/lib/types/user';
import { Ball } from '@/src/lib/types/shop';
import { playSound } from '@/src/lib/sounds';

export default function TiendaPage() {
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [nextRefresh, setNextRefresh] = useState<Date | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setLocalUser(user);
        
        if (user.minecraftUuid) {
          loadShopData(user.minecraftUuid);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error parsing user:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const loadShopData = async (uuid: string) => {
    try {
      const [stockData, balanceData] = await Promise.all([
        shopAPI.getStock(),
        shopAPI.getBalance(uuid),
      ]);

      setBalls(stockData.balls || []);
      setBalance(balanceData.balance || 0);
      
      // Calcular próxima actualización (cada hora)
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

  const handleQuantityChange = (ballId: string, value: number) => {
    playSound('click');
    setQuantities({
      ...quantities,
      [ballId]: Math.max(0, value),
    });
  };

  const handlePurchase = async (ball: Ball) => {
    if (!localUser?.minecraftUuid) return;

    const quantity = quantities[ball.id] || 1;
    const totalCost = ball.currentPrice * quantity;

    if (totalCost > balance) {
      playSound('error');
      setError('No tienes suficiente balance');
      return;
    }

    if (quantity > ball.currentStock) {
      playSound('error');
      setError('No hay suficiente stock');
      return;
    }

    setPurchasing(ball.id);
    setError(null);

    try {
      const result = await shopAPI.purchase({
        uuid: localUser.minecraftUuid,
        itemId: ball.id,
        quantity,
      });

      playSound('success');
      
      // Actualizar balance y stock
      setBalance(result.newBalance);
      setBalls(balls.map(b => 
        b.id === ball.id 
          ? { ...b, currentStock: b.currentStock - quantity }
          : b
      ));
      
      // Resetear cantidad
      setQuantities({
        ...quantities,
        [ball.id]: 0,
      });
    } catch (error: any) {
      playSound('error');
      setError(error.message || 'Error al realizar la compra');
    } finally {
      setPurchasing(null);
    }
  };

  const getStockColor = (ball: Ball): string => {
    const percentage = (ball.currentStock / ball.maxStock) * 100;
    if (percentage === 0) return 'text-slate-500';
    if (percentage < 10) return 'text-poke-red';
    if (percentage < 25) return 'text-orange-500';
    if (percentage < 50) return 'text-poke-yellow';
    return 'text-poke-green';
  };

  const getStockLabel = (ball: Ball): string => {
    if (ball.currentStock === 0) return 'Agotado';
    if (ball.currentStock < 10) return 'Crítico';
    if (ball.currentStock < 25) return 'Bajo';
    if (ball.currentStock < 50) return 'Medio';
    return 'Alto';
  };

  const filteredBalls = balls.filter(ball => {
    const matchesSearch = ball.name && ball.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || ball.type === filterType;
    return matchesSearch && matchesType;
  });

  const ballTypes = ['all', ...Array.from(new Set(balls.map(b => b.type)))];

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
          <p className="text-slate-300 mb-6">
            Necesitas iniciar sesión para acceder a la tienda
          </p>
          <a href="/" className="btn-primary">
            <i className="fas fa-home mr-2"></i>
            Ir al Inicio
          </a>
        </div>
      </div>
    );
  }

  if (!localUser.minecraftUuid) {
    return (
      <div className="min-h-screen flex items-center justify-center py-8">
        <div className="card max-w-md text-center">
          <i className="fas fa-exclamation-triangle text-6xl text-poke-yellow mb-4"></i>
          <h2 className="text-2xl font-bold mb-4">Verificación Requerida</h2>
          <p className="text-slate-300 mb-6">
            Necesitas verificar tu cuenta de Minecraft para acceder a la tienda
          </p>
          <a href="/" className="btn-primary">
            <i className="fas fa-shield-alt mr-2"></i>
            Verificar Cuenta
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 pixel-font text-poke-blue">
            TIENDA
          </h1>
          <p className="text-xl text-slate-300">
            Compra Pokéballs con tus CobbleDollars
          </p>
        </div>

        {/* Balance */}
        <div className="max-w-md mx-auto mb-8 card text-center">
          <div className="text-sm text-slate-400 mb-2">Tu Balance</div>
          <div className="text-4xl font-bold text-poke-yellow">
            <i className="fas fa-coins mr-2"></i>
            {balance.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-2">CobbleDollars</div>
        </div>

        {/* Next Refresh Timer */}
        {nextRefresh && (
          <div className="max-w-md mx-auto mb-8 text-center text-sm text-slate-400">
            <i className="fas fa-clock mr-2"></i>
            Próxima actualización de stock: {nextRefresh.toLocaleTimeString('es-ES')}
          </div>
        )}

        {/* Filters */}
        <div className="max-w-4xl mx-auto mb-6 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar Pokéball..."
            className="input-field flex-1"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field md:w-48"
          >
            {ballTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'Todos los tipos' : type}
              </option>
            ))}
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6 p-4 bg-poke-red/20 border border-poke-red rounded-lg text-poke-red">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            {error}
          </div>
        )}

        {/* Balls Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBalls.map(ball => {
            const quantity = quantities[ball.id] || 1;
            const totalCost = ball.currentPrice * quantity;
            const canAfford = totalCost <= balance;
            const hasStock = ball.currentStock >= quantity;
            const canPurchase = canAfford && hasStock && ball.currentStock > 0;

            return (
              <div key={ball.id} className="card">
                {/* Ball Image */}
                <div className="flex justify-center mb-4">
                  <img
                    src={ball.sprite}
                    alt={ball.name}
                    className="w-24 h-24 object-contain"
                    loading="lazy"
                  />
                </div>

                {/* Ball Info */}
                <h3 className="text-xl font-bold text-center mb-2">{ball.name}</h3>
                <p className="text-sm text-slate-400 text-center mb-4">{ball.description}</p>

                {/* Stats */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Precio:</span>
                    <span className="font-bold text-poke-yellow">
                      <i className="fas fa-coins mr-1"></i>
                      {ball.currentPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Stock:</span>
                    <span className={`font-bold ${getStockColor(ball)}`}>
                      {ball.currentStock} / {ball.maxStock} ({getStockLabel(ball)})
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tasa de captura:</span>
                    <span className="font-bold">{ball.catchRate}x</span>
                  </div>
                </div>

                {/* Stock Bar */}
                <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      ball.currentStock === 0 ? 'bg-slate-500' :
                      ball.currentStock < 10 ? 'bg-poke-red' :
                      ball.currentStock < 25 ? 'bg-orange-500' :
                      ball.currentStock < 50 ? 'bg-poke-yellow' :
                      'bg-poke-green'
                    }`}
                    style={{ width: `${(ball.currentStock / ball.maxStock) * 100}%` }}
                  ></div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => handleQuantityChange(ball.id, quantity - 1)}
                    disabled={quantity <= 1}
                    className="btn-secondary py-1 px-3 text-sm"
                  >
                    <i className="fas fa-minus"></i>
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(ball.id, parseInt(e.target.value) || 1)}
                    min="1"
                    max={ball.currentStock}
                    className="input-field text-center flex-1"
                  />
                  <button
                    onClick={() => handleQuantityChange(ball.id, quantity + 1)}
                    disabled={quantity >= ball.currentStock}
                    className="btn-secondary py-1 px-3 text-sm"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                  <button
                    onClick={() => handleQuantityChange(ball.id, ball.currentStock)}
                    disabled={ball.currentStock === 0}
                    className="btn-secondary py-1 px-3 text-sm"
                  >
                    MAX
                  </button>
                </div>

                {/* Total Cost */}
                <div className="text-center mb-4">
                  <div className="text-sm text-slate-400">Total</div>
                  <div className={`text-2xl font-bold ${canAfford ? 'text-poke-yellow' : 'text-poke-red'}`}>
                    <i className="fas fa-coins mr-1"></i>
                    {totalCost.toLocaleString()}
                  </div>
                </div>

                {/* Purchase Button */}
                <button
                  onClick={() => handlePurchase(ball)}
                  disabled={!canPurchase || purchasing === ball.id}
                  className="btn-primary w-full"
                >
                  {purchasing === ball.id ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Comprando...
                    </>
                  ) : !hasStock ? (
                    <>
                      <i className="fas fa-times mr-2"></i>
                      Sin Stock
                    </>
                  ) : !canAfford ? (
                    <>
                      <i className="fas fa-exclamation-triangle mr-2"></i>
                      Saldo Insuficiente
                    </>
                  ) : (
                    <>
                      <i className="fas fa-shopping-cart mr-2"></i>
                      Comprar
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {filteredBalls.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-search text-6xl text-slate-600 mb-4"></i>
            <p className="text-xl text-slate-400">No se encontraron Pokéballs</p>
          </div>
        )}
      </div>
    </div>
  );
}
