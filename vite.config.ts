import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages se sirve bajo /cambiodeturnos/
export default defineConfig({
  plugins: [react()],
  base: '/cambiodeturnos/',
})
