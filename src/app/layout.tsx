import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { Providers } from '@/components/Providers';
import MusicPlayer from '@/components/MusicPlayer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Cobblemon Los Pitufos - Starter Gacha',
    description: 'Get your unique starter for the Cobblemon server. Only one roll per player!',
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
        <html lang="en">
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

