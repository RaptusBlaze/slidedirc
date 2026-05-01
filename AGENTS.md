# slidedirc — Knowledge Base

**Generated:** 2026-04-30T23:24Z · **Commit:** 51e3bb0 · **Branch:** main

## OVERVIEW

Browser-only image-pair compare tool. React 19 + Vite 7 + Tailwind v4 (CSS-first), no backend, no router. Drop two folders → fuzzy-match by filename → slider compare. Scale: 14 source files, ~1100 LoC, depth ≤ 2. Tests: Vitest (unit) + Playwright (E2E + visual).

## STRUCTURE

```
.
├── src/
│   ├── App.jsx                  # Layout switch: drop-zones ↔ compare view
│   ├── main.jsx                 # createRoot + StrictMode
│   ├── index.css                # Tailwind directives only
│   ├── hooks/useFileStore.js    # ALL app state (folders, matches, navigation, live-reload polling)
│   ├── utils/matchFiles.js      # 3-tier filename matcher (exact → basename → fuzzy ≥0.6)
│   └── components/              # leaf components, no nesting
├── vite.config.js               # Reads VITE_BASE_URL env (GH Pages vs Docker/local)
├── nginx.conf                   # SPA fallback + immutable cache for hashed assets
├── Dockerfile                   # Multi-stage: node:22-alpine → nginx:alpine
└── .github/workflows/deploy.yml # GH Pages: builds with VITE_BASE_URL=/slidedirc/
```

## WHERE TO LOOK

| Concern | File:Line |
|---|---|
| App state (single source) | `src/hooks/useFileStore.js` |
| Pair-matching algorithm | `src/utils/matchFiles.js:7-35` |
| File ingestion (drop) | `src/components/DropZone.jsx:5-18` |
| File ingestion (live-reload poll) | `src/hooks/useFileStore.js:7-22, 122-144` |
| Slider + zoom + pan | `src/components/CompareViewer.jsx` |
| Metadata overlay + diff highlighting | `src/components/InfoOverlay.jsx` |
| Compare action buttons | `src/components/ActionBar.jsx` |
| Keyboard shortcuts (R, ?) | `src/App.jsx:31-45` |
| Keyboard shortcut (Space → pan) | `src/components/CompareViewer.jsx:71-127` |
| Keyboard shortcuts (← →) | `src/components/NavigationRibbon.jsx:7-14` |
| Wheel: scroll=nav, Ctrl+scroll=zoom | `src/App.jsx:48-58` + `CompareViewer.jsx:30-56` |
| Object-URL lifecycle | `src/hooks/useFileStore.js:24-26, 56-76` |
| Axis rotation (4 modes, clockwise) | `App.jsx:25` + `CompareViewer.jsx:19-21,195` |

## DATA FLOW

```
DropZone.onDrop                                     useFileStore.toggleLiveReload (FS Access API)
  → File[] → {name, url:blob, lastModified}[]         → showDirectoryPicker() → dirHandleA/B
  → useFileStore.setFolderA/B(name, files)            → setInterval(getNewFiles, 3000ms)
        ↓                                             → setFolderState({...prev, files:[...prev.files,...new]})
useFileStore useEffect [folderA, folderB]   ←─────────────┘
  → matchFiles(a.files, b.files)
  → setMatches({matched, unmatchedA, unmatchedB})
        ↓
App: currentPair = matches.matched[currentIndex]
  → CompareViewer renders pair.original.url + pair.edited.url via ReactCompareSlider
  → InfoOverlay loads dimensions async via new Image() per side
  → NavigationRibbon thumbnails + arrow-key nav
```

## CONVENTIONS

- **Plain JS + JSX** — no TypeScript despite `@types/react` being installed (IDE hints only).
- **Tailwind inline classes only** — no CSS modules, no styled-components, no `className` constants. `index.css` contains only `@tailwind` directives.
- **Single state hook** — all shared state lives in `useFileStore`. Component-local UI state (`zoom`, `hoverMode`, `showHelp`, etc.) stays in components. Don't introduce Redux/Zustand for current scope.
- **ESLint flat config** — `eslint.config.js` (ESLint 9+), not `.eslintrc`. Run `pnpm lint`.
- **Dark theme only** — `bg-gray-950` / `text-white` baseline. Accents: green-400 (matched), yellow-400 (unmatched), amber-300 (orig diff), emerald-300 (edit diff), gray-600 (separators).
- **File shape**: `{ name: string, url: blob-URL, lastModified: number }` — keep this shape across both ingestion paths.
- **Conventional commits** in git history (`feat(scope): ...`, `fix: ...`, `docs: ...`, `chore: ...`).

## ANTI-PATTERNS (THIS PROJECT)

