import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { Providers } from '@/components/Providers';
import MusicPlayer from '@/components/MusicPlayer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Cobblemon Los Pitufos - Gacha de Starters',
    description: 'Obtén tu starter único para el servidor Cobblemon. ¡Solo una tirada por jugador!',
    icons: {
        icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es">
            <head>
                <link
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
                    rel="stylesheet"
                />
            </head>
            <body className={`${inter.className} text-gray-100 min-h-screen`}>
                <Providers>
                    <Navbar />
                    <main className="pb-10">{children}</main>
                    <MusicPlayer />
                </Providers>
            </body>
        </html>
    );
}

