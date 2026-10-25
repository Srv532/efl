import { defineConfig } from 'vite';

export default defineConfig({
    base: './', // Ensures relative paths work in production
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        minify: 'esbuild',
        chunkSizeWarningLimit: 6000,
        sourcemap: false
    },
    server: {
        port: 3000,
        open: false
    }
});
