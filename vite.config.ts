import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    // CRITICAL: Set base to './' so assets are loaded relatively. 
    base: './',
    plugins: [react()],
    define: {
      // Prevent crash if process.env props are accessed
      'process.env': {}
    },
    server: {
      host: true
    }
  };
});