'use client';

import { useState, useEffect, useMemo } from 'react';
import StarterCard from '@/components/StarterCard';
import { playSound, playCry, preloadSounds } from '@/lib/sounds';
import { startersAPI } from '@/lib/api-client';

interface SpawnData {
    rarity: string;
    spawnType: string[];
    biomes: string[];
    levels: string;
    skylight?: string;
    canSeeSky?: boolean | string;
    timeWeather: string;
    presets: string[];
}

interface StarterData {
    pokemonId: number;
    name: string;
    nameEs: string;
    generation: number;
    types: string[];
    stats: any;
    abilities: any[];
    signatureMoves: any[];
    evolutions: any[];
    description: string;
    height: number;
    weight: number;
    isClaimed: boolean;
    claimedBy: string | null;
    isShiny: boolean;
    spawnData?: SpawnData;
}

const TIPOS: Record<string, string> = {
    Grass: 'Planta', Fire: 'Fuego', Water: 'Agua', Electric: 'Eléctrico',
    Ice: 'Hielo', Fighting: 'Lucha', Poison: 'Veneno', Ground: 'Tierra',
    Flying: 'Volador', Psychic: 'Psíquico', Bug: 'Bicho', Rock: 'Roca',
    Ghost: 'Fantasma', Dragon: 'Dragón', Dark: 'Siniestro', Steel: 'Acero', Fairy: 'Hada', Normal: 'Normal',
};

const TIPO_COLORES: Record<string, string> = {
    Grass: '#78C850', Fire: '#F08030', Water: '#6890F0', Electric: '#F8D030',
    Ice: '#98D8D8', Fighting: '#C03028', Poison: '#A040A0', Ground: '#E0C068',
    Flying: '#A890F0', Psychic: '#F85888', Bug: '#A8B820', Rock: '#B8A038',
    Ghost: '#705898', Dragon: '#7038F8', Dark: '#705848', Steel: '#B8B8D0', Fairy: '#EE99AC', Normal: '#A8A878',
};

const COBBLEMON_SPAWN_DATA: Record<number, SpawnData> = {
    1: { rarity: 'Ultra Raro', spawnType: ['Terrestre'], biomes: ['Jungla', 'Isla Tropical'], levels: '5-32', skylight: '8-15', canSeeSky: true, timeWeather: 'Cualquiera / Cualquiera', presets: ['Natural'] },
    2: { rarity: 'Ultra Raro', spawnType: ['Terrestre'], biomes: ['Jungla', 'Isla Tropical'], levels: '16-40', skylight: '8-15', canSeeSky: true, timeWeather: 'Cualquiera / Cualquiera', presets: ['Natural'] },
    3: { rarity: 'Ultra Raro', spawnType: ['Terrestre'], biomes: ['Jungla', 'Isla Tropical'], levels: '32-52', skylight: '8-15', canSeeSky: true, timeWeather: 'Cualquiera / Cualquiera', presets: ['Natural'] },
    4: { rarity: 'Ultra Raro', spawnType: ['Terrestre'], biomes: ['Colinas', 'Volcánico', 'Nether Basáltico'], levels: '5-31', skylight: '8-15', canSeeSky: 'Depende del bioma', timeWeather: 'Cualquiera / Despejado', presets: ['Natural'] },
    5: { rarity: 'Ultra Raro', spawnType: ['Terrestre'], biomes: ['Colinas', 'Volcánico', 'Nether Basáltico'], levels: '16-40', skylight: '8-15', canSeeSky: 'Depende del bioma', timeWeather: 'Cualquiera / Despejado', presets: ['Natural'] },
    6: { rarity: 'Ultra Raro', spawnType: ['Terrestre'], biomes: ['Colinas', 'Volcánico', 'Nether Basáltico'], levels: '36-53', skylight: '8-15', canSeeSky: 'Depende del bioma', timeWeather: 'Cualquiera / Despejado', presets: ['Natural'] },
    7: { rarity: 'Ultra Raro', spawnType: ['Terrestre', 'Sumergido', 'Pesca'], biomes: ['Agua Dulce', 'Colinas', 'Jungla', 'Templado', 'Isla Tropical'], levels: '5-31', skylight: '8-15', canSeeSky: 'Depende del contexto', timeWeather: 'Cualquiera / Cualquiera', presets: ['Natural', 'Agua'] },
    8: { rarity: 'Ultra Raro', spawnType: ['Terrestre', 'Sumergido', 'Pesca'], biomes: ['Agua Dulce', 'Colinas', 'Jungla', 'Templado', 'Isla Tropical'], levels: '16-40', skylight: '8-15', canSeeSky: 'Depende del contexto', timeWeather: 'Cualquiera / Cualquiera', presets: ['Natural', 'Agua'] },
    9: { rarity: 'Ultra Raro', spawnType: ['Terrestre', 'Sumergido', 'Pesca'], biomes: ['Agua Dulce', 'Colinas', 'Jungla', 'Templado', 'Isla Tropical'], levels: '36-53', skylight: '8-15', canSeeSky: 'Depende del contexto', timeWeather: 'Cualquiera / Cualquiera', presets: ['Natural', 'Agua'] },
};

