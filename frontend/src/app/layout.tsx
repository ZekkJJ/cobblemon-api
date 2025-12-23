import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/src/components/Navbar';
import Providers from '@/src/components/Providers';
import AnimatedBackground from '@/src/components/AnimatedBackground';
import MusicPlayer from '@/src/components/MusicPlayer';

export const metadata: Metadata = {
  title: 'Cobblemon Los Pitufos',
  description: 'Servidor de Cobblemon - Obtén tu Pokémon inicial',
  icons: {
    icon: '/icon.png',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body>
        <Providers>
          <AnimatedBackground />
          <Navbar />
          <main className="min-h-screen relative z-10 pt-20">
            {children}
          </main>
          <MusicPlayer />
        </Providers>
      </body>
    </html>
  );
}
