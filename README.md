# Image Compare Tool

A React + Vite web app for comparing original and edited image folders side by side.

## Motivation

When working with local AI image models in [ComfyUI](https://github.com/comfyanonymous/ComfyUI), the **Image Compare** node quickly became an indispensable part of my inpainting and editing workflow — nothing beats a live slider to judge whether an edit actually improved things.

The problem: once I'm done in ComfyUI I had no comfortable way to revisit those before/after comparisons for a whole batch of images. This tool fills exactly that gap. Drop in your original and edited folders, and you get the same familiar slider view for every matched pair — outside of ComfyUI, in the browser, whenever you need it.

## Features

- **Folder drop zones** — drag and drop two image folders (original and edited)
- **Fuzzy filename matching** — pairs images by exact name, base name, or similarity (≥ 60%) using `string-similarity`
- **Slider compare view** — drag a handle to reveal original vs edited using `react-compare-slider`
- **Thumbnail ribbon** — scroll through matched pairs; navigate with ← → arrow keys
- **Unmatched files panel** — lists any files that couldn't be paired
- **Dark UI** — Tailwind CSS v4 dark theme

## Stack

- [React](https://github.com/facebook/react) 19 + [Vite](https://github.com/vitejs/vite) 7
- [react-compare-slider](https://github.com/nerdyman/react-compare-slider)
- [react-dropzone](https://github.com/react-dropzone/react-dropzone)
- [string-similarity](https://github.com/aceakash/string-similarity)
- [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) v4 (CSS-first config)
- [Vitest](https://github.com/vitest-dev/vitest) + [Playwright](https://github.com/microsoft/playwright) for unit + E2E tests

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173), drop your original folder on the left zone and edited folder on the right, then use the slider to compare.

## Testing

```bash
pnpm test                # Vitest unit tests (matchFiles algorithm)
pnpm test:e2e            # Playwright E2E tests (drop, keyboard, pan, live-reload, visual)
```

## Deployment

### GitHub Pages

The app is automatically built and deployed to GitHub Pages on every push to `main` via the included GitHub Actions workflow (`.github/workflows/deploy.yml`).

**One-time setup:**
1. Go to your repository → **Settings → Pages**
2. Under **Source**, select **GitHub Actions**
3. Push to `main` — the workflow handles the rest

The live URL will be `https://<your-username>.github.io/slidedirc/`.

### Docker (self-hosted / NAS)

A multi-stage `Dockerfile` builds the app and serves it with Nginx.

**Build and run with Docker Compose:**

```bash
docker compose up --build
```

The app is then available at [http://localhost:8080](http://localhost:8080).

To run in the background:

```bash
docker compose up --build -d
```

**Or build and run manually with Docker:**

```bash
docker build -t slidedirc .
docker run -p 8080:80 slidedirc
```
