import { defineConfig, type Plugin } from 'vite'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
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

function verifyProductionAssets(): Plugin {
  return {
    name: 'robolab-verify-production-assets',
    apply: 'build',
    enforce: 'post',
    writeBundle({ dir }) {
      if (!dir) return

      const unexpected = readdirSync(dir, { recursive: true, withFileTypes: true })
        .filter(entry => entry.isFile())
        .filter(entry => {
          if (/\.(?:map|tsx?|jsx)$/i.test(entry.name) || /^\.env(?:\.|$)/i.test(entry.name)) return true
          if (!/\.(?:[cm]?js|css)$/i.test(entry.name)) return false

          const content = readFileSync(join(entry.parentPath, entry.name), 'utf8')
          return /(?:\n\s*\/\/[#@]\s*sourceMappingURL=|\/\*[#@]\s*sourceMappingURL=)[^\n]+\s*$/.test(content)
        })
        .map(entry => join(entry.parentPath, entry.name))

      if (unexpected.length) {
        this.error(`Build contains source files, environment files, or sourcemaps:\n${unexpected.join('\n')}`)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    robolabCompilerPlugin(),
    verifyProductionAssets(),
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
