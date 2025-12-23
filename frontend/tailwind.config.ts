import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Pokémon colors
        'poke-red': {
          DEFAULT: '#EF4444',
          dark: '#991B1B',
        },
        'poke-blue': '#3B82F6',
        'poke-yellow': '#EAB308',
        'poke-purple': '#A855F7',
        'poke-green': '#10B981',
        // Type colors
        'type-grass': '#78C850',
        'type-fire': '#F08030',
        'type-water': '#6890F0',
        'type-electric': '#F8D030',
        'type-psychic': '#F85888',
        'type-normal': '#A8A878',
        'type-fighting': '#C03028',
        'type-flying': '#A890F0',
        'type-poison': '#A040A0',
        'type-ground': '#E0C068',
        'type-rock': '#B8A038',
        'type-bug': '#A8B820',
        'type-ghost': '#705898',
        'type-steel': '#B8B8D0',
        'type-dragon': '#7038F8',
        'type-dark': '#705848',
        'type-fairy': '#EE99AC',
        'type-ice': '#98D8D8',
      },
      animation: {
        'shake': 'shake 0.5s infinite',
        'flash': 'flash 0.5s ease-in-out',
        'shimmer': 'shimmer 2s infinite',
        'fadeIn': 'fadeIn 0.3s ease-in',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px) rotate(-5deg)' },
          '75%': { transform: 'translateX(5px) rotate(5deg)' },
        },
        flash: {
          '0%, 100%': { opacity: '0' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
