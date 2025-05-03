import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    outDir: 'web',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './web/index.html'
      }
    }
  },
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ]
})