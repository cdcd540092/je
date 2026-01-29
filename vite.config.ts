import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // CRITICAL: Set base to './' so assets are loaded relatively on GitHub Pages. 
  base: './',
  plugins: [react()],
  server: {
    host: true
  }
});