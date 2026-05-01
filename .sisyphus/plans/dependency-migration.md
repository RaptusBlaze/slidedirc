# Dependency Migration to Latest Majors

## TL;DR

> **Quick Summary**: Migrate slidedirc from React 18 / Vite 5 / Tailwind 3 to React 19 / Vite 7 / Tailwind 4, bump Node 20→22 in Docker+CI, and bootstrap Vitest+Playwright test infra (currently zero tests).
>
> **Deliverables**:
> - `package.json` updated to latest majors with `overrides` for legacy peer-deps
> - `src/index.css` migrated to Tailwind 4 single-line `@import`
> - `postcss.config.js` and `tailwind.config.js` deleted (config-less Tailwind 4)
> - `vite.config.js` adds `@tailwindcss/vite` plugin
> - `Dockerfile` + `.github/workflows/deploy.yml` on Node 22
> - `vitest.config.js`, `playwright.config.js`, `tests/` directory with 1 unit + 5 E2E specs + fixture image pairs
> - Visual baselines captured BEFORE migration as regression oracle
>
> **Estimated Effort**: Medium
> **Parallel Execution**: NO — strictly sequential (each wave is a verification gate; commits must be bisect-able)
> **Critical Path**: Wave 0 (baselines) → Wave 1 (Vite 7) → Wave 2 (React 19) → Wave 3 (Tailwind 4) → Wave 4 (Test infra) → Wave 5 (Node 22) → Final Verification

---

## Context

### Original Request
"Erstellen einen Migrationsplan um alle verwendeten pakete / framework oder ähnliches auf die neuste bzw beste version anzuheben - sofern überhaupt veraltetes vorhanden"

### Interview Summary
**Key Discussions**:
- Aggressivität: Latest Majors (React 19, Vite 7, Tailwind 4)
- TypeScript: NEIN (Codebase 13 Files / ~1070 LoC zu klein, keine API-Surface, AGENTS.md-Konvention)
- Verifikation: Vitest (für matchFiles) + Playwright (für UI-Flows) — keine RTL-Komponententests
- Node-Runtime: 22-alpine (Vite 7 verlangt 20.19+/22.12+)
- Tailwind 4 OKLCH-Farbverschiebung: akzeptiert, kein Color-Pinning
- Browser-Support: nur moderne Browser (Chromium-only Live-Reload macht das ohnehin trivial)

**Research Findings**:
- `npm outdated` zeigt nur React 18→19 als verfügbar im aktuellen Range
- react-compare-slider 4.0.0 / react-dropzone 15.0.0 / string-similarity 4.0.4 sind bereits "latest" in ihrer Linie (string-similarity unmaintained, aber funktionsfähig — out of scope)
- Tailwind 4 (Jan 2025): CSS-first Config, OKLCH, ~5x schnellerer Build, Lightning CSS, kein autoprefixer/postcss nötig
- React 19 (Dez 2024): Keine relevanten Breaking Changes für diese Codebase (kein Class-Component, keine String-Refs, keine defaultProps auf Funktionen)
- Vite 7 (Jun 2025): Drops Node 18

### Metis Review
**Identified Gaps** (addressed):
- **Live-Reload Test fehlt**: React 19 ändert StrictMode-Effekt-Semantik leicht → eigener Playwright-Spec für Live-Reload-Interval (Chromium-only)
- **Peer-Deps für react-compare-slider/react-dropzone**: Beide deklarieren noch React 16-18 in peerDependencies → Lösung: `package.json` `overrides` (persistent) statt `--legacy-peer-deps` (Flag, nicht persistent)
- **Tailwind 4 grep-Patterns**: `divide-`, `space-`, `bg-opacity-`, `text-opacity-`, `border-opacity-` müssen vor Migration geprüft werden (v4 hat einige geändert/entfernt)
- **Visual Baselines vor Wave 1**: Playwright muss VOR allen Migrationen Screenshots aufnehmen — ist Wave 0 geworden
- **Wave-Order**: Vite 7 ZUERST (Foundation), Tailwind 4 LETZT (höchstes visuelles Risiko)
- **One commit per wave** (nicht per package): bisect-bar
- **Test-Infra LAST** (verifiziert migrierten Zustand, jagt kein bewegtes Ziel) — Ausnahme: Wave 0 Baseline-Setup
- **Tailwind-Config-Files behalten bis Wave 3 verifiziert**: Rollback-Sicherheitsnetz innerhalb der Wave

---

## Work Objectives

### Core Objective
Alle Dependencies und Tooling auf den aktuellen Stand bringen (React 19, Vite 7, Tailwind 4, Node 22) und gleichzeitig Test-Infrastruktur etablieren, ohne bestehendes Verhalten oder Design zu verändern.

### Concrete Deliverables
- `package.json`: react/react-dom ^19, vite ^7, @vitejs/plugin-react ^5, tailwindcss ^4, @tailwindcss/vite ^4, @types/react ^19, @types/react-dom ^19; `overrides` für react/react-dom; `vitest`, `@playwright/test`, `happy-dom` als devDependencies; `test` und `test:e2e` Scripts
- `package-lock.json`: konsistent regeneriert
- `src/index.css`: 3 `@tailwind`-Direktiven → 1 `@import "tailwindcss";`
- `postcss.config.js`: gelöscht (nach Wave 3 verifiziert)
- `tailwind.config.js`: gelöscht (nach Wave 3 verifiziert)
- `vite.config.js`: `@tailwindcss/vite` Plugin hinzugefügt
- `eslint.config.js`: `settings.react.version` von '18.3' auf '19.0'
- `Dockerfile`: `FROM node:20-alpine` → `FROM node:22-alpine`
- `.github/workflows/deploy.yml`: `node-version: 20` → `node-version: 22`
- `vitest.config.js`: minimal config mit happy-dom Environment
- `playwright.config.js`: minimal config mit Chromium, gepinnter Browser-Version
- `tests/unit/matchFiles.test.js`: 4 Testfälle für matchFiles
- `tests/e2e/`: 5 Spec-Files (drop-match, keyboard, pan, live-reload, visual)
- `tests/fixtures/a/` + `tests/fixtures/b/`: 3 PNG-Paare für E2E
- `tests/e2e/visual.spec.js-snapshots/`: Baseline-Screenshots (committet)

### Definition of Done
- [ ] `npm run build` exit 0, dist/ produziert
- [ ] `npm run lint` exit 0, zero errors
- [ ] `npm run test` exit 0 (Vitest)
- [ ] `npm run test:e2e` exit 0 (Playwright)
- [ ] `npm outdated` zeigt keine Major-Updates mehr für react/react-dom/vite/tailwindcss/@vitejs/plugin-react/@types/react
- [ ] `docker compose up --build` startet App auf :8080
- [ ] Final Verification Wave (F1-F4) alle APPROVE
- [ ] Explizite User-Freigabe nach Final Verification

### Must Have
- React 19, Vite 7, Tailwind 4, Node 22 alle aktiv und funktional
- Alle 7 kritischen Verhalten aus AGENTS.md weiter funktional (Blob-URL-Lifecycle, cancelled-Flag, Polling-Refs, key={axisMode}, transformOrigin, Spacebar-Tap-vs-Hold, Wheel-Routing)
- Visual-Diff vor/nach Migration unterhalb 2% Pixel-Threshold
- Ein Commit pro Wave (bisect-bar)
- `package.json` `overrides` für react-compare-slider und react-dropzone Peer-Deps
- Live-Reload Playwright-Test (catches React 19 StrictMode interval-leak)
- Visual-Baselines existieren BEVOR irgendeine Migration startet

