'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { playSound } from '@/lib/sounds';
import ServerIndicator from '@/components/ServerIndicator';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Navbar() {
    const pathname = usePathname();
    const [localUser, setLocalUser] = useState<any>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [sfxMuted, setSfxMuted] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('cobblemon_user');
        if (stored) {
            setLocalUser(JSON.parse(stored));
        }
        setSfxMuted(localStorage.getItem('sfx_muted') === 'true');
    }, []);

    const user = localUser;
    const isLoggedIn = !!user;

    const navLinks = [
        { href: '/', label: 'Gacha', icon: 'fa-dice' },
        { href: '/tienda', label: 'Tienda', icon: 'fa-shopping-cart' },
        { href: '/servidor', label: 'Servidor', icon: 'fa-server' },
        { href: '/pokedex', label: 'Pokédex', icon: 'fa-book' },
        { href: '/jugadores', label: 'Jugadores', icon: 'fa-users' },
        { href: '/galeria', label: 'Galería', icon: 'fa-th' },
        { href: '/comparador', label: 'Comparar', icon: 'fa-balance-scale' },
        { href: '/torneos', label: 'Torneos', icon: 'fa-trophy' },
    ];

    const handleLogout = () => {
        playSound('cancel');
        localStorage.removeItem('cobblemon_user');
        setLocalUser(null);
        window.location.reload();
    };

    const handleLogin = async () => {
        playSound('confirm');

        try {
            // Get Discord auth URL from backend
            const response = await fetch(`${API_BASE_URL}/api/auth/discord`);
            const data = await response.json();

            if (data.success && data.authUrl) {
                // Redirect to Discord OAuth
                window.location.href = data.authUrl;
            } else {
                console.error('Failed to get auth URL:', data);
                alert('Error al iniciar sesión. Por favor intenta de nuevo.');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Error al conectar con el servidor.');
        }
    };

    const handleNavClick = () => {
        playSound('click');
        setMenuOpen(false);
    };

    const toggleSfx = () => {
        const newVal = !sfxMuted;
        setSfxMuted(newVal);
        localStorage.setItem('sfx_muted', String(newVal));
        if (!newVal) playSound('confirm');
    };

    return (
        <header className="w-full bg-gradient-to-r from-red-700 to-red-600 text-white shadow-lg border-b-4 border-red-900 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 lg:h-20">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 sm:gap-3 group flex-shrink-0"
                        onClick={() => playSound('click')}
                    >
                        <img
                            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
                            alt="Pokeball"
                            className="w-8 h-8 sm:w-10 sm:h-10 group-hover:animate-spin"
                        />
                        <span className="pixel-font text-sm sm:text-base lg:text-lg font-bold">
                            PITUFOS
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-2 xl:gap-3 flex-1 justify-center mx-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => playSound('click')}
                                className={`px-4 py-2.5 rounded-lg font-medium transition-all hover:bg-red-800 flex items-center gap-2 text-sm xl:text-base ${pathname === link.href
                                    ? 'bg-red-900 border-b-2 border-white shadow-lg'
                                    : ''
                                    }`}
                            >
                                <i className={`fas ${link.icon} text-sm`}></i>
                                <span>{link.label}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Server Status Indicator */}
                        <div className="hidden lg:block">
                            <ServerIndicator />
                        </div>

                        {/* SFX toggle */}
                        <button
                            onClick={toggleSfx}
                            className={`p-2.5 rounded-lg transition-colors ${sfxMuted ? 'bg-gray-600 text-gray-400' : 'hover:bg-red-800'}`}
                            title={sfxMuted ? 'Activar SFX' : 'Silenciar SFX'}
                        >
                            <i className={`fas ${sfxMuted ? 'fa-volume-mute' : 'fa-volume-up'} text-base`}></i>
                        </button>

                        {isLoggedIn ? (
                            <div className="hidden sm:flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-red-900 bg-opacity-50 px-3 py-2 rounded-lg">
                                    {user.image && (
                                        <img
                                            src={user.image}
                                            alt=""
                                            className="w-6 h-6 rounded-full"
                                        />
                                    )}
                                    <span className="text-sm font-medium max-w-[120px] truncate">
                                        {(user as any).nickname || user.name}
                                    </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2.5 hover:bg-red-800 rounded-lg transition-colors"
                                    title="Cerrar sesión"
                                >
                                    <i className="fas fa-sign-out-alt text-base"></i>
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleLogin}
                                className="hidden sm:flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] px-4 py-2.5 rounded-lg font-medium transition-colors text-sm"
                            >
                                <i className="fab fa-discord"></i>
                                <span>Login</span>
                            </button>
                        )}

                        {/* Mobile menu button */}
                        <button
                            className="lg:hidden p-2.5 hover:bg-red-800 rounded-lg transition-colors"
                            onClick={() => { playSound('click'); setMenuOpen(!menuOpen); }}
                        >
                            <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'} text-lg`}></i>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {menuOpen && (
                    <nav className="lg:hidden pb-4 pt-2 flex flex-col gap-2 border-t border-red-800 mt-2">
                        {/* Mobile Server Status */}
                        <div className="lg:hidden mb-2">
                            <ServerIndicator />
                        </div>

                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={handleNavClick}
                                className={`px-4 py-3 rounded-lg font-medium transition-all hover:bg-red-800 flex items-center gap-3 text-base ${pathname === link.href ? 'bg-red-900 border-l-4 border-white' : ''
                                    }`}
                            >
                                <i className={`fas ${link.icon} w-5 text-center`}></i>
                                {link.label}
                            </Link>
                        ))}

                        {/* Mobile User Actions */}
                        {isLoggedIn ? (
                            <div className="sm:hidden mt-2 pt-2 border-t border-red-800 flex flex-col gap-2">
                                <div className="flex items-center gap-2 bg-red-900 bg-opacity-50 px-4 py-3 rounded-lg">
                                    {user.image && (
                                        <img
                                            src={user.image}
                                            alt=""
                                            className="w-6 h-6 rounded-full"
                                        />
                                    )}
                                    <span className="text-sm font-medium">
                                        {(user as any).nickname || user.name}
                                    </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-3 hover:bg-red-800 rounded-lg transition-colors flex items-center gap-3"
                                >
                                    <i className="fas fa-sign-out-alt w-5 text-center"></i>
                                    <span>Cerrar sesión</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => { handleLogin(); setMenuOpen(false); }}
                                className="sm:hidden mt-2 pt-2 border-t border-red-800 flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] px-4 py-3 rounded-lg font-medium transition-colors text-base"
                            >
                                <i className="fab fa-discord"></i>
                                <span>Login con Discord</span>
                            </button>
                        )}
                    </nav>
                )}
            </div>
        </header>
    );
}
