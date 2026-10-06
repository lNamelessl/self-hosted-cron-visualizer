import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // No source maps in production: keeps the shipped bundle small and inspectable-free.
    sourcemap: false,
    target: 'es2022',
  },
});
