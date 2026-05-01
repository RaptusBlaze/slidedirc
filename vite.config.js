import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// VITE_BASE_URL controls the base path of the app.
// Set it to '/<repo-name>/' for GitHub Pages (e.g. '/slidedirc/').
// Leave it unset (or set to '/') for local dev and Docker self-hosting.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE_URL ?? '/',
})
