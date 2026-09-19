import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  root: path.join(import.meta.dirname, 'client'),
  build: {
    outDir: path.join(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    assetsDir: 'app',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4173'
    }
  }
});