### Must NOT Have (Guardrails)
- KEIN TypeScript einführen (kein `.tsx`, kein `tsconfig.json`, kein `@typescript-eslint/*`)
- KEIN Refactoring von `useFileStore`, auch wenn React 19 `use()`-Hook etwas vereinfachen würde
- KEINE Änderung an react-compare-slider, react-dropzone, string-similarity (Versionen oder Replacement)
- KEINE React-Testing-Library / Komponenten-Tests (nur Vitest für matchFiles, Rest Playwright)
- KEIN husky, lint-staged, dependabot, renovate, neue Dev-Tooling-Workflows
- KEINE Änderung an `nginx.conf` außer Node-Bump in Dockerfile
- KEINE Änderung an `VITE_BASE_URL`-Handling oder GH-Pages-Workflow-Logik außer Node-Version
- KEINE Anpassung der 7 kritischen Verhalten — nur Verifikation, kein Re-Architecture
- KEINE neuen Akzentfarben, Redesign, "Modernisierung" der UI
- KEIN `--force` oder `--legacy-peer-deps` Flag in committeter Config — `overrides` ist die einzige Lösung
- KEINE Color-Pinning via `@theme` (User akzeptiert OKLCH-Verschiebung)
- KEIN Wave-Skip / Wave-Merge: jede Wave ist ein eigener Commit + eigene Verifikation
- KEINE Löschung von tailwind.config.js / postcss.config.js VOR Wave-3-Verifikation
- KEINE neuen Test-Files über das Cap hinaus: 1 vitest.config + 1 playwright.config + 1 fixtures/ + 1 unit-test + ≤5 E2E-Specs

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.
> Acceptance criteria requiring "user manually tests/confirms" are FORBIDDEN.

### Test Decision
- **Infrastructure exists**: NO (nothing in current project)
- **Automated tests**: Tests-after (Test-Infra ist Wave 4, nach Migration)
- **Framework**: Vitest (unit, für `matchFiles`) + Playwright (E2E, für UI-Flows)
- **Wave 0 Ausnahme**: Playwright wird FRÜH installiert nur für Baseline-Screenshots vor Wave 1

### QA Policy
Every task MUST include agent-executed QA scenarios. Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Build/Lint Gates**: `npm run build && npm run lint` nach JEDER Wave (Bash exit codes)
- **E2E Verifikation (Wave 4+)**: Playwright headless, Chromium gepinnt
- **Visual Regression**: Playwright `toHaveScreenshot({ maxDiffPixelRatio: 0.02 })` — Baselines aus Wave 0 sind die Referenz
- **Per-package Version Assertion**: `node -p "require('./package.json').dependencies.react"` etc.

---

## Execution Strategy

### Sequential Execution Waves

> **No parallelism**: Each wave is a verification gate. Each wave = one commit. Bisect-ability is non-negotiable.

```
Wave 0 (Baseline Capture - BEFORE any migration):
└── Task 1: Install Playwright + create fixtures + capture visual baselines
    Commit: chore(test): capture pre-migration visual baselines

Wave 1 (Vite 7 - Foundation):
└── Task 2: Bump Vite 5→7, @vitejs/plugin-react 4→5; verify build
    Commit: chore(deps): upgrade vite to 7.x and plugin-react to 5.x

Wave 2 (React 19 - Runtime):
└── Task 3: Bump react/react-dom 18→19, @types/react 18→19, add overrides for peer-deps; bump ESLint settings.react.version; verify build+lint+manual flows
    Commit: chore(deps): upgrade react to 19.x with peer-dep overrides

Wave 3 (Tailwind 4 - Visual):
└── Task 4: Pre-grep forbidden patterns, install @tailwindcss/vite, migrate src/index.css, register Vite plugin, delete tailwind.config.js + postcss.config.js + autoprefixer; visual-diff against Wave 0 baselines
    Commit: chore(deps): upgrade tailwindcss to 4.x with css-first config

Wave 4 (Test Infra - Permanent):
└── Task 5: Vitest config + matchFiles.test.js + Playwright config + 5 E2E specs (drop-match, keyboard, pan, live-reload, visual); add npm scripts; full test suite must pass
    Commit: chore(test): bootstrap vitest and playwright infrastructure

Wave 5 (Node Runtime - Deploy):
└── Task 6: Dockerfile node:20-alpine → node:22-alpine; deploy.yml node-version 20→22; docker build smoke test
    Commit: chore(deploy): upgrade node runtime to 22 in docker and ci

Wave FINAL (4 parallel reviews + user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high + playwright)
└── Task F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay
```

### Dependency Matrix

