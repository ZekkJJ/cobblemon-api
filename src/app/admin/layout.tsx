import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth"; // Assuming authOptions is exported from here
import Link from "next/link";

const ADMIN_IDS = ["478742167557505034", "687753572095623190"];

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any)?.discordId) {
        redirect("/");
    }

    if (!ADMIN_IDS.includes((session.user as any).discordId)) {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-10">
                    Admin Panel
                </h1>

                <nav className="flex-1 space-y-2">
                    <NavLink href="/admin">Dashboard</NavLink>
                    <NavLink href="/admin/players">Jugadores</NavLink>
                    <NavLink href="/admin/level-caps">Level Caps</NavLink>
                    <NavLink href="/admin/tournaments">Torneos</NavLink>
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-800">
                    <p className="text-xs text-slate-500">
                        Logueado como: <br />
                        <span className="text-slate-300">{session.user.name}</span>
                    </p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="block px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
            {children}
        </Link>
    );
}
