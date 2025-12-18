'use client';

import ServerStatus from '@/components/ServerStatus';

export default function ServidorPage() {
    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 py-16 px-4 sm:py-20">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute inset-0 bg-[url('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png')] bg-repeat opacity-5"></div>

                <div className="relative max-w-5xl mx-auto text-center">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 pixel-font drop-shadow-lg">
                        <i className="fas fa-server mr-3 sm:mr-4"></i>
                        Servidor
                    </h1>
                    <p className="text-base sm:text-lg lg:text-xl text-white/90 max-w-2xl mx-auto">
                        Información y estado del servidor de Minecraft
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="flex justify-center mb-12">
                    <ServerStatus />
                </div>

                {/* Additional Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* How to Connect */}
                    <div className="group bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 lg:p-7 border border-gray-700/50 hover:border-emerald-500/50 transition-all hover:shadow-xl hover:shadow-emerald-500/20">
                        <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                            <i className="fas fa-plug text-emerald-400 text-2xl"></i>
                        </div>
                        <h3 className="text-white font-bold text-xl mb-4">Cómo Conectar</h3>
                        <ol className="text-gray-400 text-sm space-y-3">
                            <li className="flex items-start gap-3">
                                <span className="bg-emerald-500/20 text-emerald-400 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                                <span>Abre Minecraft Java Edition</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="bg-emerald-500/20 text-emerald-400 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                                <span>Ve a Multijugador → Añadir servidor</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="bg-emerald-500/20 text-emerald-400 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                                <span>Ingresa la IP del servidor</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="bg-emerald-500/20 text-emerald-400 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                                <span>¡Únete y disfruta!</span>
                            </li>
                        </ol>
                    </div>

                    {/* Modpack */}
                    <div className="group bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 lg:p-7 border border-gray-700/50 hover:border-purple-500/50 transition-all hover:shadow-xl hover:shadow-purple-500/20">
                        <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                            <i className="fas fa-cube text-purple-400 text-2xl"></i>
                        </div>
                        <h3 className="text-white font-bold text-xl mb-3">Cobblemon</h3>
                        <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                            Nuestro servidor usa el mod Cobblemon, una experiencia Pokémon en Minecraft.
                        </p>
                        <ul className="text-gray-400 text-sm space-y-2.5">
                            <li className="flex items-center gap-3">
                                <i className="fas fa-check text-green-400 text-sm"></i>
                                <span>Captura Pokémon</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <i className="fas fa-check text-green-400 text-sm"></i>
                                <span>Batallas PvP y PvE</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <i className="fas fa-check text-green-400 text-sm"></i>
                                <span>Evoluciones y crianza</span>
                            </li>
                        </ul>
                    </div>

                    {/* Community */}
                    <div className="group bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 lg:p-7 border border-gray-700/50 hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/20 md:col-span-2 lg:col-span-1">
                        <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                            <i className="fab fa-discord text-blue-400 text-2xl"></i>
                        </div>
                        <h3 className="text-white font-bold text-xl mb-3">Comunidad</h3>
                        <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                            Únete a nuestro Discord para estar al día con las novedades y conocer a otros jugadores.
                        </p>
                        <a
                            href="#"
                            className="inline-flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:shadow-lg hover:shadow-blue-500/30"
                        >
                            <i className="fab fa-discord text-lg"></i>
                            Unirse al Discord
                        </a>
                    </div>
                </div>

                {/* Rules */}
                <div className="mt-12 bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-gray-700/50">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                            <i className="fas fa-scroll text-yellow-400 text-xl"></i>
                        </div>
                        <h3 className="text-white font-bold text-2xl">
                            Reglas del Servidor
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { icon: 'fa-handshake', text: 'Respeta a todos los jugadores', color: 'text-blue-400' },
                            { icon: 'fa-ban', text: 'No hacks, cheats o exploits', color: 'text-red-400' },
                            { icon: 'fa-comments', text: 'Sin spam ni publicidad', color: 'text-purple-400' },
                            { icon: 'fa-home', text: 'No griefing ni robo', color: 'text-orange-400' },
                            { icon: 'fa-gamepad', text: 'Juega limpio en batallas', color: 'text-green-400' },
                            { icon: 'fa-users', text: 'Ayuda a los nuevos jugadores', color: 'text-pink-400' },
                        ].map((rule, i) => (
                            <div key={i} className="group flex items-center gap-4 bg-gray-700/30 hover:bg-gray-700/50 px-5 py-4 rounded-xl transition-all hover:scale-[1.02]">
                                <div className="w-10 h-10 rounded-lg bg-gray-800/50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <i className={`fas ${rule.icon} ${rule.color} text-lg`}></i>
                                </div>
                                <span className="text-gray-300 text-sm font-medium">{rule.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
