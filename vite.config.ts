/// <reference types="vitest/config" />
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: '/rpg-cards/',
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        // Icon SVGs are a build artifact (downloaded from game-icons.net via
        // `pnpm build:icons`), not committed. The card engine references them
        // as static files under <base>/icons/.
        // stripBase flattens the copies: v4 otherwise preserves the source
        // directory structure under dest.
        { src: 'generator/icons/*', dest: 'icons', rename: { stripBase: true } },
        { src: 'generator/fonts/game-icons.woff', dest: 'fonts', rename: { stripBase: true } },
        { src: 'generator/fonts/game-icons.ttf', dest: 'fonts', rename: { stripBase: true } },
        { src: 'generator/fonts/game-icons.eot', dest: 'fonts', rename: { stripBase: true } },
      ],
    }),
  ],
  resolve: {
    alias: { '@': new URL('./src', import.meta.url).pathname },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
