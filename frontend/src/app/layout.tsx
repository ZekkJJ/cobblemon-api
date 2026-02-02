import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Providers from '@/components/Providers';
import AnimatedBackground from '@/components/AnimatedBackground';
import MusicPlayer from '@/components/MusicPlayer';
import AnnouncementTicker from '@/components/AnnouncementTicker';

export const metadata: Metadata = {
  title: 'Cobblemon Los Pitufos',
  description: 'Cobblemon Server - Get your starter Pokémon',
  icons: {
    icon: '/server-icon.png',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body>
        <Providers>
          <AnimatedBackground />
          <Navbar />
          <AnnouncementTicker />
          <main className="min-h-screen relative z-10 pt-20">
            {children}
          </main>
          <MusicPlayer />
        </Providers>
      </body>
    </html>
  );
}
