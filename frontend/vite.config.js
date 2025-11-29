import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // This forces all libraries to use YOUR version of React
    dedupe: ['react', 'react-dom'],
  },
})
