/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                luxury: '#1A1A1A',
                gold: '#D4AF37',
                emerald: '#10B981',
            },
            animation: {
                'fly-to-cart': 'fly 0.6s ease-out forwards',
            },
        },
    },
    plugins: [],
    darkMode: 'class',
};