| Task | Depends On | Blocks |
|---|---|---|
| 1 (Wave 0 baselines) | — | 2, 3, 4 (baselines must exist before any migration) |
| 2 (Wave 1 Vite) | 1 | 3, 4, 5, 6 |
| 3 (Wave 2 React) | 2 | 4, 5, 6 |
| 4 (Wave 3 Tailwind) | 3 (and 1's baselines for diff) | 5, 6 |
| 5 (Wave 4 Tests) | 4 | 6 |
| 6 (Wave 5 Node) | 5 | F1–F4 |
| F1–F4 | 6 | user okay |

### Agent Dispatch Summary

| Wave | Tasks | Agent |
|---|---|---|
| 0 | T1 | `unspecified-high` (Playwright setup is non-trivial) |
| 1 | T2 | `quick` (small package.json + maybe vite.config tweak) |
| 2 | T3 | `unspecified-high` (overrides + lint config + manual verify) |
| 3 | T4 | `deep` (multi-file: package.json, vite.config, src/index.css, delete configs, visual diff) |
| 4 | T5 | `unspecified-high` (test infra is the largest task) |
| 5 | T6 | `quick` (2-line changes in 2 files) |
| FINAL | F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep` |

---

## TODOs

- [x] 1. Wave 0: Capture Pre-Migration Visual Baselines

  **What to do**:
  - Install `@playwright/test` as devDependency (only this — full test infra comes in Wave 4)
  - Run `npx playwright install chromium --with-deps`
  - Create minimal `playwright.config.js` (Chromium only, headless, baseURL http://localhost:5173, **gepinnte Browser-Version via `use: { channel: 'chromium' }` und Lock im Comment**)
  - Create `tests/fixtures/a/` and `tests/fixtures/b/` with 3 PNG pairs each (use minimal generated PNGs — solid color 100x100 with different hues for a/ vs b/, named `pair-1.png`, `pair-2.png`, `pair-3.png`). Generate via `node -e "..."` ImageData script or use existing tiny PNGs from public/.
  - Create `tests/e2e/visual.spec.js` with 4 baseline screenshots:
    - empty drop-zone state (initial load)
    - compare view loaded with pair-1 (after dropping fixtures)
    - help overlay open (`?` pressed)
    - axis mode 1 (one `R` press)
  - Run `npm run dev` in background, then `npx playwright test --update-snapshots` to generate baselines
  - Commit baseline PNGs to `tests/e2e/visual.spec.js-snapshots/`
  - Add `test:e2e` script to package.json: `"test:e2e": "playwright test"`

  **Must NOT do**:
  - Install vitest or any other test infra (Wave 4)
  - Add E2E specs other than visual.spec.js (Wave 4)
  - Skip baseline capture even if it feels "trivial" — without it Wave 3 has no oracle

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Playwright setup, fixture generation, and baseline capture span multiple non-trivial concerns
  - **Skills**: [`playwright`]
    - `playwright`: Direct domain match — Playwright config, snapshots, fixture handling
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Not designing UI, only capturing existing state

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 0)
  - **Blocks**: Tasks 2, 3, 4 (no migration without baselines)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `package.json:6-11` — npm scripts location for adding `test:e2e`
  - `src/App.jsx:31-45` — keyboard handler showing `R` and `?` keys (for triggering test states)
  - `src/components/DropZone.jsx:5-18` — to understand how files arrive at DropZone (for E2E `setInputFiles`)

  **API/Type References**:
  - File shape: `{ name: string, url: blob-URL, lastModified: number }` (AGENTS.md DATA FLOW section)

  **External References**:
  - Playwright config: `https://playwright.dev/docs/test-configuration`
  - Visual snapshots: `https://playwright.dev/docs/test-snapshots`
  - Vite dev server URL: http://localhost:5173 (per `vite.config.js`)

  **WHY Each Reference Matters**:
  - Snapshots use Playwright's built-in `toHaveScreenshot()` — needs gepinnte Chromium-Version damit Linux-CI vs Linux-Dev konsistent rendert
  - The fixtures must match the file shape that DropZone produces (PNG files with `name` and `lastModified`)
  - `R` and `?` keyboard handlers in App.jsx are the trigger surface for axis-mode and help-overlay states

  **Acceptance Criteria**:
  - [ ] `tests/fixtures/a/pair-1.png`, `pair-2.png`, `pair-3.png` exist (and same in b/)
  - [ ] `playwright.config.js` exists with Chromium pinned
  - [ ] `tests/e2e/visual.spec.js` exists with 4 screenshot tests
  - [ ] `tests/e2e/visual.spec.js-snapshots/` contains 4 PNG baselines
  - [ ] `npm run test:e2e` exit 0
  - [ ] `package.json` has `"test:e2e": "playwright test"` script
  - [ ] `npm run build` still exit 0 (no regression)

  **QA Scenarios**:

  ```
  Scenario: Baseline capture succeeds and produces 4 PNG snapshots
    Tool: Bash
    Preconditions: Wave 0 task implementation complete; npm install done
    Steps:
      1. Run `ls tests/e2e/visual.spec.js-snapshots/ | wc -l`
      2. Assert output ≥ 4
      3. Run `file tests/e2e/visual.spec.js-snapshots/empty-1-chromium-linux.png` (or similar)
      4. Assert output contains "PNG image data"
      5. Run `npx playwright test tests/e2e/visual.spec.js`
      6. Assert exit code 0
    Expected Result: 4+ baseline PNGs exist; visual.spec passes against itself
    Failure Indicators: Snapshot dir empty; non-PNG files; test fails on its own baseline
    Evidence: .sisyphus/evidence/task-1-baseline-capture.txt (output of ls + playwright test)

  Scenario: Build still works after Playwright install
    Tool: Bash
    Preconditions: Task 1 complete
    Steps:
      1. Run `rm -rf dist`
      2. Run `npm run build`
      3. Assert exit code 0
      4. Assert `dist/index.html` exists
    Expected Result: Production build unaffected by Playwright addition
    Failure Indicators: Build error; missing dist artifacts
    Evidence: .sisyphus/evidence/task-1-build-after-playwright.txt
  ```

  **Evidence to Capture**:
  - [ ] task-1-baseline-capture.txt
  - [ ] task-1-build-after-playwright.txt

  **Commit**: YES (Wave 0 commit)
  - Message: `chore(test): capture pre-migration visual baselines`
  - Files: `package.json`, `package-lock.json`, `playwright.config.js`, `tests/fixtures/**`, `tests/e2e/visual.spec.js`, `tests/e2e/visual.spec.js-snapshots/**`
  - Pre-commit: `npm run build && npm run test:e2e`

---

- [x] 2. Wave 1: Upgrade Vite 5→7 + @vitejs/plugin-react 4→5

  **What to do**:
  - `npm install --save-dev vite@^7 @vitejs/plugin-react@^5`
  - Verify `vite.config.js` still works (basic plugin call — no changes expected)
  - Run dev server smoke check: `npm run dev` boots without errors (kill after a few seconds)
  - Run `npm run build` — must succeed
  - Run `npm run lint` — must succeed
  - Run `npm run test:e2e` — Wave 0 visual baselines must still match (proves Vite 7 didn't change rendering)
  - Commit

  **Must NOT do**:
  - Touch any other dependency
  - Modify `vite.config.js` beyond what's needed for compat (likely: nothing)
  - Add new vite plugins
  - Change `VITE_BASE_URL` handling

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single npm install + verification. <30 min work, 1-2 file changes max
  - **Skills**: []
    - No skill needed — straightforward dependency bump

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 1)
  - **Blocks**: Tasks 3, 4, 5, 6
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `vite.config.js:1-11` — current minimal config; should remain minimal

  **API/Type References**:
  - Vite 7 uses same `defineConfig` API as Vite 5 — no signature change

  **External References**:
  - Vite 7 migration guide: `https://vite.dev/guide/migration`
  - @vitejs/plugin-react v5 changelog: `https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/CHANGELOG.md`

  **WHY Each Reference Matters**:
  - Vite 7 mostly continues Vite 5/6 API; the breaking changes are around Node version (already handled by Wave 5) and some experimental APIs (not used here)
  - plugin-react v5 is React 19-aware; installing it now in advance of Wave 2 React upgrade is intentional

  **Acceptance Criteria**:
  - [ ] `node -p "require('./package.json').devDependencies.vite"` outputs `^7.x.x`
  - [ ] `node -p "require('./package.json').devDependencies['@vitejs/plugin-react']"` outputs `^5.x.x`
  - [ ] `npm run build` exit 0
  - [ ] `npm run lint` exit 0
  - [ ] `npm run test:e2e` exit 0 (visual baselines still match)
  - [ ] Single commit with message `chore(deps): upgrade vite to 7.x and plugin-react to 5.x`

  **QA Scenarios**:

  ```
  Scenario: Vite 7 build produces working dist
    Tool: Bash
    Preconditions: Wave 0 complete, Wave 1 implementation done
    Steps:
      1. Run `rm -rf dist && npm run build`
      2. Assert exit code 0
      3. Run `ls dist/index.html dist/assets/`
      4. Assert both exist
      5. Run `grep -o 'src="[^"]*"' dist/index.html`
      6. Assert at least one hashed asset reference exists (e.g., `index-XXXXX.js`)
    Expected Result: Production build identical in shape to Vite 5 output
    Failure Indicators: Missing dist; no hashed assets; build error
    Evidence: .sisyphus/evidence/task-2-vite7-build.txt

  Scenario: Visual baselines unchanged after Vite 7 upgrade
    Tool: Playwright
    Preconditions: Wave 0 baselines exist; Wave 1 done
    Steps:
      1. Run `npm run test:e2e -- tests/e2e/visual.spec.js`
      2. Assert exit code 0 (no snapshot mismatches above 2% threshold)
    Expected Result: Vite 7 produces pixel-equivalent output to Vite 5 baselines
    Failure Indicators: snapshot diff failures
    Evidence: .sisyphus/evidence/task-2-visual-after-vite7.txt
  ```

  **Evidence to Capture**:
  - [ ] task-2-vite7-build.txt
  - [ ] task-2-visual-after-vite7.txt

  **Commit**: YES (Wave 1 commit)
  - Message: `chore(deps): upgrade vite to 7.x and plugin-react to 5.x`
  - Files: `package.json`, `package-lock.json`
  - Pre-commit: `npm run build && npm run lint && npm run test:e2e`

- [x] 3. Wave 2: Upgrade React 18→19 + types + peer-dep overrides

  **What to do**:
  - `npm install react@^19 react-dom@^19`
  - `npm install --save-dev @types/react@^19 @types/react-dom@^19`
  - Add `overrides` block to `package.json` to satisfy react-compare-slider and react-dropzone peer-deps:
    ```json
    "overrides": {
      "react": "$react",
      "react-dom": "$react-dom"
    }
    ```
  - Update `eslint.config.js`: `settings: { react: { version: '19.0' } }`
  - Run `npm run build` — must succeed
  - Run `npm run lint` — must succeed (any new React 19 lint warnings: fix or document, do NOT mass-disable)
  - Run `npm run test:e2e` — Wave 0 visual baselines must still match
  - Manual smoke verification (executed by agent via Playwright):
    - Drop-zone interaction (react-dropzone works under React 19 + override)
    - Compare slider drag (react-compare-slider works under React 19 + override)
  - Commit

  **Must NOT do**:
  - Use `--legacy-peer-deps` flag (use `overrides` instead)
  - Use `--force` flag
  - Refactor `useFileStore` to use React 19 `use()` hook (out of scope)
  - Touch any of the 7 critical behaviors' implementation
  - Add React 19 codemod transformations beyond what npm install does
  - Disable react/react-hooks lint rules wholesale

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multi-file (package.json + eslint.config.js), peer-dep overrides require care, lint rule changes possible
  - **Skills**: []
    - No skill needed — generic dependency + config work

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 2)
  - **Blocks**: Tasks 4, 5, 6
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `eslint.config.js:20` — `settings: { react: { version: '18.3' } }` line to update
  - `package.json:12-18` — dependencies block where `overrides` will be added (top-level, sibling to `dependencies`)
  - `src/main.jsx:6-9` — `createRoot` already used (React 18+ API, works in 19)
  - `src/hooks/useFileStore.js:37-41` — ref pattern in StrictMode-safe interval (must keep working)

  **API/Type References**:
  - React 19 `createRoot` and `StrictMode` APIs are unchanged
  - No `forwardRef` in user code (only inside library deps)

  **External References**:
  - React 19 upgrade guide: `https://react.dev/blog/2024/12/05/react-19-upgrade-guide`
  - npm overrides spec: `https://docs.npmjs.com/cli/v10/configuring-npm/package-json#overrides`
  - react-compare-slider peer-dep status: `https://github.com/nerdyman/react-compare-slider/blob/main/package.json`
  - react-dropzone peer-dep status: `https://github.com/react-dropzone/react-dropzone/blob/main/package.json`

  **WHY Each Reference Matters**:
  - The user's codebase uses no React class components, no string refs, no `defaultProps` on functions, no `propTypes` warnings — the most common React 19 breakage surfaces are absent
  - `overrides` is npm 8.3+ syntax (CI Node 22 supports it natively); `$react` syntax tells npm "use the version declared in dependencies"
  - Without overrides, npm install will warn or fail on the peer-dep mismatch — but the libraries actually work fine with React 19 (their peer-deps are just stale declarations)

  **Acceptance Criteria**:
  - [ ] `node -p "require('./package.json').dependencies.react"` outputs `^19.x.x`
  - [ ] `node -p "require('./package.json').dependencies['react-dom']"` outputs `^19.x.x`
  - [ ] `node -p "require('./package.json').overrides.react"` outputs `$react`
  - [ ] `grep "version: '19.0'" eslint.config.js` returns match
  - [ ] `npm run build` exit 0
  - [ ] `npm run lint` exit 0
  - [ ] `npm run test:e2e` exit 0
  - [ ] No `--legacy-peer-deps` or `--force` in npm install commands run
  - [ ] Single commit with message `chore(deps): upgrade react to 19.x with peer-dep overrides`

  **QA Scenarios**:

  ```
  Scenario: React 19 mounts and StrictMode double-invoke is handled
    Tool: Playwright
    Preconditions: Wave 2 implementation complete; npm run dev started
    Steps:
      1. Open http://localhost:5173
      2. Wait for `.text-3xl` (h1 "Image Compare Tool") to be visible
      3. Capture browser console messages
      4. Assert: zero console.error entries
      5. Assert: page renders drop-zone UI
    Expected Result: App boots cleanly under React 19 StrictMode
    Failure Indicators: Console errors; missing UI; hydration warnings
    Evidence: .sisyphus/evidence/task-3-react19-boot.txt

  Scenario: Drop-zone (react-dropzone) and slider (react-compare-slider) work under React 19
    Tool: Playwright
    Preconditions: Wave 2 done; dev server running
    Steps:
      1. Navigate to http://localhost:5173
      2. Locate first DropZone (left side, "Drop Original Folder Here")
      3. Use `setInputFiles()` to drop tests/fixtures/a/pair-1.png
      4. Locate second DropZone (right side, "Drop Edited Folder Here")
      5. Use `setInputFiles()` to drop tests/fixtures/b/pair-1.png
      6. Wait for compare view to appear (look for ReactCompareSlider's handle element)
      7. Assert: TopBar shows filename `pair-1.png`
      8. Drag the slider handle from x=400 to x=200 via mouse.move + mouse.down/up
      9. Assert: no console errors during drag
    Expected Result: Both libs work under React 19 with overrides; slider responds to drag
    Failure Indicators: Compare view never appears; slider unresponsive; console errors
    Evidence: .sisyphus/evidence/task-3-libs-under-react19.png + .txt

  Scenario: Live-reload polling refs survive React 19 StrictMode (CRITICAL — covers Metis-identified gap)
    Tool: Playwright (Chromium)
    Preconditions: Wave 2 done; Chromium browser
    Notes: Headless cannot trigger real `showDirectoryPicker`. Must stub via `page.addInitScript` BEFORE load to actually enter the polling code path. Without this, the test trivially passes by never running the polling.
    Steps:
      1. Inject stub before load (same pattern as Task 5 live-reload spec):
         ```js
         await page.addInitScript(() => {
           window.__lrStub = { pickCount: 0 };
           window.showDirectoryPicker = async () => ({
             kind: 'directory',
             name: `stub-${window.__lrStub.pickCount++}`,
             async *values() { /* empty initially */ },
           });
         });
         ```
      2. Navigate to http://localhost:5173
      3. Capture all console messages from this point
      4. Drop two folders (fixtures a/ and b/) to enter compare view
      5. Click "Live" button → triggers stubbed picker → `setInterval(getNewFiles, 3000)` starts
      6. Wait 8 seconds (covers TWO StrictMode-mount + poll-tick cycles)
      7. Assert: no `console.error` containing "Maximum update depth", "interval", or React 19 hook warnings
      8. Assert: matched count remains stable (not duplicated by StrictMode double-effect)
      9. Click "Live" again to disable; wait 4 seconds; assert: zero new errors after cleanup
    Expected Result: useFileStore refs prevent StrictMode interval leak; cleanup works
    Failure Indicators: Duplicate entries in matched list; console warnings about excessive updates; errors after disable (cleanup leak)
    Evidence: .sisyphus/evidence/task-3-strictmode-stability.txt
    Evidence: .sisyphus/evidence/task-3-strictmode-stability.txt
  ```

  **Evidence to Capture**:
  - [ ] task-3-react19-boot.txt
  - [ ] task-3-libs-under-react19.png + .txt
  - [ ] task-3-strictmode-stability.txt

  **Commit**: YES (Wave 2 commit)
  - Message: `chore(deps): upgrade react to 19.x with peer-dep overrides`
  - Files: `package.json`, `package-lock.json`, `eslint.config.js`
  - Pre-commit: `npm run build && npm run lint && npm run test:e2e`

