# rpg-cards

RPG spell/item/monster card generator — make print-ready card sheets for D&D 5e, Pathfinder 2e, Savage Worlds, Shadowrun 6e and any other tabletop game.

Live app: <https://mephitrpg.github.io/rpg-cards/>

## Stack

React 19 (with React Compiler) · TypeScript (strict) · Vite · Tailwind CSS v4 · shadcn/ui · Zustand · Biome · Vitest · Playwright.

The card-generation engine is a **pure TypeScript port of the original engine** (`src/engine/`): it still produces the same HTML, byte-for-byte, proven by golden-master fixtures captured from the legacy implementation (`tests/golden/`). Deck JSON files and browser-stored decks from every historical version keep loading unchanged.

## Architecture

```
src/
├── engine/            # pure TS card engine (no React, no DOM)
│   ├── directives.ts  #   ~35 content-line directives (text, dndstats, p2e_*, ...)
│   ├── card.ts        #   front/back card HTML generation
│   ├── pages.ts       #   page layout: doublesided / front_only / side-by-side
│   ├── icons/         #   generated icon manifest (pnpm gen:icons)
│   └── __tests__/     #   golden-master parity tests
├── app/
│   ├── store/         # Zustand deck store (cards, options, settings)
│   ├── persistence/   # legacy-compatible localStorage + deck file I/O
│   ├── render/        # DOMPurify boundary + EngineContext (icon URLs, measurement)
│   ├── components/    # editor UI (deck panel, card editor, pickers, settings)
│   └── routes/        # Editor (/) and PrintPreview (#/print)
└── styles/            # Tailwind app theme + legacy card CSS (generated copies)
```

Host-environment concerns are injected into the engine through `EngineContext` (icon URL resolution and one DOM measurement), which keeps the engine testable in plain Node.

## Development

Requires [Node.js](https://nodejs.org/) ≥ 22 (pnpm is provided via corepack).

```sh
corepack enable pnpm
pnpm install
pnpm build:icons   # one-time: download the icon set from game-icons.net
pnpm gen:icons     # regenerate the icon manifest + generated CSS
pnpm dev           # editor at http://localhost:5173/rpg-cards/
```

Common tasks:

| Command | What it does |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm preview` | Vite dev server / production build / serve the build |
| `pnpm test` | unit tests incl. golden-master engine parity |
| `pnpm test:e2e` | Playwright end-to-end tests |
| `pnpm test:visual` | print-output pixel parity tests |
| `pnpm lint` / `pnpm format` / `pnpm typecheck` | Biome lint / format / tsc |
| `pnpm build:icons` | refresh the icon set (game-icons.net + `resources/custom-icons`) |
| `pnpm gen:icons` | regenerate `manifest.gen.ts` + `src/styles/generated/` |

The icon SVGs (~18 MB) are a build artifact and are **not** committed; CI downloads and caches them.

## Printing

Click **Generate** to open the print preview, then print from the browser (enable *background graphics* in the print dialog). Page size, card size, rows/columns, double-sided arrangement, bleed and crop marks are configured in the Page settings panel.

## FAQ

- **What browsers are supported?** Modern Chromium browsers give the most accurate prints (`@page` size support); Firefox and Safari work for editing.
- **Cards print without colors/icons?** Enable printing background images in the browser print dialog.
- **Cards overflow the page?** Check page size, card size and rows/columns — 4×4 poker cards don't fit on A4.

## License

This generator is provided under the terms of the MIT License.

Icons are made by various artists, available at [game-icons.net](https://game-icons.net), provided under the terms of the Creative Commons 3.0 BY license.
