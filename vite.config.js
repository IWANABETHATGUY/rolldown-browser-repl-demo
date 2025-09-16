import { defineConfig } from 'vite'


const crossOriginHeaders = {
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
}

export default defineConfig({
  define: {
    'global': 'globalThis'
  },
  resolve: {
    alias: {
      path: 'pathe',
      buffer: "rollup-plugin-node-polyfills/polyfills/buffer-es6",
      events: "eventemitter3",
    },
  },
  build: {
    target: 'esnext',
    rolldownOptions: {
      output: {
        minify: false
      },
      inject: {
        Buffer: ['rollup-plugin-node-polyfills/polyfills/buffer-es6', 'Buffer'],
      }
    }
  },
  plugins: [
  ],
  server: {
    headers: crossOriginHeaders,
  },
})
