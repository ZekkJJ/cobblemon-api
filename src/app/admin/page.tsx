import { db } from "@/lib/vercel-kv-db";

export default async function AdminDashboard() {
    const users = await db.users.find({});
    // Mock tournaments for now or fetch from DB if exists
    const tournaments = [];

    const totalPlayers = users.length;
    const verifiedPlayers = users.filter((u: any) => u.verified).length;
    const onlinePlayers = users.filter((u: any) => u.minecraftOnline).length;

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold">Resumen</h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Jugadores Totales"
                    value={totalPlayers}
                    icon="👥"
                    color="bg-blue-500/10 border-blue-500/20 text-blue-400"
                />
                <StatCard
                    title="Verificados"
                    value={verifiedPlayers}
                    icon="✅"
                    color="bg-green-500/10 border-green-500/20 text-green-400"
                />
                <StatCard
                    title="Online Ahora"
                    value={onlinePlayers}
                    icon="🟢"
                    color="bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
                    <h3 className="text-xl font-semibold mb-4">Gestión Rápida</h3>
                    <div className="space-y-4">
                        <p className="text-slate-400">Selecciona una categoría del menú lateral para comenzar a gestionar el servidor.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: any) {
    return (
        <div className={`p-6 rounded-xl border ${color}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium opacity-80">{title}</h3>
                <span className="text-2xl">{icon}</span>
            </div>
            <p className="text-4xl font-bold">{value}</p>
        </div>
    );
}