- [x] 4. Wave 3: Tailwind 3→4 Migration (CSS-first config)

  **What to do**:
  - **Pre-flight grep — TWO TIERS**:
    - **Tier A — STOP-blockers** (utilities REMOVED in v4 — grep MUST return empty / `CLEAN-A`):
      ```bash
      grep -rnE 'bg-opacity-|text-opacity-|border-opacity-|ring-opacity-|placeholder-opacity-|divide-opacity-|flex-grow-|flex-shrink-|decoration-slice|decoration-clone|overflow-ellipsis' src/ index.html || echo "CLEAN-A"
      ```
      If Tier A returns matches: **STOP**, report file:line, do NOT proceed (manual class replacement required outside this plan's scope).
    - **Tier B — WARN-only** (utilities whose CSS selector or behavior subtly changed in v4 — grep returns matches OK, visual-diff is the gate):
      ```bash
      grep -rnE 'space-[xy]-|divide-[xy]-' src/ index.html || echo "CLEAN-B"
      ```
      Capture matches to evidence as INFO; do NOT block on Tier B. The Wave 0 visual baselines + 2% threshold catch any regression.
    - **Known Tier B matches in current codebase** (pre-confirmed acceptable):
      - `src/components/UnmatchedPanel.jsx:23` — `space-y-0.5` on `<ul>` with `<li>` children (no inline content → selector change has no visible effect)
      - `src/components/UnmatchedPanel.jsx:33` — same as above
  - `npm uninstall tailwindcss postcss autoprefixer`
  - `npm install --save-dev tailwindcss@^4 @tailwindcss/vite@^4`
  - Edit `vite.config.js`:
    ```js
    import { defineConfig } from 'vite'
    import react from '@vitejs/plugin-react'
    import tailwindcss from '@tailwindcss/vite'

    export default defineConfig({
      plugins: [react(), tailwindcss()],
      base: process.env.VITE_BASE_URL ?? '/',
    })
    ```
  - Edit `src/index.css` — replace ALL contents with single line:
    ```css
    @import "tailwindcss";
    ```
  - Run `npm run build` — must succeed
  - Run `npm run lint` — must succeed
  - Run `npm run test:e2e` — visual baselines from Wave 0 must match within 2% pixel threshold (proves Tailwind 4 OKLCH shift is acceptable)
  - **ONLY after all gates pass**: delete `postcss.config.js` and `tailwind.config.js`
  - Re-run `npm run build && npm run test:e2e` after deletion to confirm config-less mode works
  - Commit

  **Must NOT do**:
  - Use `@theme` block to pin v3 colors (user accepted OKLCH shift)
  - Add custom Tailwind plugins
  - Keep `tailwind.config.js` "for safety" — must be deleted in this commit
  - Keep `postcss.config.js` — must be deleted
  - Keep `autoprefixer` in devDependencies (Tailwind 4's Lightning CSS handles prefixes)
  - Run `npx tailwindcss-upgrade` codemod blindly — codebase is small enough that manual migration is cleaner
  - Apply Tailwind 4 to a new file — only update what exists
  - Change any Tailwind class in any component file (`src/**/*.jsx`) — verifying that v4 supports the same class names is the whole point. **Exception**: NONE in this wave; Tier B matches (`space-y-*`) are explicitly allowed to remain unchanged because they continue to work for the current usage pattern (block-level `<li>` children).

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Highest-risk wave; touches package.json + vite.config + src/index.css + deletes 2 config files; visual-diff verification is non-trivial
  - **Skills**: []
    - Skills omitted — frontend-ui-ux not needed (no design changes); playwright is invoked via npm scripts only

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 3)
  - **Blocks**: Tasks 5, 6
  - **Blocked By**: Tasks 1 (baselines), 3 (React 19)

  **References**:

  **Pattern References**:
  - `src/index.css:1-3` — current 3 `@tailwind` directives → 1 `@import` line
  - `vite.config.js:1-11` — plugin array where `@tailwindcss/vite` will be added
  - `tailwind.config.js:1-9` — current empty config (no `theme.extend` content, no plugins) → confirms safe to delete
  - `postcss.config.js:1-6` — to be deleted (Tailwind 4 doesn't use PostCSS pipeline anymore)

  **API/Type References**:
  - Tailwind 4 `@import "tailwindcss"` is the official replacement for the 3 `@tailwind` directives
  - `@tailwindcss/vite` plugin auto-detects content from `index.html` and `src/**` (no config needed)

  **External References**:
  - Tailwind 4 upgrade guide: `https://tailwindcss.com/docs/upgrade-guide`
  - Tailwind 4 Vite installation: `https://tailwindcss.com/docs/installation/using-vite`
  - Tailwind 4 changelog (color palette OKLCH): `https://tailwindcss.com/blog/tailwindcss-v4`

  **WHY Each Reference Matters**:
  - The codebase uses standard utility classes (bg-gray-950, text-amber-300, flex, grid, p-8, etc.) — all preserved in v4
  - Tailwind 4's auto-content-detection works from project root (Vite plugin) — no need for `content: [...]` config
  - The OKLCH color palette is the **only** expected visual change; the 2% Playwright threshold accommodates this

  **Acceptance Criteria**:
  - [ ] Tier A pre-flight grep output captured in evidence (must be `CLEAN-A`)
  - [ ] Tier B pre-flight grep output captured in evidence (informational)
  - [ ] `node -p "require('./package.json').devDependencies.tailwindcss"` outputs `^4.x.x`
  - [ ] `node -p "require('./package.json').devDependencies['@tailwindcss/vite']"` outputs `^4.x.x`
  - [ ] `! node -p "require('./package.json').devDependencies.autoprefixer || ''"` returns empty string
  - [ ] `! node -p "require('./package.json').devDependencies.postcss || ''"` returns empty string
  - [ ] `test ! -f postcss.config.js`
  - [ ] `test ! -f tailwind.config.js`
  - [ ] `grep -q '@import "tailwindcss"' src/index.css`
  - [ ] `grep -q '@tailwindcss/vite' vite.config.js`
  - [ ] `npm run build` exit 0
  - [ ] `npm run lint` exit 0
  - [ ] `npm run test:e2e` exit 0 (visual diff ≤ 2%)
  - [ ] Single commit with message `chore(deps): upgrade tailwindcss to 4.x with css-first config`

  **QA Scenarios**:

  ```
  Scenario: Tailwind 4 produces visually equivalent output (≤2% pixel diff)
    Tool: Playwright
    Preconditions: Wave 0 baselines exist; Wave 3 implementation done
    Steps:
      1. Run `npm run test:e2e -- tests/e2e/visual.spec.js`
      2. Assert exit code 0
      3. If failure: capture diff images from `test-results/` for review
    Expected Result: All 4 baselines match within 2% pixel ratio (OKLCH shift accommodated)
    Failure Indicators: Snapshot diff > 2%; missing classes; broken layout
    Evidence: .sisyphus/evidence/task-4-visual-after-tailwind4.txt + diff PNGs if failure

  Scenario: Production build still produces hashed CSS asset
    Tool: Bash
    Preconditions: Wave 3 done
    Steps:
      1. Run `rm -rf dist && npm run build`
      2. Assert exit code 0
      3. Run `find dist/assets -name "*.css" | wc -l`
      4. Assert output ≥ 1
      5. Run `grep -l "bg-gray-950\|background-color" dist/assets/*.css`
      6. Assert at least one CSS file contains expected utility output (or its compiled equivalent — Tailwind 4 may use OKLCH `oklch(...)` values)
    Expected Result: Build produces working CSS bundle
    Failure Indicators: No CSS output; missing utility classes
    Evidence: .sisyphus/evidence/task-4-build-css.txt

  Scenario: Config-less mode works after deleting tailwind.config.js + postcss.config.js
    Tool: Bash
    Preconditions: Wave 3 done; configs deleted
    Steps:
      1. Run `test ! -f tailwind.config.js && test ! -f postcss.config.js && echo "CONFIGS GONE"`
      2. Assert output `CONFIGS GONE`
      3. Run `rm -rf dist node_modules/.vite && npm run build`
      4. Assert exit code 0 (cold build with no caches)
    Expected Result: Build succeeds without any Tailwind/PostCSS config files
    Failure Indicators: Tailwind reports missing config; PostCSS errors; build fails
    Evidence: .sisyphus/evidence/task-4-configless-build.txt

  Scenario: Pre-flight grep — Tier A (STOP-blockers, must be CLEAN-A)
    Tool: Bash
    Preconditions: Wave 3 starting
    Steps:
      1. Run `grep -rnE 'bg-opacity-|text-opacity-|border-opacity-|ring-opacity-|placeholder-opacity-|divide-opacity-|flex-grow-|flex-shrink-|decoration-slice|decoration-clone|overflow-ellipsis' src/ index.html || echo "CLEAN-A"`
      2. Capture output to `.sisyphus/evidence/task-4-preflight-tier-a.txt`
      3. Assert output is exactly `CLEAN-A`
      4. If matches found: STOP, report file:line, do NOT proceed
    Expected Result: `CLEAN-A` (codebase doesn't use removed-in-v4 utilities per AGENTS.md inspection)
    Failure Indicators: Any match output → migration blocked
    Evidence: .sisyphus/evidence/task-4-preflight-tier-a.txt

  Scenario: Pre-flight grep — Tier B (WARN-only, informational)
    Tool: Bash
    Preconditions: Wave 3 starting
    Steps:
      1. Run `grep -rnE 'space-[xy]-|divide-[xy]-' src/ index.html || echo "CLEAN-B"`
      2. Capture output to `.sisyphus/evidence/task-4-preflight-tier-b.txt`
      3. Compare against pre-confirmed acceptable matches (UnmatchedPanel.jsx:23,33)
      4. Proceed regardless — visual-diff (next scenario) is the gate
    Expected Result: Either `CLEAN-B` or only the 2 known matches in UnmatchedPanel.jsx
    Failure Indicators: New matches in files other than UnmatchedPanel.jsx → review before proceeding
    Evidence: .sisyphus/evidence/task-4-preflight-tier-b.txt
  ```

  **Evidence to Capture**:
  - [ ] task-4-preflight-tier-a.txt (FIRST — must be CLEAN-A)
  - [ ] task-4-preflight-tier-b.txt (informational)
  - [ ] task-4-visual-after-tailwind4.txt
  - [ ] task-4-build-css.txt
  - [ ] task-4-configless-build.txt

  **Commit**: YES (Wave 3 commit)
  - Message: `chore(deps): upgrade tailwindcss to 4.x with css-first config`
  - Files: `package.json`, `package-lock.json`, `vite.config.js`, `src/index.css`; deleted: `postcss.config.js`, `tailwind.config.js`
  - Pre-commit: `npm run build && npm run lint && npm run test:e2e`

- [x] 5. Wave 4: Test Infrastructure (Vitest + Full Playwright Suite)

  **What to do**:
  - `npm install --save-dev vitest happy-dom`
  - Create `vitest.config.js`:
    ```js
    import { defineConfig } from 'vitest/config'
    export default defineConfig({
      test: { environment: 'happy-dom', include: ['tests/unit/**/*.test.js'] }
    })
    ```
  - Create `tests/unit/matchFiles.test.js` with 4 test cases (see References)
  - Create `tests/e2e/drop-match.spec.js` (see QA Scenarios)
  - Create `tests/e2e/keyboard.spec.js` (see QA Scenarios)
  - Create `tests/e2e/pan.spec.js` (see QA Scenarios)
  - Create `tests/e2e/live-reload.spec.js` (Chromium-only, gracefully skip if FS Access API unavailable)
  - Add `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`
  - (`test:e2e` already added in Wave 0)
  - Run `npm run test` — must pass
  - Run `npm run test:e2e` — all 5 specs (visual + 4 new) must pass
  - Commit

  **Must NOT do**:
  - Add @testing-library/react or any component-test framework (out of scope)
  - Add tests for components beyond what's listed
  - Add coverage tooling (`@vitest/coverage-*`) — out of scope
  - Add additional unit tests beyond `matchFiles.test.js`
  - Exceed: 1 vitest config + 1 fixtures dir (already exists from Wave 0) + 1 unit test file + 5 E2E specs total (visual.spec.js from Wave 0 counts toward the 5)
  - Touch implementation files (`src/**`) to make tests easier — tests adapt to code, not vice versa

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Largest task by file count; multiple test files; Playwright + Vitest both in play
  - **Skills**: [`playwright`]
    - `playwright`: Direct domain match for the 4 new E2E specs

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 4)
  - **Blocks**: Task 6
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `src/utils/matchFiles.js:7-35` — function signature and 3-tier matching logic to test
  - `src/components/DropZone.jsx:5-18` — onDrop handler signature to drive E2E `setInputFiles`
  - `src/App.jsx:31-45` — keyboard event handlers (R, ?) for keyboard.spec.js
  - `src/components/CompareViewer.jsx:71-127` — Spacebar tap-vs-hold logic for pan.spec.js
  - `src/hooks/useFileStore.js:7-22, 122-144` — live-reload polling for live-reload.spec.js
  - `playwright.config.js` (from Wave 0) — already configured with Chromium

  **API/Type References**:
  - `matchFiles(filesA, filesB)` returns `{matched, unmatchedA, unmatchedB}` (per AGENTS.md)
  - File shape: `{name, url, lastModified}`

  **External References**:
  - Vitest config: `https://vitest.dev/config/`
  - happy-dom: `https://github.com/capricorn86/happy-dom`
  - Playwright `setInputFiles`: `https://playwright.dev/docs/api/class-locator#locator-set-input-files`
  - Playwright keyboard: `https://playwright.dev/docs/api/class-keyboard`

  **WHY Each Reference Matters**:
  - matchFiles.js is a pure function with deterministic output — perfect Vitest target
  - happy-dom is faster and lighter than jsdom for this minimal use case
  - Live-reload uses `showDirectoryPicker` which Playwright cannot fully mock — spec must skip-or-degrade gracefully (e.g., via feature-detect call)

  **Acceptance Criteria**:
  - [ ] `node -p "require('./package.json').devDependencies.vitest"` outputs version
  - [ ] `node -p "require('./package.json').devDependencies['happy-dom']"` outputs version
  - [ ] `node -p "require('./package.json').scripts.test"` outputs `vitest run`
  - [ ] `vitest.config.js` exists
  - [ ] `tests/unit/matchFiles.test.js` exists with ≥4 tests
  - [ ] `tests/e2e/` contains exactly 5 spec files: visual, drop-match, keyboard, pan, live-reload
  - [ ] `npm run test` exit 0
  - [ ] `npm run test:e2e` exit 0
  - [ ] `npm run build` exit 0
  - [ ] `npm run lint` exit 0
  - [ ] Single commit with message `chore(test): bootstrap vitest and playwright infrastructure`

  **QA Scenarios**:

  ```
  Scenario: matchFiles unit tests cover 3 matching tiers + empty
    Tool: Bash (vitest)
    Preconditions: Wave 4 implementation done
    Steps:
      1. Run `npm run test`
      2. Assert exit 0
      3. Assert output contains "4 passed" (or higher) for matchFiles.test.js
    Expected Result: All 4 cases pass: exact-match, basename-match, fuzzy boundary (0.6 vs 0.59), empty inputs
    Failure Indicators: Any test fails; coverage gaps
    Evidence: .sisyphus/evidence/task-5-vitest-matchfiles.txt

  Scenario: drop-match E2E (happy path)
    Tool: Playwright
    Preconditions: Dev server running; fixtures exist
    Steps:
      1. Open http://localhost:5173
      2. Locate first DropZone input element (input[type=file])
      3. setInputFiles with tests/fixtures/a/pair-1.png
      4. Locate second DropZone input
      5. setInputFiles with tests/fixtures/b/pair-1.png
      6. Wait for compare view to render (look for ReactCompareSlider)
      7. Assert TopBar contains text "pair-1.png"
      8. Assert match count badge shows "1"
    Expected Result: Drop+match flow produces visible compare view with correct metadata
    Failure Indicators: Compare view never appears; wrong filename; wrong count
    Evidence: .sisyphus/evidence/task-5-drop-match.png

  Scenario: keyboard navigation (arrow keys, R, ?)
    Tool: Playwright
    Preconditions: 3 fixture pairs loaded into compare view
    Steps:
      1. Drop 3 fixture pairs into both DropZones
      2. Wait for compare view; assert TopBar shows "pair-1.png"
      3. Press ArrowRight; assert TopBar updates to "pair-2.png"
      4. Press ArrowRight; assert TopBar updates to "pair-3.png"
      5. Press ArrowLeft; assert TopBar back to "pair-2.png"
      6. Press R 4 times; capture axis state changes (look for class change on ReactCompareSlider container or transform)
      7. Press `?`; assert HelpOverlay element visible
      8. Press `?`; assert HelpOverlay hidden
    Expected Result: All keyboard shortcuts function as documented
    Failure Indicators: Navigation stuck; R doesn't cycle; help overlay doesn't toggle
    Evidence: .sisyphus/evidence/task-5-keyboard.txt

  Scenario: spacebar pan (hybrid tap-vs-hold) — REQUIRES ZOOM > 1 FOR OBSERVABILITY
    Tool: Playwright
    Preconditions: Compare view loaded with pair-1; container element located
    Notes: Cursor only switches to 'grab' when `spaceActive && zoom > 1` (CompareViewer.jsx:168). Must zoom first.
    Steps:
      1. Locate compare container: `page.locator('div.relative.w-full.h-full.overflow-hidden').first()`
      2. Hover over center of container
      3. Send Ctrl+wheel to zoom in: `await page.mouse.wheel(0, -300)` while holding Ctrl (use `keyboard.down('Control')` then `mouse.wheel` then `keyboard.up('Control')`)
      4. Assert: container's inline `style.cursor` is `'default'` (zoom > 1 but spaceActive false)
      5. Assert: zoomed inner layer has `transform: ... scale(N)` with N > 1 (read computed style)
      6. Tap Space (down + up within 200ms): `keyboard.press('Space', { delay: 100 })`
      7. Assert: container's `style.cursor` is now `'grab'` (spaceActive=true, zoom>1)
      8. Tap Space again (<300ms after first release): `keyboard.press('Space', { delay: 100 })`
      9. Assert: container's `style.cursor` back to `'default'` (spaceActive=false)
      10. Hold Space (down, wait 500ms, up): `keyboard.down('Space')`; wait 500; `keyboard.up('Space')`
      11. Assert: during hold, `style.cursor` was `'grab'`; after release, `'default'`
    Expected Result: cursor toggles `default ↔ grab` exactly per tap-vs-hold logic
    Failure Indicators: Cursor stays `default` after tap+zoom (tap mode broken); cursor stays `grab` after hold-release (hold mode broken)
    Evidence: .sisyphus/evidence/task-5-pan.txt (with cursor-state log per step) + screenshots at steps 7, 9, 11

  Scenario: live-reload polling actually exercises the polling code path (CRITICAL — covers Metis-flagged React 19 StrictMode interval leak)
    Tool: Playwright (Chromium)
    Preconditions: Wave 4 done; running in Chromium; dev server up
    Notes: Real `showDirectoryPicker` requires user gesture and is unreliable in headless. Strategy: use `page.addInitScript` to inject a stub `window.showDirectoryPicker` BEFORE the app loads, returning a fake `FileSystemDirectoryHandle` whose `values()` async iterator yields a controllable file list per call. This actually triggers `toggleLiveReload` → `setInterval(getNewFiles, 3000)` → real polling code path.
    Steps:
      1. Before page load, inject stub:
         ```js
         await page.addInitScript(() => {
           window.__liveReloadStub = { aFiles: [], bFiles: [], pickCount: 0 };
           const makeHandle = (which) => ({
             kind: 'directory',
             name: `stub-${which}`,
             async *values() {
               const list = which === 'a' ? window.__liveReloadStub.aFiles : window.__liveReloadStub.bFiles;
               for (const entry of list) yield entry;
             },
           });
           window.showDirectoryPicker = async () => {
             const which = window.__liveReloadStub.pickCount++ === 0 ? 'a' : 'b';
             return makeHandle(which);
           };
         });
         ```
      2. Open http://localhost:5173, drop fixtures into both DropZones to enter compare view
      3. Locate "Live" button in TopBar; click it (triggers stubbed `showDirectoryPicker` for both folders)
      4. Assert: button text/state changes to "Live ON" (or equivalent active class)
      5. Capture all `console.error` / `console.warn` messages from this point onward
      6. Wait 7 seconds (covers TWO 3000ms polling intervals → exercises StrictMode-mounted setInterval)
      7. Assert: zero new console errors mentioning "interval", "Maximum update depth", "duplicate", or "memory"
      8. Inject a new file into the stub: `await page.evaluate(() => { window.__liveReloadStub.aFiles.push({ kind:'file', name:'pair-4.png', async getFile(){ return new File([new Uint8Array(8)], 'pair-4.png', {type:'image/png', lastModified: Date.now()}); }}); });`
      9. Wait 4 seconds (next poll tick)
      10. Assert: matched-count badge OR thumbnail ribbon reflects the new file (polling actually picked it up — proves refs work, not just absence of errors)
      11. Click "Live" again to disable; assert state returns to inactive
      12. Wait 4 more seconds; assert: zero new errors (interval was cleaned up properly)
    Expected Result: Polling runs, picks up new files, cleans up on disable; zero StrictMode-related leaks
    Failure Indicators: Console errors; new file never detected (refs broken); errors after disable (cleanup broken); duplicate entries (StrictMode double-mount leak)
    Evidence: .sisyphus/evidence/task-5-live-reload.txt + console-log dump + state snapshots before/after each polling window
  ```

  **Evidence to Capture**:
  - [ ] task-5-vitest-matchfiles.txt
  - [ ] task-5-drop-match.png + .txt
  - [ ] task-5-keyboard.txt
  - [ ] task-5-pan.txt
  - [ ] task-5-live-reload.txt

  **Commit**: YES (Wave 4 commit)
  - Message: `chore(test): bootstrap vitest and playwright infrastructure`
  - Files: `package.json`, `package-lock.json`, `vitest.config.js`, `tests/unit/matchFiles.test.js`, `tests/e2e/drop-match.spec.js`, `tests/e2e/keyboard.spec.js`, `tests/e2e/pan.spec.js`, `tests/e2e/live-reload.spec.js`
  - Pre-commit: `npm run build && npm run lint && npm run test && npm run test:e2e`

- [x] 6. Wave 5: Node Runtime Bump (Docker + GitHub Actions)

  **What to do**:
  - Edit `Dockerfile` line 2: `FROM node:20-alpine AS builder` → `FROM node:22-alpine AS builder`
  - Edit `.github/workflows/deploy.yml` line 28: `node-version: 20` → `node-version: 22`
  - Build Docker image locally: `docker build -t slidedirc:verify .`
  - Smoke test: `docker run --rm -d --name slidedirc-test -p 18080:80 slidedirc:verify && sleep 3 && curl -fsS http://localhost:18080 > /dev/null && docker stop slidedirc-test`
  - Commit

  **Must NOT do**:
  - Modify `nginx.conf`
  - Change anything else in Dockerfile (just the FROM line)
  - Change anything else in deploy.yml (just node-version)
  - Bump nginx:alpine version (out of scope)
  - Touch docker-compose.yml unless absolutely required

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2 lines changed in 2 files + Docker smoke test. <30 min.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 5)
  - **Blocks**: F1–F4
  - **Blocked By**: Task 5

  **References**:

  **Pattern References**:
  - `Dockerfile:2` — line to change
  - `.github/workflows/deploy.yml:28` — line to change

  **External References**:
  - Vite 7 Node requirement: `https://vite.dev/guide/` (20.19+ / 22.12+)

  **WHY Each Reference Matters**:
  - Wave 1's Vite 7 already runs on whatever Node the dev environment provides; this wave aligns Docker + CI to LTS Node 22 to match recommended runtime

  **Acceptance Criteria**:
  - [ ] `grep -q 'FROM node:22-alpine' Dockerfile`
  - [ ] `grep -qE "node-version: ['\"]?22['\"]?" .github/workflows/deploy.yml`
  - [ ] `docker build -t slidedirc:verify .` exit 0
  - [ ] Container starts and serves on configured port
  - [ ] `npm run build && npm run lint && npm run test && npm run test:e2e` all exit 0 (no regressions)
  - [ ] Single commit with message `chore(deploy): upgrade node runtime to 22 in docker and ci`

  **QA Scenarios**:

  ```
  Scenario: Docker build succeeds with Node 22 base
    Tool: Bash
    Preconditions: Wave 5 implementation done; Docker daemon running
    Steps:
      1. Run `docker build -t slidedirc:verify .`
      2. Assert exit code 0
      3. Run `docker images slidedirc:verify --format '{{.Repository}}'`
      4. Assert output contains "slidedirc"
    Expected Result: Multi-stage build completes; image tagged
    Failure Indicators: Build error; missing image
    Evidence: .sisyphus/evidence/task-6-docker-build.txt

  Scenario: Container serves index.html on configured port
    Tool: Bash
    Preconditions: Docker image built
    Steps:
      1. Run `docker run --rm -d --name slidedirc-smoke -p 18080:80 slidedirc:verify`
      2. Sleep 3
      3. Run `curl -fsS http://localhost:18080`
      4. Assert exit code 0
      5. Assert output contains `<div id="root">`
      6. Run `docker stop slidedirc-smoke`
    Expected Result: nginx serves built SPA
    Failure Indicators: curl fails; missing root div
    Evidence: .sisyphus/evidence/task-6-docker-smoke.txt

  Scenario: GitHub Actions workflow references Node 22 and is structurally intact
    Tool: Bash
    Preconditions: deploy.yml edited
    Notes: No PyYAML dependency — use repo-native tools (node + grep) only.
    Steps:
      1. Run `grep -qE "node-version: ['\"]?22['\"]?" .github/workflows/deploy.yml && echo "NODE22-OK"`
      2. Assert output `NODE22-OK`
      3. Structural sanity check via Node (no external deps): run
         `node -e "const t=require('fs').readFileSync('.github/workflows/deploy.yml','utf8'); const required=['name:','on:','jobs:','runs-on:','steps:','actions/setup-node']; const missing=required.filter(k=>!t.includes(k)); if(missing.length){console.error('MISSING:',missing);process.exit(1);} console.log('STRUCTURE-OK');"`
      4. Assert exit code 0 and output contains `STRUCTURE-OK`
      5. Indentation sanity: run
         `node -e "const lines=require('fs').readFileSync('.github/workflows/deploy.yml','utf8').split('\n'); const tabs=lines.findIndex(l=>l.includes('\t')); if(tabs>=0){console.error('TAB at line',tabs+1);process.exit(1);} console.log('NO-TABS');"`
      6. Assert exit 0 and output `NO-TABS` (YAML forbids tabs for indentation)
      7. Optional GitHub-side validation: `gh workflow view deploy.yml --repo "$(git config --get remote.origin.url | sed -E 's#.*[:/]([^/]+/[^/.]+)(\.git)?#\1#')" 2>/dev/null || echo "gh-skip (offline or no auth)"` — informational, never fails the scenario
    Expected Result: Node 22 referenced; required workflow keys present; no tab characters
    Failure Indicators: Missing required keys; tab indentation; wrong Node version
    Evidence: .sisyphus/evidence/task-6-actions-yaml.txt
  ```

  **Evidence to Capture**:
  - [ ] task-6-docker-build.txt
  - [ ] task-6-docker-smoke.txt
  - [ ] task-6-actions-yaml.txt

  **Commit**: YES (Wave 5 commit)
  - Message: `chore(deploy): upgrade node runtime to 22 in docker and ci`
  - Files: `Dockerfile`, `.github/workflows/deploy.yml`
  - Pre-commit: `docker build -t slidedirc:test .`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
>
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback → fix → re-run → present again → wait for okay.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read `.sisyphus/plans/dependency-migration.md` end-to-end. For each "Must Have": verify implementation exists (read package.json, run `node -p "..."` assertions, grep configs, build the app). For each "Must NOT Have": grep codebase for forbidden patterns — reject with file:line if found (e.g., search for `.tsx`, `tsconfig`, `--legacy-peer-deps` in scripts, `husky`, `dependabot`, custom Tailwind plugins). Check evidence files exist in `.sisyphus/evidence/`. Verify each of the 6 wave commits exists in git log with correct message format.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [6/6] | Wave Commits [6/6] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build`, `npm run lint`, `npm run test`, `npm run test:e2e` from clean state (`rm -rf node_modules dist && npm ci`). Review changed config files (vite.config.js, eslint.config.js, vitest.config.js, playwright.config.js) for: `as any` (N/A — JS), commented-out code, `console.log` left in, dead imports, unused dependencies in package.json. Verify no `--legacy-peer-deps` or `--force` in committed scripts. Confirm `package.json` `overrides` block is well-formed.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Vitest [N pass/N fail] | Playwright [N pass/N fail] | Configs [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state (`rm -rf node_modules && npm ci && npm run dev` in background). Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence in `.sisyphus/evidence/final-qa/`. Verify all 7 critical AGENTS.md behaviors:
    1. Blob-URL lifecycle (drop folder A, then drop different folder A again — old blobs revoked)
    2. cancelled-flag in TopBar (rapid arrow-key spam — no setState-on-unmount warnings)
    3. folderARef/folderBRef polling (Live mode — no duplicate entries)
    4. key={axisMode} remount (R cycles — slider handle resets)
    5. transformOrigin '0 0' zoom (Ctrl+scroll on image edges — zoom anchored to cursor)
    6. Spacebar tap-vs-hold (both modes work)
    7. Wheel routing (plain scroll = nav; Ctrl+scroll = zoom)
  Test cross-task integration (drop → navigate → zoom → reset → drop again). Test edge cases: empty folders, single-image folders, mismatched folders.
  Output: `QA Scenarios [N/N pass] | Critical Behaviors [7/7 verified] | Integration [N/N] | Edge Cases [N tested] | Visual Diff [≤2%] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do" section, read actual git diff (`git log --all --oneline` to find each wave commit, `git diff <wave-commit>~1 <wave-commit>`). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Specifically check:
    - No new source files outside `tests/` directory
    - No `.tsx` / `tsconfig.json` / TypeScript anywhere
    - `tailwind.config.js` and `postcss.config.js` actually deleted (not just emptied)
    - `autoprefixer` actually removed from package.json
    - `package.json` `overrides` exists for react/react-dom only (not other packages)
    - No new files in `src/**` (existing 13 source files unchanged in count)
    - No husky/.husky/.lintstagedrc/dependabot.yml/renovate.json
    - Cross-task contamination: each wave commit only touches files declared in its Commit section
  Detect unaccounted changes: any file modified that isn't in any wave's expected file list.
  Output: `Tasks [6/6 compliant] | File Count Δ [tracked] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

### Per-Wave Commits (Conventional Commits, German project uses English commit messages per git log style)

- **Wave 0**: `chore(test): capture pre-migration visual baselines`
  - Files: `package.json`, `package-lock.json`, `playwright.config.js`, `tests/fixtures/**`, `tests/e2e/visual.spec.js`, `tests/e2e/visual.spec.js-snapshots/**`
  - Pre-commit: `npm run build && npm run test:e2e`

- **Wave 1**: `chore(deps): upgrade vite to 7.x and plugin-react to 5.x`
  - Files: `package.json`, `package-lock.json`
  - Pre-commit: `npm run build && npm run lint && npm run test:e2e`

- **Wave 2**: `chore(deps): upgrade react to 19.x with peer-dep overrides`
  - Files: `package.json`, `package-lock.json`, `eslint.config.js`
  - Pre-commit: `npm run build && npm run lint && npm run test:e2e`

- **Wave 3**: `chore(deps): upgrade tailwindcss to 4.x with css-first config`
  - Files: `package.json`, `package-lock.json`, `vite.config.js`, `src/index.css`, deleted: `postcss.config.js`, `tailwind.config.js`
  - Pre-commit: `npm run build && npm run lint && npm run test:e2e` (visual-diff threshold ≤ 2%)

- **Wave 4**: `chore(test): bootstrap vitest and playwright infrastructure`
  - Files: `package.json`, `package-lock.json`, `vitest.config.js`, `tests/unit/matchFiles.test.js`, `tests/e2e/drop-match.spec.js`, `tests/e2e/keyboard.spec.js`, `tests/e2e/pan.spec.js`, `tests/e2e/live-reload.spec.js`
  - Pre-commit: `npm run build && npm run lint && npm run test && npm run test:e2e`

- **Wave 5**: `chore(deploy): upgrade node runtime to 22 in docker and ci`
  - Files: `Dockerfile`, `.github/workflows/deploy.yml`
  - Pre-commit: `docker build -t slidedirc:test . && docker run --rm slidedirc:test nginx -t`

---

## Success Criteria

### Verification Commands
```bash
# Version assertions
node -p "require('./package.json').dependencies.react"               # Expected: ^19.x.x
node -p "require('./package.json').dependencies['react-dom']"        # Expected: ^19.x.x
node -p "require('./package.json').devDependencies.vite"             # Expected: ^7.x.x
node -p "require('./package.json').devDependencies.tailwindcss"      # Expected: ^4.x.x
node -p "require('./package.json').devDependencies['@vitejs/plugin-react']"  # Expected: ^5.x.x
node -p "require('./package.json').devDependencies['@types/react']"  # Expected: ^19.x.x
node -p "require('./package.json').devDependencies.vitest"           # Expected: present
node -p "require('./package.json').devDependencies['@playwright/test']"  # Expected: present

# File-state assertions
test ! -f postcss.config.js && echo "OK: postcss.config removed"
test ! -f tailwind.config.js && echo "OK: tailwind.config removed"
grep -q '@import "tailwindcss"' src/index.css && echo "OK: v4 import"
grep -q 'FROM node:22' Dockerfile && echo "OK: Dockerfile Node 22"
grep -q "node-version: '22'\|node-version: 22" .github/workflows/deploy.yml && echo "OK: Actions Node 22"
grep -q '"overrides"' package.json && echo "OK: peer-dep overrides present"

# Functional gates
npm run build         # Expected: exit 0
npm run lint          # Expected: exit 0
npm run test          # Expected: exit 0 (Vitest)
npm run test:e2e      # Expected: exit 0 (Playwright incl. visual-diff)
npm outdated          # Expected: empty output (or only dev-only patches)

# Docker smoke
docker build -t slidedirc:verify .   # Expected: exit 0
```

### Final Checklist
- [ ] All "Must Have" present (verified by F1)
- [ ] All "Must NOT Have" absent (verified by F1 + F4)
- [ ] All Playwright tests pass (verified by F3)
- [ ] Visual diff against Wave 0 baselines ≤ 2% pixel ratio (verified by F3)
- [ ] All 7 critical behaviors from AGENTS.md verified working (verified by F3 specs)
- [ ] One commit per wave, all bisect-able (verified by F4)
- [ ] No TypeScript files introduced (verified by F4)
- [ ] No new dev tooling beyond test infra (verified by F4)
- [ ] User explicit approval received
