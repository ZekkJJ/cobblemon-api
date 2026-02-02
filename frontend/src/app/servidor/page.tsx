'use client';

import ServerStatus from '@/components/ServerStatus';

export default function ServidorPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-[url('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png')] bg-repeat opacity-5"></div>

        <div className="relative container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 pixel-font drop-shadow-lg">
            <i className="fas fa-server mr-4"></i>
            SERVER
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Minecraft server information and status
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Server Status */}
        <div className="mb-16">
          <ServerStatus />
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Cómo Conectar */}
          <div className="card group hover:border-emerald-500/50 transition-all hover:shadow-xl hover:shadow-emerald-500/20">
            <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <i className="fas fa-plug text-emerald-400 text-2xl"></i>
            </div>
            <h3 className="text-white font-bold text-xl mb-4">How to Connect</h3>
            <ol className="text-slate-400 text-sm space-y-3">
              <li className="flex items-start gap-3">
                <span className="bg-emerald-500/20 text-emerald-400 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                <span>Open Minecraft Java Edition</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-emerald-500/20 text-emerald-400 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                <span>Go to Multiplayer → Add server</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-emerald-500/20 text-emerald-400 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                <span>Enter the server IP</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-emerald-500/20 text-emerald-400 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                <span>Join and enjoy!</span>
              </li>
            </ol>
          </div>

          {/* Modpack */}
          <div className="card group hover:border-purple-500/50 transition-all hover:shadow-xl hover:shadow-purple-500/20">
            <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <i className="fas fa-cube text-purple-400 text-2xl"></i>
            </div>
            <h3 className="text-white font-bold text-xl mb-3">Cobblemon</h3>
            <p className="text-slate-400 text-sm mb-5 leading-relaxed">
              Our server uses the Cobblemon mod, a Pokémon experience in Minecraft.
            </p>
            <ul className="text-slate-400 text-sm space-y-2.5">
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-400 text-sm"></i>
                <span>Catch Pokémon</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-400 text-sm"></i>
                <span>PvP and PvE Battles</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-400 text-sm"></i>
                <span>Evolutions and breeding</span>
              </li>
            </ul>
          </div>

          {/* Comunidad */}
          <div className="card group hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/20 md:col-span-2 lg:col-span-1">
            <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <i className="fab fa-discord text-blue-400 text-2xl"></i>
            </div>
            <h3 className="text-white font-bold text-xl mb-3">Community</h3>
            <p className="text-slate-400 text-sm mb-5 leading-relaxed">
              Join our Discord to stay up to date with news and meet other players.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:shadow-lg hover:shadow-blue-500/30"
            >
              <i className="fab fa-discord text-lg"></i>
              Join Discord
            </a>
          </div>
        </div>

        {/* Reglas del Servidor */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <i className="fas fa-scroll text-yellow-400 text-xl"></i>
            </div>
            <h3 className="text-white font-bold text-2xl">
              Server Rules
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: 'fa-handshake', text: 'Respect all players', color: 'text-blue-400' },
              { icon: 'fa-ban', text: 'No hacks, cheats or exploits', color: 'text-red-400' },
              { icon: 'fa-comments', text: 'No spam or advertising', color: 'text-purple-400' },
              { icon: 'fa-home', text: 'No griefing or stealing', color: 'text-orange-400' },
              { icon: 'fa-gamepad', text: 'Play fair in battles', color: 'text-green-400' },
              { icon: 'fa-users', text: 'Help new players', color: 'text-pink-400' },
            ].map((rule, i) => (
              <div key={i} className="group flex items-center gap-4 bg-slate-700/30 hover:bg-slate-700/50 px-5 py-4 rounded-xl transition-all hover:scale-[1.02]">
                <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <i className={`fas ${rule.icon} ${rule.color} text-lg`}></i>
                </div>
                <span className="text-slate-300 text-sm font-medium">{rule.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
