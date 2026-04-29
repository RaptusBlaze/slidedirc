# Image Compare Tool

A React + Vite web app for comparing original and edited image folders side by side.

## Features

- **Folder drop zones** — drag and drop two image folders (original and edited)
- **Fuzzy filename matching** — pairs images by exact name, base name, or similarity (≥ 60%) using `string-similarity`
- **Slider compare view** — drag a handle to reveal original vs edited using `react-compare-slider`
- **Thumbnail ribbon** — scroll through matched pairs; navigate with ← → arrow keys
- **Unmatched files panel** — lists any files that couldn't be paired
- **Dark UI** — Tailwind CSS v3 dark theme

## Stack

- React 18 + Vite
- react-compare-slider
- react-dropzone
- string-similarity
- Tailwind CSS v3

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), drop your original folder on the left zone and edited folder on the right, then use the slider to compare.

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
