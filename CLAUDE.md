# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal CV/portfolio website built as a modern Vue 3 single-page application (SPA) showcasing professional experience and skills for Meysam Azad, a technical engineer breaking into the indiehacker space. The site is deployed to GitHub Pages with automated CI/CD.

**Tech Stack:**

- Vue 3 (Composition API via `<script setup>`)
- Vite build tool with extensive optimization plugins
- TailwindCSS for styling with custom theme configuration
- Bun as the JavaScript runtime and package manager
- PWA capabilities with service worker
- XLSX library for Excel file processing

## Development Commands

### Start Development Server

```bash
bun start
# Runs Vite dev server on http://localhost:3000
# Hot module replacement (HMR) enabled
```

### Build for Production

```bash
bun run build
# Compiles and minifies for production
# Output directory: dist/
# Includes bundle visualization at dist/stats.html
# Generates gzip and brotli compressed assets
```

### Install Dependencies

```bash
bun install
```

### Linting

```bash
# Linting is handled via pre-commit hooks using oxlint
# Config: .oxlintrc.json
# Run pre-commit manually:
pre-commit run --all-files
```

## Architecture & Structure

### Component Structure

- **Single-file Vue component**: `src/App.vue` contains the entire application UI
  - Hero header with theme toggle and PWA install prompt
  - Professional summary section
  - Experience timeline
  - Contact section
  - Floating navigation dots for smooth scrolling

### Data Layer

- `src/data/candidate.js`: Centralized candidate information (contact, badges, summary, competencies, experience, education, projects)
- `src/data/config.js`: Application configuration constants
- Data is exported as plain JavaScript objects (not reactive stores)

### Utilities

- `src/utils/xlsxProcessor.js`: XLSX file processing for resume data extraction
  - Handles base64 encoded Excel files
  - Auto-detects header rows
  - Converts to CSV format

### Entry Point

- `src/main.js`: Application initialization with error handling, service worker registration, and performance monitoring
- Uses `loglevel` for logging (debug in dev, warn in production)
- Defers non-critical work (service worker) using `requestIdleCallback`

### Build Configuration (`vite.config.js`)

- **Aliases**: `@` → `src/`, `~` → `node_modules/`
- **Code splitting strategy**:
  - `vue-vendor`: Vue core libraries
  - `excel-libs`: XLSX processing libraries
  - `router`: Vue Router
  - `vendor`: Other node_modules
- **Optimization**:
  - Console statements dropped in production
  - Terser minification with aggressive compression
  - Bundle size warning at 1000kb
  - Asset inlining up to 4kb
- **Production-only plugins**:
  - Gzip and Brotli compression
  - PWA service worker generation
  - Bundle size visualization
- **Dev server**: Port 3000 with CORS enabled

### Styling

- TailwindCSS with custom configuration (`tailwind.config.js`)
- Dark mode support via `class` strategy
- Custom color palette and screen breakpoints
- Print-specific styles available
- Additional Tailwind plugins:
  - `@tailwindcss/typography`
  - `@tailwindcss/forms`
  - `@tailwindcss/aspect-ratio`
  - `@tailwindcss/container-queries`
- Main styles in `src/style.css`

### Pre-commit Hooks

The project uses extensive pre-commit hooks (`.pre-commit-config.yaml`):

- **JavaScript**: oxlint for fast linting
- **Standard checks**: JSON, YAML, trailing whitespace, large files, private keys
- **Git workflow**: Conventional commits via commitlint
- **Go support**: go-fmt, go-imports, go-mod-tidy (for potential Go tooling)
- **GitHub Actions**: actionlint validation
- **Docker**: dockerfmt formatting

## Important Development Notes

### SEO & Metadata

- Comprehensive meta tags in `index.html` for Open Graph, Twitter Cards, and structured data
- Schema.org Person type structured data for better search indexing
- Optimized for social media sharing with custom images

### Performance Optimizations

- Font preloading and DNS prefetching for Google Fonts
- Resource hints for critical assets
- Service worker for offline capability
- Image compression (compressed variants in `public/`)
- Code splitting by vendor and feature
- Lazy loading via dynamic imports where applicable

### PWA Features

- Installable as a standalone app
- Service worker with auto-update (`public/sw.js`)
- Web manifest (`public/site.webmanifest`)
- Multiple favicon sizes and Apple touch icon

### State Management

- No dedicated state management library (Vuex/Pinia)
- Component state managed via Vue's reactive system
- Global data imported directly from `src/data/` modules

### Build Artifacts

- Production build outputs to `dist/`
- Bundle analysis report: `dist/stats.html`
- Assets organized by type: `js/`, `img/`, `css/`
- Hashed filenames for cache busting

## CI/CD

The `.github/workflows/ci.yml` workflow:

1. Runs on push to `main`, manual dispatch, and daily schedule
2. Uses Bun for dependency management and builds
3. Caches `node_modules` for faster builds
4. Deploys to GitHub Pages automatically
5. Artifact uploaded from `dist/` directory

**GitHub Pages URL**: <https://meysam.io>

## Making Changes

### Adding New Sections to CV

1. Update candidate data in `src/data/candidate.js`
2. Modify `src/App.vue` template to display the new section
3. Add corresponding navigation dot if needed

### Updating Styling

- Tailwind classes can be used directly in Vue templates
- Custom styles go in `src/style.css`
- Dark mode styles use Tailwind's dark mode classes

### Adding New Dependencies

```bash
bun add <package-name>
# For dev dependencies:
bun add -d <package-name>
```

### Testing Locally Before Deploy

1. Build production version: `bun run build`
2. Preview build: `bun run preview`
3. Test PWA install prompt and offline functionality

### Debugging Build Issues

- Check bundle sizes: Open `dist/stats.html` after build
- Verify assets are compressed: Look for `.gz` and `.br` files in `dist/`
- Test production build locally before pushing

## Code Quality

- **Linting**: Oxlint with strict rules (`.oxlintrc.json`)
- **Commit messages**: Must follow Conventional Commits format
- **Pre-commit**: All hooks must pass before commits are allowed
