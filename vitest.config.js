import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Separate from vite.config.js on purpose — the @tailwindcss/vite plugin
// does CSS transforms that are irrelevant overhead under jsdom.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    globals: true,
    // Capped. Uncapped, Vitest starts a worker per core: about fifteen on the
    // 16-core, 5.8 GB laptop this is pushed from, each with its own jsdom.
    // With other apps open that ran the machine out of memory on 2026-10-05,
    // and the workers died with "heap out of memory" at 70 MB each. That is a
    // pre-push gate failing for a reason unrelated to the code, and a gate
    // that fails at random gets bypassed. Four keeps it reliable there and
    // costs nothing on CI, whose runner has fewer cores than that anyway.
    maxWorkers: 4,
  },
})
