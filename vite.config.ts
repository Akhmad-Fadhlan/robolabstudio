import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // @ts-ignore
    tailwindcss(),
  ],
  base: './', // Relative paths for Electron
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react', 'framer-motion', 'blockly'],
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    minify: true,
    sourcemap: false,
    cssMinify: true
  }
})
