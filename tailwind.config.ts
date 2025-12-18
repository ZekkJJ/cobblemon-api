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
                'type-grass': '#78C850',
                'type-fire': '#F08030',
                'type-water': '#6890F0',
                'type-electric': '#F8D030',
                'type-psychic': '#F85888',
                'type-ice': '#98D8D8',
                'type-dragon': '#7038F8',
                'type-dark': '#705848',
                'type-fairy': '#EE99AC',
                'type-normal': '#A8A878',
                'type-fighting': '#C03028',
                'type-flying': '#A890F0',
                'type-poison': '#A040A0',
                'type-ground': '#E0C068',
                'type-rock': '#B8A038',
                'type-bug': '#A8B820',
                'type-ghost': '#705898',
                'type-steel': '#B8B8D0',
            },
            fontFamily: {
                'pixel': ['"Press Start 2P"', 'cursive'],
                'roboto': ['Roboto', 'sans-serif'],
            },
            animation: {
                'shake': 'shake 1.25s cubic-bezier(.36,.07,.19,.97) 3',
                'pop-in': 'popIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                'shine': 'shine 4s infinite',
                'pulse-slow': 'pulse 3s infinite',
                'sparkle': 'sparkleAnim 1s linear infinite',
                'scroll-bg': 'scrollBg 20s linear infinite',
                'float': 'float 3s ease-in-out infinite',
            },
            keyframes: {
                shake: {
                    '0%': { transform: 'translate(0, 0) rotate(0)' },
                    '20%': { transform: 'translate(-10px, 0) rotate(-20deg)' },
                    '30%': { transform: 'translate(10px, 0) rotate(20deg)' },
                    '50%': { transform: 'translate(-10px, 0) rotate(-10deg)' },
                    '60%': { transform: 'translate(10px, 0) rotate(10deg)' },
                    '100%': { transform: 'translate(0, 0) rotate(0)' },
                },
                popIn: {
                    '0%': { transform: 'scale(0) rotate(-10deg)', opacity: '0' },
                    '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
                },
                shine: {
                    '0%': { transform: 'translateX(-150%) rotate(30deg)' },
                    '20%': { transform: 'translateX(150%) rotate(30deg)' },
                    '100%': { transform: 'translateX(150%) rotate(30deg)' },
                },
                sparkleAnim: {
                    '0%': { transform: 'scale(0) rotate(0deg)', opacity: '1' },
                    '100%': { transform: 'scale(1.5) rotate(180deg)', opacity: '0' },
                },
                scrollBg: {
                    '0%': { backgroundPosition: '0 0' },
                    '100%': { backgroundPosition: '40px 40px' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
            },
            backgroundImage: {
                'pokeball-pattern': "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 1px, transparent 1px), radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
            },
        },
    },
    plugins: [],
};

export default config;
