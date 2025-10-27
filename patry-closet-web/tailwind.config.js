/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#FF6B6B", // Rosa vibrante para botones/llamadas a acción
                secondary: "#4ECDC4", // Turquesa para acentos
                accent: "#FFE66D", // Amarillo suave para highlights
                neutral: "#F7F7F7", // Fondo claro para secciones
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'], // Moderna para texto general
                display: ['Playfair Display', 'serif'], // Elegante para títulos de moda
            },
            spacing: {
                '128': '32rem', // Espacios grandes para grids de productos
            },
            animation: {
                fadeIn: 'fadeIn 1s ease-in-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
        },
    },
    plugins: [],
};