- **Never replace folder state without revoking blob URLs.** Use `setFolderXState(prev => { revokeFolder(prev); return next; })` (see `useFileStore.js:57,63,69-70`). Skipping this leaks every previously-loaded image's blob.
- **Never drop the `cancelled` flag pattern in async image loads.** `InfoOverlay.jsx:55-75` uses `let cancelled = false; ... return () => { cancelled = true; }` to prevent setState after rapid pair switches. Same pattern required for any future async load (EXIF, thumbnails, etc.).
- **Never use state directly inside the live-reload polling closure.** Use `folderARef`/`folderBRef` (`useFileStore.js:37-41`). Putting `folderA`/`folderB` in the effect deps array re-registers `setInterval` on every file addition → duplicate URLs and runaway intervals.
- **Never remove `key={axisMode}` on `<ReactCompareSlider>`** (`CompareViewer.jsx:195`). It's the remount trigger that resets the slider's internal handle position when orientation changes.
- **Never change `transformOrigin: '0 0'`** on the zoom/pan layer (`CompareViewer.jsx:189-191`). The cursor-relative zoom math in `handleWheel` (`:30-56`) assumes top-left origin.
- **Never add `passive: false` to wheel listeners without a real `preventDefault()`.** Both wheel listeners (`App.jsx:56`, `CompareViewer.jsx:132`) use it intentionally to intercept scroll for nav/zoom.
- **Never assume `webkitRelativePath` is populated** (`DropZone.jsx:15-17`). Falls back to the dropzone label when individual files (not a folder) are dropped.
- **Never call `showDirectoryPicker` without feature detection.** Module-level guard in `ActionBar.jsx:1` (`hasFsApi`) gates the Live button; runtime guard in `useFileStore.js:96` short-circuits `toggleLiveReload`. Live-reload is a Chromium-only feature; the app must keep working without it.
- **Don't use `as any`, `@ts-ignore`, `@ts-expect-error`** — irrelevant here (no TS) but: don't introduce TS partially without converting consistently.

## UNIQUE STYLES

- **InfoOverlay diff rendering** (`InfoOverlay.jsx:17-42, 84-104`): per-field token-level diff. Each field has its own splitter (`name`: `_-. `, `date`: `-: `, `res`: `×`). Tokens at the same index are compared positionally; mismatches get `text-amber-300` (orig) / `text-emerald-300` (edit), separators stay `text-gray-600`. **Not** char-LCS, **not** whole-value coloring — both were explicitly rejected by the user. If you change splitters, keep `isSeparator()` regex in sync.
- **InfoOverlay layout stability**: top-left HUD overlay is expanded by default and collapses via the `i Info` button. The metadata panel uses translucent `bg-black/55 backdrop-blur-sm`, `max-w-[min(28rem,calc(100%-9rem))]`, `break-all` on names, and `tabular-nums font-mono` on numeric fields. The matched/unmatched counter is inside the expanded panel and intentionally hides when collapsed.
- **Spacebar pan** (`CompareViewer.jsx:71-127`): hybrid tap-toggle (<300ms) vs hold-and-release (≥300ms). Two modes, single key. Don't simplify to one mode.
- **Wheel routing**: plain scroll → image navigation (App), Ctrl+scroll → zoom toward cursor (CompareViewer). Two separate listeners, distinguished only by `e.ctrlKey`.
- **Polling silently swallows errors** (`useFileStore.js:137-139`). Intentional — files mid-write or revoked handles are expected. Don't add logging without rate-limiting.

## COMMANDS

```bash
pnpm install             # First-time setup
pnpm dev                 # Vite dev server → http://localhost:5173
pnpm build               # Production build → dist/
pnpm preview             # Preview built dist locally
pnpm lint                # ESLint flat config
pnpm test                # Vitest unit tests
pnpm test:e2e            # Playwright E2E + visual regression

# Docker (self-host)
docker compose up --build           # → http://localhost:8080
docker build -t slidedirc . && docker run -p 8080:80 slidedirc

# GitHub Pages: pushed to main → .github/workflows/deploy.yml builds with VITE_BASE_URL=/slidedirc/
# To build for a different sub-path locally:
VITE_BASE_URL=/myrepo/ pnpm build
```

## NOTES

- **StrictMode is on** (`main.jsx:7`) → effects run twice in dev. Live-reload `setInterval`, image-dimension loaders, and keydown listeners all double-fire in dev. Expected; don't disable StrictMode to "fix" it.
- **Image matching threshold = 0.6** (`matchFiles.js:22`). Lower = more false positives, especially on numeric suffixes (`img_001` ≈ `img_002` at high similarity).
- **`react-compare-slider` `keyboardIncrement="0%"`** (`CompareViewer.jsx:198`) disables its built-in arrow-key handling so our App-level arrow nav wins.
- **GitHub Pages deploy depends on `VITE_BASE_URL`**. Forking → either rename repo to `slidedirc` or update the env var in `.github/workflows/deploy.yml:37`.
- **No tests.** ~~No test runner configured.~~ Vitest (unit) + Playwright (E2E + visual) configured. See `tests/unit/` and `tests/e2e/`. Playwright runs `workers: 1, fullyParallel: false` — required because parallel workers race against the single dev-server when triggering react-dropzone via `setInputFiles`.
- **`.sisyphus/`** is agent scratch; ignore.
