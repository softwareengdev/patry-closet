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
                luxury: '#1A1A1A',
                gold: '#D4AF37',
                emerald: '#10B981',
            },
            animation: {
                'fly-to-cart': 'fly 0.6s ease-out forwards',
                'fade-up': 'fadeUp 0.8s ease-out forwards',
                'fade-in': 'fadeIn 1.2s ease-out forwards',
                'slide-in-right': 'slideInRight 0.6s ease-out forwards',
                'ken-burns': 'kenBurns 20s ease-in-out infinite alternate',
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
            },
            letterSpacing: {
                'ultra-wide': '0.25em',
                'mega-wide': '0.4em',
            },
        },
    },
    plugins: [],
    darkMode: 'class',
};