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
        { src: 'generator/icons/*', dest: 'icons' },
        { src: 'generator/fonts/game-icons.woff', dest: 'fonts' },
        { src: 'generator/fonts/game-icons.ttf', dest: 'fonts' },
        { src: 'generator/fonts/game-icons.eot', dest: 'fonts' },
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
