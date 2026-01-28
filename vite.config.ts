import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    // CRITICAL: Set base to './' so assets are loaded relatively. 
    // This fixes the 404 errors when deployed to GitHub Pages subdirectories.
    base: './',
    plugins: [react()],
    define: {
      // Polyfill process.env for the existing code
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Prevent crash if other process.env props are accessed
      'process.env': {}
    },
    server: {
      host: true
    }
  };
});