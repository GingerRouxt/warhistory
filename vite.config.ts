import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), cesium(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/cesium')) return 'cesium'
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'vendors'
        },
      },
    },
  },
})
