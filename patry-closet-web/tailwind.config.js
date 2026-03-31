/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                serif: ['Playfair Display', 'Georgia', 'serif'],
            },
            colors: {
                /* Fashion neutrals */
                luxury: '#1A1A1A',
                ivory: '#FDFBF7',
                sand: '#E8E0D5',
                stone: '#9C9489',
                charcoal: '#2D2D2D',
                /* Accent palette */
                gold: '#D4AF37',
                rose: '#C9A0A0',
                blush: '#E8C4C4',
                sage: '#A3B18A',
                burgundy: '#800020',
                navy: '#1B2A4A',
                /* Brand accent */
                accent: {
                    DEFAULT: '#1A1A1A',
                    50: '#F7F7F7',
                    100: '#E3E3E3',
                    200: '#C8C8C8',
                    300: '#A4A4A4',
                    400: '#818181',
                    500: '#666666',
                    600: '#515151',
                    700: '#434343',
                    800: '#383838',
                    900: '#1A1A1A',
                    950: '#0D0D0D',
                },
                /* High-contrast overrides (used via .high-contrast) */
                hc: {
                    bg: '#000000',
                    fg: '#FFFFFF',
                    border: '#FFFF00',
                    link: '#00FFFF',
                    accent: '#FFD700',
                    error: '#FF6B6B',
                    success: '#00FF7F',
                },
            },
            animation: {
                'fly-to-cart': 'fly 0.6s ease-out forwards',
                'fade-up': 'fadeUp 0.8s ease-out forwards',
                'fade-in': 'fadeIn 1.2s ease-out forwards',
                'slide-in-right': 'slideInRight 0.6s ease-out forwards',
                'ken-burns': 'kenBurns 20s ease-in-out infinite alternate',
                'micro-bounce': 'microBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                'scale-in': 'scaleIn 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
            },
            keyframes: {
                fadeUp: {
                    '0%': { opacity: '0', transform: 'translateY(30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(30px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                kenBurns: {
                    '0%': { transform: 'scale(1)' },
                    '100%': { transform: 'scale(1.08)' },
                },
                microBounce: {
                    '0%': { transform: 'scale(1)' },
                    '40%': { transform: 'scale(0.95)' },
                    '100%': { transform: 'scale(1)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
            },
            letterSpacing: {
                'ultra-wide': '0.25em',
                'mega-wide': '0.4em',
            },
            transitionTimingFunction: {
                'fashion': 'cubic-bezier(0.22, 1, 0.36, 1)',
            },
        },
    },
    plugins: [],
    darkMode: 'class',
};