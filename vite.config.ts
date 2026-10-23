import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages project repos use /repository/; user/organization pages use /.
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = process.env.VITE_BASE_PATH || (repo && !repo.endsWith('.github.io') ? `/${repo}/` : '/')
export default defineConfig({
  base,
  plugins: [vue(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg'],
    manifest: {name: 'PapoLab • Laboratório de Conversas', short_name: 'PapoLab', description: 'Descubra a história por trás das suas conversas, sem enviar dados para servidores.', theme_color: '#101328', background_color: '#101328', display: 'standalone', start_url: base, scope: base, icons: [{src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any'}]},
    workbox: {navigateFallback: `${base}index.html`, globPatterns: ['**/*.{js,css,html,svg,png,woff2}'], maximumFileSizeToCacheInBytes: 4500000}
  })],
  test: {environment: 'node', include: ['tests/**/*.test.ts']}
})
