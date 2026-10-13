import { defineConfig } from 'vite'

/**
 * Builds the host-page widget loader into `public/widget.js` so it is served
 * as a static asset from the widget's own origin. Kept out of the app build:
 * the loader is a standalone IIFE with no framework and no CSS.
 */
export default defineConfig({
  build: {
    lib: {
      entry: 'src/widget-loader/loader.ts',
      formats: ['iife'],
      name: 'SapAiWidgetLoader',
      fileName: () => 'widget.js',
    },
    outDir: 'public',
    emptyOutDir: false,
    target: 'es2019',
    minify: true,
  },
})
