import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

function robolabCompilerPlugin() {
  return {
    name: 'robolab-cloud-compiler',
    configureServer(server: any) {
      try {
        const resolved = require.resolve('./server/compile-server.cjs')
        delete require.cache[resolved]
        const compilerServer = require('./server/compile-server.cjs')
        server.middlewares.use((req: any, res: any, next: any) => {
          if (!req.url || !req.url.startsWith('/api/')) {
            return next()
          }
          const freshResolved = require.resolve('./server/compile-server.cjs')
          if (!(globalThis as any).__robolabActiveCompilePromise) {
            delete require.cache[freshResolved]
          }
          const freshServer = require('./server/compile-server.cjs')
          return freshServer.createApiMiddleware()(req, res, next)
        })
        compilerServer.startCompileServer(3001)
      } catch (err) {
        console.warn('[RoboLab Compiler Plugin] Failed to initialize:', err)
      }
    },
    configurePreviewServer(server: any) {
      try {
        const resolved = require.resolve('./server/compile-server.cjs')
        delete require.cache[resolved]
        const compilerServer = require('./server/compile-server.cjs')
        server.middlewares.use(compilerServer.createApiMiddleware())
        compilerServer.startCompileServer(3001)
      } catch (err) {
        console.warn('[RoboLab Compiler Plugin] Failed to initialize in preview:', err)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    robolabCompilerPlugin(),
    react(),
    // @ts-ignore
    tailwindcss(),
  ],
  base: './', // Relative paths for Electron
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react', 'framer-motion', 'blockly', 'monaco-editor'],
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
