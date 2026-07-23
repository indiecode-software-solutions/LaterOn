import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { rm } from 'fs/promises'
import { resolve } from 'path'

// Post-build plugin: removes large binaries from dist/ so they don't get
// bundled into the Android APK via `cap sync android`. The files still live
// in public/ and are served normally during the dev server.
const stripLargeAssetsFromDist = () => ({
  name: 'strip-large-assets-from-dist',
  apply: 'build',
  async closeBundle() {
    const filesToStrip = ['LaterOn.apk']
    for (const file of filesToStrip) {
      const target = resolve(__dirname, 'dist', file)
      try {
        await rm(target, { force: true })
        console.log(`[strip-large-assets] Removed ${file} from dist/`)
      } catch {
        // file may not exist — that's fine
      }
    }
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), stripLargeAssetsFromDist()],
  envDir: '../',
})
