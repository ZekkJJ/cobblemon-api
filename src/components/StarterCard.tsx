'use client';

import { getTypeColor } from '@/lib/starters-data';

interface StarterCardProps {
    starter: {
        pokemonId: number;
        name: string;
        nameEs: string;
        types: string[];
        stats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
        abilities: { name: string; nameEs: string; isHidden: boolean; description: string }[];
        signatureMoves: { name: string; type: string; power: number | null }[];
        evolutions: { to: number; toName: string; method: string }[];
        description: string;
        height: number;
        weight: number;
    };
    isShiny?: boolean;
    size?: 'full' | 'compact' | 'icon';
    showAnimation?: boolean;
    claimedBy?: string | null;
    onClick?: () => void;
}

export default function StarterCard({
    starter,
    isShiny = false,
    size = 'full',
    showAnimation = true,
    claimedBy,
    onClick,
}: StarterCardProps) {
    const primaryType = starter.types[0];
    const typeColor = getTypeColor(primaryType);

    // Get sprite URLs
    const hasAnimated = starter.pokemonId <= 649;
    const spriteUrl = isShiny
        ? hasAnimated
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/shiny/${starter.pokemonId}.gif`
            : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/shiny/${starter.pokemonId}.gif`
        : hasAnimated
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${starter.pokemonId}.gif`
            : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${starter.pokemonId}.gif`;

    const cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${starter.pokemonId}.ogg`;

    const playCry = () => {
        const audio = new Audio(cryUrl);
        audio.volume = 0.5;
        audio.play().catch(() => { });
    };

    if (size === 'icon') {
        return (
            <div
                onClick={() => { playCry(); onClick?.(); }}
                className={`relative cursor-pointer aspect-square rounded-xl border-2 p-2 flex flex-col items-center justify-center transition-all hover:scale-105 hover:shadow-lg ${isShiny ? 'border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : ''
                    } ${claimedBy ? 'opacity-60' : 'bg-white/95'}`}
                style={{ borderColor: isShiny ? undefined : typeColor }}
            >
                {isShiny && (
                    <span className="absolute top-1 right-1 text-yellow-500 text-sm animate-pulse">
                        <i className="fas fa-star"></i>
                    </span>
                )}
                <img
                    src={spriteUrl}
                    alt={starter.name}
                    className="w-14 h-14 object-contain drop-shadow"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${starter.pokemonId}.png`;
                    }}
                />
                <span className="text-[10px] font-bold text-gray-700 mt-1 truncate w-full text-center">
                    {starter.name}
                </span>
                {claimedBy && (
                    <span className="text-[8px] text-gray-500 truncate w-full text-center">
                        {claimedBy}
                    </span>
                )}
            </div>
        );
    }

    if (size === 'compact') {
        return (
            <div
                onClick={() => { playCry(); onClick?.(); }}
                className={`cursor-pointer rounded-xl border-2 p-3 flex items-center gap-3 transition-all hover:shadow-lg bg-white/95 ${isShiny ? 'border-yellow-400 ring-2 ring-yellow-300' : ''
                    }`}
                style={{ borderColor: isShiny ? undefined : typeColor }}
            >
                <img
                    src={spriteUrl}
                    alt={starter.name}
                    className="w-16 h-16 object-contain"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">{starter.name}</span>
                        {isShiny && <i className="fas fa-star text-yellow-500"></i>}
                    </div>
                    <div className="flex gap-1 mt-1">
                        {starter.types.map((type) => (
                            <span
                                key={type}
                                className="type-badge text-[10px]"
                                style={{ backgroundColor: getTypeColor(type) }}
                            >
                                {type}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Full size card
    return (
        <div
            className={`w-full glass-card p-5 flex flex-col items-center rounded-2xl border-4 shadow-xl relative ${showAnimation ? 'card-enter' : ''
                } ${isShiny ? 'shine-effect ring-4 ring-yellow-400' : ''}`}
            style={{ borderColor: typeColor }}
        >
            {/* Shiny star */}
            {isShiny && (
                <span className="absolute top-2 right-2 text-yellow-500 text-xl animate-pulse">
                    <i className="fas fa-star"></i>
                </span>
            )}

            {/* Header */}
            <div className="w-full flex justify-between items-start mb-2">
                <span className="font-bold text-gray-500 text-sm">
                    #{String(starter.pokemonId).padStart(3, '0')}
                </span>
                <div className="flex gap-1">
                    {starter.types.map((type) => (
                        <span
                            key={type}
                            className="type-badge flex items-center gap-1"
                            style={{ backgroundColor: getTypeColor(type) }}
                        >
                            <i className={`fas fa-${type === 'Grass' ? 'leaf' : type === 'Fire' ? 'fire' : type === 'Water' ? 'tint' : 'circle'}`}></i>
                            {type}
                        </span>
                    ))}
                </div>
            </div>

            {/* Sprite */}
            <div className="flex-grow flex items-center justify-center relative w-full min-h-[140px] mb-2">
                <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent opacity-50 rounded-full blur-xl transform scale-75 translate-y-4"></div>
                {isShiny && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="sparkle" style={{ top: '20%', left: '20%' }}></div>
                        <div className="sparkle" style={{ top: '70%', left: '80%', animationDelay: '0.5s' }}></div>
                    </div>
                )}
                <img
                    onClick={playCry}
                    src={spriteUrl}
                    alt={starter.name}
                    className="h-40 w-40 object-contain drop-shadow-2xl z-10 cursor-pointer hover:scale-110 transition-transform active:scale-95"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${starter.pokemonId}.png`;
                    }}
                />
            </div>

            {/* Info section */}
            <div className="w-full bg-white bg-opacity-80 rounded-xl p-4 backdrop-blur-sm shadow-sm border border-gray-100">
                <h2
                    className="text-2xl font-bold text-center mb-1 pixel-font tracking-wide"
                    style={{ color: typeColor }}
                >
                    {starter.name}
                </h2>
                <p className="text-xs text-gray-600 italic text-center mb-4 leading-relaxed border-b border-gray-200 pb-3">
                    "{starter.description}"
                </p>

                {/* Stats */}
                <div className="space-y-2">
                    {[
                        { label: 'PS', value: starter.stats.hp, color: '#22c55e' },
                        { label: 'ATQ', value: starter.stats.atk, color: '#ef4444' },
                        { label: 'DEF', value: starter.stats.def, color: '#f59e0b' },
                        { label: 'VEL', value: starter.stats.spe, color: '#3b82f6' },
                    ].map((stat) => (
                        <div key={stat.label} className="flex items-center text-xs">
                            <span className="w-8 font-bold text-gray-400">{stat.label}</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden ml-2 shadow-inner">
                                <div
                                    className="h-full stat-bar-fill"
                                    style={{
                                        width: `${(stat.value / 100) * 100}%`,
                                        backgroundColor: stat.color,
                                        boxShadow: `0 0 5px ${stat.color}`,
                                    }}
                                ></div>
                            </div>
                            <span className="ml-2 w-6 text-right font-mono font-bold text-gray-600">
                                {stat.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
