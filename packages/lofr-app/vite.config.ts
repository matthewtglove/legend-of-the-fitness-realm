import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            // add this to cache all the imports
            workbox: {
                globPatterns: ['**/*'],
            },
            // cache all the static assets in the public folder
            includeAssets: ['**/*'],
            manifest: {
                theme_color: '#3c2522',
                background_color: '#3c2522',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                short_name: 'LOFR',
                name: 'Legend of the Fitness Realm',
                description: 'Fitness Game App',
                icons: [
                    {
                        src: '/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/icon-256.png',
                        sizes: '256x256',
                        type: 'image/png',
                    },
                    {
                        src: '/icon-384.png',
                        sizes: '384x384',
                        type: 'image/png',
                    },
                    {
                        src: '/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                ],
            },
        }),
    ],
});