function calcularDebilidades(tipos: string[]) {
    const efectividad: Record<string, Record<string, number>> = {
        Fire: { Grass: 2, Ice: 2, Bug: 2, Steel: 2, Fire: 0.5, Water: 0.5, Rock: 0.5, Dragon: 0.5 },
        Water: { Fire: 2, Ground: 2, Rock: 2, Water: 0.5, Grass: 0.5, Dragon: 0.5 },
        Grass: { Water: 2, Ground: 2, Rock: 2, Fire: 0.5, Grass: 0.5, Poison: 0.5, Flying: 0.5, Bug: 0.5, Dragon: 0.5, Steel: 0.5 },
        Electric: { Water: 2, Flying: 2, Electric: 0.5, Grass: 0.5, Dragon: 0.5, Ground: 0 },
        Ice: { Grass: 2, Ground: 2, Flying: 2, Dragon: 2, Fire: 0.5, Water: 0.5, Ice: 0.5, Steel: 0.5 },
        Fighting: { Normal: 2, Ice: 2, Rock: 2, Dark: 2, Steel: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Fairy: 0.5, Ghost: 0 },
        Poison: { Grass: 2, Fairy: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0 },
        Ground: { Fire: 2, Electric: 2, Poison: 2, Rock: 2, Steel: 2, Grass: 0.5, Bug: 0.5, Flying: 0 },
        Flying: { Grass: 2, Fighting: 2, Bug: 2, Electric: 0.5, Rock: 0.5, Steel: 0.5 },
        Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Steel: 0.5, Dark: 0 },
        Bug: { Grass: 2, Psychic: 2, Dark: 2, Fire: 0.5, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Ghost: 0.5, Steel: 0.5, Fairy: 0.5 },
        Rock: { Fire: 2, Ice: 2, Flying: 2, Bug: 2, Fighting: 0.5, Ground: 0.5, Steel: 0.5 },
        Ghost: { Psychic: 2, Ghost: 2, Dark: 0.5, Normal: 0 },
        Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
        Dark: { Psychic: 2, Ghost: 2, Fighting: 0.5, Dark: 0.5, Fairy: 0.5 },
        Steel: { Ice: 2, Rock: 2, Fairy: 2, Fire: 0.5, Water: 0.5, Electric: 0.5, Steel: 0.5 },
        Fairy: { Fighting: 2, Dragon: 2, Dark: 2, Fire: 0.5, Poison: 0.5, Steel: 0.5 },
    };

    const debilA: string[] = [];
    const resisteA: string[] = [];
    const inmuneA: string[] = [];

    for (const tipoDefensa of tipos) {
        for (const [tipoAtaque, tabla] of Object.entries(efectividad)) {
            if (tabla[tipoDefensa] && tabla[tipoDefensa] > 1) {
                if (!debilA.includes(tipoAtaque)) debilA.push(tipoAtaque);
            }
            if (tabla[tipoDefensa] && tabla[tipoDefensa] < 1 && tabla[tipoDefensa] > 0) {
                if (!resisteA.includes(tipoAtaque)) resisteA.push(tipoAtaque);
            }
            if (tabla[tipoDefensa] === 0) {
                if (!inmuneA.includes(tipoAtaque)) inmuneA.push(tipoAtaque);
            }
        }
    }

    return { debilA, resisteA, inmuneA };
}

