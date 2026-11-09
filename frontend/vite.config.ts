import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    // Cùng origin với API khi dev → cookie httpOnly hoạt động giống production (Nginx /api).
    proxy: { '/api': 'http://localhost:4000' },
  },
});
