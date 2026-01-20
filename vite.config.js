import { defineConfig } from 'vite';

export default defineConfig({
    base: './', // Ensures relative paths work in production
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        minify: 'terser',
        sourcemap: true // Helpful for debugging
    },
    server: {
        port: 3000,
        open: true // Auto-open browser
    }
});