export default function PokedexPage() {
    const [starters, setStarters] = useState<StarterData[]>([]);
    const [stats, setStats] = useState({ total: 27, claimed: 0, available: 27 });
    const [loading, setLoading] = useState(true);
    const [pokemon, setPokemon] = useState<StarterData | null>(null);
    const [filterGen, setFilterGen] = useState<number | null>(null);
    const [filterType, setFilterType] = useState<string | null>(null);
    const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
    const [nivel, setNivel] = useState(5);

    useEffect(() => {
        preloadSounds();
        fetchStarters();
    }, []);

    const fetchStarters = async () => {
        try {
            const data = await startersAPI.getAll();
            if (data.starters) {
                setStarters(data.starters);
                setStats(data.stats || { total: 27, claimed: 0, available: 27 });
            }
        } catch (e) {
            console.error('Error:', e);
        } finally {
            setLoading(false);
        }
    };

    const filteredStarters = (starters || []).filter((s) => {
        if (!s) return false;
        if (filterGen && s.generation !== filterGen) return false;
        if (filterType && s.types && !s.types.includes(filterType)) return false;
        if (showOnlyAvailable && s.isClaimed) return false;
        return true;
    });

    const evolucionActual = useMemo(() => {
        if (!pokemon) return null;

        let spriteId = pokemon.pokemonId;
        let nombre = pokemon.nameEs || pokemon.name;

        for (const evo of pokemon.evolutions) {
            const nivelEvo = parseInt(evo.method.replace(/\D/g, '')) || 16;
            if (nivel >= nivelEvo) {
                spriteId = evo.to;
                nombre = evo.toName;
            }
        }

        const sprite = spriteId <= 649
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${spriteId}.gif`
            : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${spriteId}.gif`;

        return { sprite, nombre, id: spriteId };
    }, [pokemon, nivel]);

    const matchups = useMemo(() => {
        if (!pokemon) return null;
        return calcularDebilidades(pokemon.types);
    }, [pokemon]);

    const spawnInfo = useMemo(() => {
        if (!pokemon) return null;
        return COBBLEMON_SPAWN_DATA[pokemon.pokemonId] || null;
    }, [pokemon]);

    const handleSelectPokemon = (s: StarterData) => {
        playSound('open');
        playCry(s.pokemonId);
        setPokemon(s);
        setNivel(5);
    };

    const handleFilterClick = (callback: () => void) => {
        playSound('click');
        callback();
    };

    const generations = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    return (
        <div className="min-h-screen px-2 sm:px-4 py-4 sm:py-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-4 sm:mb-8">
                    <h1 className="pixel-font text-lg sm:text-2xl md:text-3xl text-white mb-2">
                        <i className="fas fa-book text-red-500 mr-2 sm:mr-3"></i>
                        POKÉDEX
                    </h1>
                    <p className="text-gray-400 text-xs sm:text-base">Información de Pokémon iniciales</p>
                </div>

                {/* Stats */}
                <div className="glass-dark rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 flex justify-center gap-4 sm:gap-6">
                    <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-white">{stats?.total ?? 27}</div>
                        <div className="text-[10px] sm:text-xs text-gray-400">Total</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-green-400">{stats?.available ?? 27}</div>
                        <div className="text-[10px] sm:text-xs text-gray-400">Disponibles</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-red-400">{stats?.claimed ?? 0}</div>
                        <div className="text-[10px] sm:text-xs text-gray-400">Reclamados</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="glass-dark rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                    <div className="flex flex-col gap-3 sm:gap-4">
                        {/* Gen filter */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-gray-400 text-xs sm:text-sm w-full sm:w-auto mb-1 sm:mb-0">Gen:</span>
                            <div className="flex gap-1 flex-wrap">
                                <button
                                    onClick={() => handleFilterClick(() => setFilterGen(null))}
                                    className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-all ${!filterGen ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    Todas
                                </button>
                                {generations.map((g) => (
                                    <button
                                        key={g}
                                        onClick={() => handleFilterClick(() => setFilterGen(g === filterGen ? null : g))}
                                        className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-all ${filterGen === g ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Type and available filter */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs sm:text-sm">Tipo:</span>
                                <div className="flex gap-1">
                                    {['Grass', 'Fire', 'Water'].map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => handleFilterClick(() => setFilterType(t === filterType ? null : t))}
                                            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold text-white transition-all ${filterType === t ? 'ring-2 ring-white scale-105' : 'opacity-70 hover:opacity-100'
                                                }`}
                                            style={{ backgroundColor: TIPO_COLORES[t] }}
                                        >
                                            {TIPOS[t]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showOnlyAvailable}
                                    onChange={(e) => { playSound('click'); setShowOnlyAvailable(e.target.checked); }}
                                    className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-500"
                                />
                                <span className="text-xs sm:text-sm text-gray-300">Solo disponibles</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="text-center py-12 sm:py-20">
                        <i className="fas fa-spinner fa-spin text-3xl sm:text-4xl text-white mb-4"></i>
                        <p className="text-gray-400 text-sm">Cargando Pokédex...</p>
                    </div>
                )}

                {/* Grid - responsive columns */}
                {!loading && (
                    <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4">
                        {filteredStarters.map((s) => (
                            <div key={s.pokemonId} className={`relative ${s.isClaimed ? 'opacity-60' : ''}`}>
                                <StarterCard
                                    starter={s}
                                    isShiny={s.isShiny}
                                    size="icon"
                                    claimedBy={s.claimedBy}
                                    onClick={() => handleSelectPokemon(s)}
                                />
                                {s.isClaimed && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-xl pointer-events-none gap-1">
                                        <span className="bg-red-600 text-white text-[8px] sm:text-[10px] px-1 sm:px-2 py-0.5 sm:py-1 rounded font-bold">
                                            RECLAMADO
                                        </span>
                                        {s.claimedBy && (
                                            <span className="bg-gray-800/90 text-white text-[7px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded font-medium">
                                                {s.claimedBy}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty */}
                {!loading && filteredStarters.length === 0 && (
                    <div className="text-center py-12 sm:py-20">
                        <i className="fas fa-search text-3xl sm:text-4xl text-gray-600 mb-4"></i>
                        <p className="text-gray-400 text-sm">No se encontraron Pokémon</p>
                    </div>
                )}

                {/* Pokemon Detail Modal */}
                {pokemon && (
                    <div
                        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 overflow-y-auto"
                        onClick={() => { playSound('cancel'); setPokemon(null); }}
                    >
                        <div
                            className="relative w-full max-w-4xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-none sm:rounded-3xl border-0 sm:border-2 shadow-2xl my-0 sm:my-8 max-h-[85vh] overflow-y-auto"
                            style={{ borderColor: `${TIPO_COLORES[pokemon.types?.[0] || 'Normal']}60` }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close */}
                            <button
                                onClick={() => { playSound('cancel'); setPokemon(null); }}
                                className="sticky top-2 right-2 sm:absolute sm:-top-3 sm:-right-3 z-50 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-2xl transition-all ml-auto mr-2 sm:mr-0 hover:scale-110"
                                style={{ background: `linear-gradient(135deg, ${TIPO_COLORES[pokemon.types?.[0] || 'Normal']}, ${TIPO_COLORES[pokemon.types?.[1] || pokemon.types?.[0] || 'Normal']})` }}
                            >
                                <i className="fas fa-times text-sm"></i>
                            </button>

                            {/* Compact Header */}
                            <div className="relative overflow-hidden">
                                {/* Animated background */}
                                <div
                                    className="absolute inset-0 opacity-20"
                                    style={{
                                        background: `radial-gradient(circle at 30% 50%, ${TIPO_COLORES[pokemon.types?.[0] || 'Normal']}60, transparent 50%), radial-gradient(circle at 70% 50%, ${TIPO_COLORES[pokemon.types?.[1] || pokemon.types?.[0] || 'Normal']}60, transparent 50%)`
                                    }}
                                ></div>

                                <div className="relative p-3 sm:p-4">
                                    <div className="flex items-start gap-4 sm:gap-6">
                                        {/* Sprite Section */}
                                        <div className="relative flex-shrink-0">
                                            <div
                                                className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl flex items-center justify-center relative overflow-hidden"
                                                style={{
                                                    background: `linear-gradient(135deg, ${TIPO_COLORES[pokemon.types?.[0] || 'Normal']}20, ${TIPO_COLORES[pokemon.types?.[1] || pokemon.types?.[0] || 'Normal']}10)`,
                                                    boxShadow: `0 8px 32px ${TIPO_COLORES[pokemon.types?.[0] || 'Normal']}40`
                                                }}
                                            >
                                                <img
                                                    src={evolucionActual?.sprite}
                                                    alt={evolucionActual?.nombre}
                                                    className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.4)] cursor-pointer hover:scale-110 transition-transform z-10"
                                                    onClick={() => { playCry(evolucionActual?.id || pokemon.pokemonId); }}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemonId}.png`;
                                                    }}
                                                />
                                            </div>
                                            <p className="text-[9px] text-gray-500 text-center mt-1.5">Click para grito</p>
                                        </div>

                                        {/* Info Section */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-gray-500 text-xs font-mono">#{String(pokemon.pokemonId).padStart(3, '0')}</span>
                                                <span className="text-gray-600">•</span>
                                                <span className="text-gray-500 text-xs">Gen {pokemon.generation}</span>
                                                {pokemon.isClaimed && pokemon.claimedBy && (
                                                    <>
                                                        <span className="text-gray-600">•</span>
                                                        <span className="text-red-400 text-xs flex items-center gap-1">
                                                            <i className="fas fa-lock text-[10px]"></i>
                                                            {pokemon.claimedBy}
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            <h2 className="text-2xl sm:text-3xl font-bold text-white pixel-font mb-3 leading-tight">
                                                {evolucionActual?.nombre}
                                            </h2>

                                            {/* Types & Physical Info */}
                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                {(pokemon.types || []).map((t) => (
                                                    <span
                                                        key={t}
                                                        className="px-3 py-1 rounded-lg text-white text-xs font-bold shadow-lg"
                                                        style={{ backgroundColor: TIPO_COLORES[t] }}
                                                    >
                                                        {TIPOS[t]}
                                                    </span>
                                                ))}
                                                <div className="flex items-center gap-3 text-xs ml-2">
                                                    <span className="flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded-md">
                                                        <i className="fas fa-arrows-alt-v text-blue-400"></i>
                                                        <strong className="text-white">{pokemon.height}</strong>
                                                        <span className="text-gray-400">m</span>
                                                    </span>
                                                    <span className="flex items-center gap-1 bg-orange-500/10 px-2 py-1 rounded-md">
                                                        <i className="fas fa-weight-hanging text-orange-400"></i>
                                                        <strong className="text-white">{pokemon.weight}</strong>
                                                        <span className="text-gray-400">kg</span>
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Level Slider - Compact */}
                                            <div className="bg-black/20 rounded-lg p-2 border border-gray-700/50">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="text-gray-400 text-xs font-medium whitespace-nowrap">Nivel</span>
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="100"
                                                        value={nivel}
                                                        onChange={(e) => setNivel(parseInt(e.target.value))}
                                                        className="flex-1 h-1 bg-gray-700/50 rounded-full appearance-none cursor-pointer"
                                                        style={{
                                                            background: `linear-gradient(to right, ${TIPO_COLORES[pokemon.types?.[0] || 'Normal']} 0%, ${TIPO_COLORES[pokemon.types?.[0] || 'Normal']} ${nivel}%, #374151 ${nivel}%, #374151 100%)`
                                                        }}
                                                    />
                                                    <span className="text-white font-bold text-sm w-8 text-right">{nivel}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Evolution chain - Compact */}
                                    {pokemon.evolutions && pokemon.evolutions.length > 0 && (
                                        <div className="mt-4 bg-black/30 backdrop-blur-sm rounded-xl p-3 border border-purple-500/20">
                                            <div className="flex items-center gap-2 mb-2">
                                                <i className="fas fa-dna text-purple-400 text-xs"></i>
                                                <span className="text-gray-300 text-xs font-bold uppercase">Evoluciones</span>
                                            </div>
                                            <div className="flex items-center justify-start gap-2 overflow-x-auto pb-1">
                                                <div className={`flex flex-col items-center transition-all flex-shrink-0 p-2 rounded-lg ${nivel < 16 ? 'bg-purple-500/20 scale-105' : 'opacity-60'}`}>
                                                    <img
                                                        src={pokemon.pokemonId <= 649
                                                            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemon.pokemonId}.gif`
                                                            : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemonId}.png`}
                                                        alt="" className="w-12 h-12 cursor-pointer hover:scale-110 transition-transform"
                                                        onClick={() => playCry(pokemon.pokemonId)}
                                                    />
                                                    <span className="text-[9px] text-white font-medium mt-1 max-w-[60px] truncate">{pokemon.nameEs || pokemon.name}</span>
                                                    <span className="text-[8px] text-purple-300">Nv.1</span>
                                                </div>
                                                {pokemon.evolutions.map((evo, i) => {
                                                    const evoNivel = parseInt(evo.method.replace(/\D/g, '')) || 16 * (i + 1);
                                                    const isActivo = nivel >= evoNivel;
                                                    return (
                                                        <div key={i} className="flex items-center gap-2 flex-shrink-0">
                                                            <i className="fas fa-chevron-right text-purple-400 text-xs"></i>
                                                            <div className={`flex flex-col items-center transition-all p-2 rounded-lg ${isActivo ? 'bg-purple-500/20 scale-105' : 'opacity-60'}`}>
                                                                <img
                                                                    src={evo.to <= 649
                                                                        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${evo.to}.gif`
                                                                        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evo.to}.png`}
                                                                    alt="" className="w-12 h-12 cursor-pointer hover:scale-110 transition-transform"
                                                                    onClick={() => playCry(evo.to)}
                                                                />
                                                                <span className="text-[9px] text-white font-medium mt-1 max-w-[60px] truncate">{evo.toName}</span>
                                                                <span className="text-[8px] text-purple-300">Nv.{evoNivel}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Content - Tabs Style */}
                            <div className="p-3 sm:p-4 space-y-3">
                                {/* Description First */}
                                <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-xl p-4 border border-slate-600/50">
                                    <p className="text-gray-300 text-sm italic leading-relaxed text-center">"{pokemon.description}"</p>
                                </div>

                                {/* Stats & Type Matchups Side by Side */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Stats */}
                                    <div
                                        className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-xl p-4 border backdrop-blur-sm"
                                        style={{ borderColor: `${TIPO_COLORES[pokemon.types?.[0] || 'Normal']}30` }}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                                <i className="fas fa-chart-bar text-blue-400"></i>
                                                Estadísticas
                                            </h4>
                                            <span className="text-xl font-bold text-blue-400">
                                                {pokemon.stats ? Object.values(pokemon.stats).reduce((a: number, b: any) => a + (b as number), 0) : 0}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {[
                                                { nombre: 'PS', key: 'hp', color: '#22c55e', icono: 'heart' },
                                                { nombre: 'Ataque', key: 'atk', color: '#ef4444', icono: 'fist-raised' },
                                                { nombre: 'Defensa', key: 'def', color: '#f59e0b', icono: 'shield-alt' },
                                                { nombre: 'At.Esp', key: 'spa', color: '#8b5cf6', icono: 'magic' },
                                                { nombre: 'Def.Esp', key: 'spd', color: '#06b6d4', icono: 'shield' },
                                                { nombre: 'Velocidad', key: 'spe', color: '#ec4899', icono: 'bolt' },
                                            ].map((s) => (
                                                <div key={s.key} className="flex items-center gap-2">
                                                    <div className="w-20 flex items-center gap-1.5">
                                                        <i className={`fas fa-${s.icono} text-[10px]`} style={{ color: s.color }}></i>
                                                        <span className="text-gray-400 text-xs">{s.nombre}</span>
                                                    </div>
                                                    <div className="flex-1 h-2 bg-gray-900/50 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-700"
                                                            style={{
                                                                width: `${Math.min(100, (pokemon.stats[s.key] / 150) * 100)}%`,
                                                                backgroundColor: s.color,
                                                                boxShadow: `0 0 8px ${s.color}80`,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="w-9 text-right font-mono text-white font-bold text-xs">
                                                        {pokemon.stats[s.key]}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Type matchups */}
                                    <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 rounded-xl p-4 border border-yellow-600/30 backdrop-blur-sm">
                                        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                            <i className="fas fa-crosshairs text-yellow-400"></i>
                                            Efectividad
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <div className="text-xs text-red-400 font-bold mb-1.5 flex items-center gap-1.5">
                                                    <i className="fas fa-arrow-down text-[10px]"></i> Débil ×2
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {matchups?.debilA.length ? matchups.debilA.map((t) => (
                                                        <span key={t} className="text-[10px] px-2 py-1 rounded-md text-white font-bold" style={{ backgroundColor: TIPO_COLORES[t] }}>
                                                            {TIPOS[t]}
                                                        </span>
                                                    )) : <span className="text-gray-500 text-xs">Ninguno</span>}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-green-400 font-bold mb-1.5 flex items-center gap-1.5">
                                                    <i className="fas fa-shield text-[10px]"></i> Resiste ×0.5
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {matchups?.resisteA.length ? matchups.resisteA.map((t) => (
                                                        <span key={t} className="text-[10px] px-2 py-1 rounded-md text-white font-bold" style={{ backgroundColor: TIPO_COLORES[t] }}>
                                                            {TIPOS[t]}
                                                        </span>
                                                    )) : <span className="text-gray-500 text-xs">Ninguno</span>}
                                                </div>
                                            </div>
                                            {matchups?.inmuneA && matchups.inmuneA.length > 0 && (
                                                <div>
                                                    <div className="text-xs text-purple-400 font-bold mb-1.5 flex items-center gap-1.5">
                                                        <i className="fas fa-ban text-[10px]"></i> Inmune ×0
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {matchups.inmuneA.map((t) => (
                                                            <span key={t} className="text-[10px] px-2 py-1 rounded-md text-white font-bold" style={{ backgroundColor: TIPO_COLORES[t] }}>
                                                                {TIPOS[t]}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Abilities & Moves Row */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    {/* Abilities */}
                                    <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl p-4 border border-purple-600/30 backdrop-blur-sm">
                                        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                            <i className="fas fa-star text-purple-400"></i>
                                            Habilidades
                                        </h4>
                                        <div className="space-y-2">
                                            {(pokemon.abilities || []).map((ab, i) => (
                                                <div key={i} className={`p-2.5 rounded-lg ${ab.isHidden ? 'bg-purple-500/20 border border-purple-400/40' : 'bg-black/30 border border-gray-600/30'}`}>
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <span className={`font-bold text-xs ${ab.isHidden ? 'text-purple-300' : 'text-white'}`}>
                                                            {ab.nameEs || ab.name}
                                                        </span>
                                                        {ab.isHidden && <span className="text-[8px] text-purple-300 bg-purple-900/50 px-1.5 py-0.5 rounded font-bold">OCULTA</span>}
                                                    </div>
                                                    <p className="text-gray-400 text-[10px] leading-relaxed">{ab.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Moves */}
                                    <div className="lg:col-span-2 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-xl p-4 border border-cyan-600/30 backdrop-blur-sm">
                                        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                            <i className="fas fa-bolt text-cyan-400"></i>
                                            Movimientos
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                            {(pokemon.signatureMoves || []).map((mv, i) => (
                                                <div key={i} className="bg-black/30 rounded-lg p-2 border border-gray-600/30 hover:border-cyan-500/50 transition-colors">
                                                    <div className="text-white text-xs font-medium mb-1.5 truncate">{mv.name}</div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span
                                                            className="text-[9px] px-1.5 py-0.5 rounded text-white font-bold"
                                                            style={{ backgroundColor: TIPO_COLORES[mv.type] || '#666' }}
                                                        >
                                                            {TIPOS[mv.type] || mv.type}
                                                        </span>
                                                        {mv.power && <span className="text-[10px] text-gray-400 font-mono font-bold">{mv.power}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Cobblemon Spawn Data */}
                                {spawnInfo && (
                                    <div className="bg-gradient-to-br from-emerald-900/20 to-green-900/20 rounded-xl p-4 border border-emerald-600/40 backdrop-blur-sm">
                                        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                            <i className="fas fa-map-marked-alt text-emerald-400"></i>
                                            Aparición en Cobblemon
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                                            {/* Rarity */}
                                            <div className="bg-black/30 rounded-lg p-2 border border-emerald-700/30">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <i className="fas fa-gem text-purple-400 text-[10px]"></i>
                                                    <span className="text-gray-400 text-[10px] font-medium uppercase">Rareza</span>
                                                </div>
                                                <span className="text-white text-xs font-bold">{spawnInfo.rarity}</span>
                                            </div>

                                            {/* Levels */}
                                            <div className="bg-black/30 rounded-lg p-2 border border-emerald-700/30">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <i className="fas fa-signal text-yellow-400 text-[10px]"></i>
                                                    <span className="text-gray-400 text-[10px] font-medium uppercase">Niveles</span>
                                                </div>
                                                <span className="text-white text-xs font-bold">{spawnInfo.levels}</span>
                                            </div>

                                            {/* Time/Weather */}
                                            <div className="bg-black/30 rounded-lg p-2 border border-emerald-700/30 col-span-2">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <i className="fas fa-cloud-sun text-cyan-400 text-[10px]"></i>
                                                    <span className="text-gray-400 text-[10px] font-medium uppercase">Hora/Clima</span>
                                                </div>
                                                <span className="text-white text-xs">{spawnInfo.timeWeather}</span>
                                            </div>
                                        </div>

                                        {/* Spawn Types */}
                                        <div className="mb-3">
                                            <div className="flex items-center gap-1 mb-1.5">
                                                <i className="fas fa-location-arrow text-blue-400 text-[10px]"></i>
                                                <span className="text-gray-400 text-[10px] font-medium uppercase">Tipos de Aparición</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {spawnInfo.spawnType.map((type, i) => (
                                                    <span key={i} className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md font-bold border border-blue-500/40">
                                                        {type}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Biomes */}
                                        <div className="mb-3">
                                            <div className="flex items-center gap-1 mb-1.5">
                                                <i className="fas fa-tree text-green-400 text-[10px]"></i>
                                                <span className="text-gray-400 text-[10px] font-medium uppercase">Biomas</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {spawnInfo.biomes.map((biome, i) => (
                                                    <span key={i} className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-md font-bold border border-green-500/40">
                                                        {biome}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Additional Conditions */}
                                        {(spawnInfo.skylight || spawnInfo.canSeeSky !== undefined || spawnInfo.presets.length > 0) && (
                                            <div className="bg-black/20 rounded-lg p-2 border border-emerald-700/20">
                                                <div className="flex items-center gap-1 mb-1.5">
                                                    <i className="fas fa-info-circle text-orange-400 text-[10px]"></i>
                                                    <span className="text-gray-400 text-[10px] font-medium uppercase">Condiciones</span>
                                                </div>
                                                <div className="space-y-1">
                                                    {spawnInfo.skylight && (
                                                        <div className="flex items-center gap-1.5 text-[10px]">
                                                            <span className="text-gray-500">Luz:</span>
                                                            <span className="text-white font-medium">{spawnInfo.skylight}</span>
                                                        </div>
                                                    )}
                                                    {spawnInfo.canSeeSky !== undefined && (
                                                        <div className="flex items-center gap-1.5 text-[10px]">
                                                            <span className="text-gray-500">Cielo visible:</span>
                                                            <span className="text-white font-medium">
                                                                {typeof spawnInfo.canSeeSky === 'boolean'
                                                                    ? (spawnInfo.canSeeSky ? 'Sí' : 'No')
                                                                    : spawnInfo.canSeeSky}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {spawnInfo.presets.length > 0 && (
                                                        <div className="flex items-start gap-1.5 text-[10px]">
                                                            <span className="text-gray-500">Presets:</span>
                                                            <div className="flex flex-wrap gap-1">
                                                                {spawnInfo.presets.map((preset, i) => (
                                                                    <span key={i} className="bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded border border-orange-500/30 font-medium">
                                                                        {preset}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
