'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * Componente de fondo animado con Pokémon flotantes
 * Las bolitas del CSS pulsan SUTILMENTE con el ritmo de la música
 * (sin canvas, solo modificando la opacidad del radial-gradient del body)
 */
export default function AnimatedBackground() {
  const [mounted, setMounted] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);

    // Base opacity values for the dots
    const BASE_OPACITY_1 = 0.12; // Main dots
    const BASE_OPACITY_2 = 0.06; // Secondary dots
    const MAX_BOOST = 0.06; // Maximum opacity boost on bass (very subtle)

    let smoothedBass = 0;

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      
      const win = window as any;
      const audioData = win.__audioData || { audioLevel: 0, bassLevel: 0, isPlaying: false };
      
      // If not playing, reset to default
      if (!audioData.isPlaying) {
        smoothedBass = 0;
        document.body.style.backgroundImage = `
          radial-gradient(circle at 50% 50%, rgba(255, 255, 255, ${BASE_OPACITY_1}) 1.5px, transparent 1.5px),
          radial-gradient(circle at 0% 0%, rgba(255, 255, 255, ${BASE_OPACITY_2}) 1px, transparent 1px)
        `;
        return;
      }

      const bass = audioData.bassLevel || 0;
      
      // Smooth the bass value to avoid jittery animation
      smoothedBass = smoothedBass * 0.85 + bass * 0.15;
      
      // Calculate subtle opacity boost based on bass
      const boost = smoothedBass * MAX_BOOST;
      const opacity1 = BASE_OPACITY_1 + boost;
      const opacity2 = BASE_OPACITY_2 + boost * 0.5;

      // Update body background with pulsing opacity
      document.body.style.backgroundImage = `
        radial-gradient(circle at 50% 50%, rgba(255, 255, 255, ${opacity1.toFixed(3)}) 1.5px, transparent 1.5px),
        radial-gradient(circle at 0% 0%, rgba(255, 255, 255, ${opacity2.toFixed(3)}) 1px, transparent 1px)
      `;
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // Reset to default on unmount
      document.body.style.backgroundImage = `
        radial-gradient(circle at 50% 50%, rgba(255, 255, 255, ${BASE_OPACITY_1}) 1.5px, transparent 1.5px),
        radial-gradient(circle at 0% 0%, rgba(255, 255, 255, ${BASE_OPACITY_2}) 1px, transparent 1px)
      `;
    };
  }, []);

  if (!mounted) return null;

  const floatingPokemon = [
    { id: 25, name: 'Pikachu' },
    { id: 1, name: 'Bulbasaur' },
    { id: 4, name: 'Charmander' },
    { id: 7, name: 'Squirtle' },
    { id: 133, name: 'Eevee' },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {floatingPokemon.map((pokemon, index) => (
        <div
          key={pokemon.id}
          className="pokemon-float absolute"
          style={{
            top: `${20 + index * 15}%`,
            left: '-100px',
            width: '120px',
            height: '120px',
          }}
        >
          <img
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`}
            alt={pokemon.name}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}
