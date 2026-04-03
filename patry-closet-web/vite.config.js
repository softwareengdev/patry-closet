import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        host: true,
        port: 3000,
        allowedHosts: ['patry-closet'],
    },
    preview: {
        host: true,
        port: 4173,
    },
    resolve: {
        dedupe: [
            'react',
            'react-dom',
            'react-dom/client',
            'react/jsx-runtime',
            'react/jsx-dev-runtime',
            'react-router-dom',
        ],
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-dom/client',
            'react/jsx-runtime',
            'react/jsx-dev-runtime',
            'react-helmet-async',
            '@tanstack/react-query',
            'react-router-dom',
            'framer-motion',
        ],
    },
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['vite.svg'],
            manifest: {
                name: 'PATRY CLOSET — Fashion Store',
                short_name: 'Patry Closet',
                description: 'Tienda de moda online con colecciones exclusivas',
                theme_color: '#1A1A1A',
                background_color: '#ffffff',
                display: 'standalone',
                orientation: 'portrait-primary',
                scope: '/',
                start_url: '/',
                categories: ['shopping', 'fashion', 'lifestyle'],
                icons: [
                    {
                        src: '/pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: '/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'gstatic-fonts-cache',
                            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'unsplash-images-cache',
                            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                ],
            },
        }),
    ],
    css: {
        postcss: {
            plugins: [
                require('tailwindcss'),
                require('autoprefixer'),
            ],
        },
    },
});