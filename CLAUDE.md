# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal landing page built with Astro v5, featuring a modern design focused on newsletter conversions and project showcasing. The site is optimized for performance (Lighthouse 95+), SEO, accessibility (WCAG 2.1 AA), and LLM discoverability.

## Development Commands

### Package Manager

This project uses **bun** as the package manager. All commands should use `bun` instead of `npm` or `pnpm`.

### Common Commands

```bash
# Development server (runs on http://localhost:4321)
bun start

# Type checking and production build
bun run build

# Convert SVG assets to PNG (various sizes for OG images, favicons, logos)
bun run convert:images

# Linting
bunx oxlint@latest --fix --fix-suggestions
bunx prettier@latest -w .
```

### Pre-commit Hooks

The repository uses pre-commit hooks configured in `.pre-commit-config.yaml`:

- `oxlint` for JavaScript/TypeScript linting
- Standard pre-commit hooks (trailing whitespace, file size checks, etc.)
- `commitlint` for conventional commit messages
- Go-related hooks (for potential Go scripts)
- `actionlint` for GitHub Actions validation

## Architecture

### Technology Stack

- **Framework**: Astro v5 (static site generator)
- **Styling**: Vanilla CSS with CSS variables (no frameworks)
- **TypeScript**: Strict mode enabled
- **Build Tool**: Astro's built-in Vite-based bundler
- **Linting**: oxlint (fast Rust-based linter)

### Key Configuration

#### Astro Config (`astro.config.mjs`)

- Site URL: `https://meysam.io`
- Path alias: `@` maps to `/src`
- Inlined stylesheets for performance
- HTML compression enabled

#### TypeScript Config

- Extends `astro/tsconfigs/strict`
- JSX configured for React (though not actively used in components)

#### Oxlint Config (`.oxlintrc.json`)

- Extremely comprehensive linting rules (330+ rules configured)
- Import cycle detection enabled
- Console statements denied (use logging utilities)
- Most correctness rules disabled (category: "off")

### Project Structure

```
src/
├── components/
│   ├── Header.astro       # Sticky navigation bar
│   ├── Footer.astro       # Site footer with links
│   ├── Newsletter.astro   # Email capture form component
│   └── ProjectCard.astro  # Reusable card for projects
├── layouts/
│   └── BaseLayout.astro   # Base layout with SEO, meta tags, structured data
├── pages/
│   ├── index.astro        # Homepage (hero, about, projects, newsletter)
│   ├── links.astro        # Links page (sponsorships, referrals, social)
│   └── 404.astro          # Custom 404 page
└── styles/
    └── global.css         # Global styles and CSS variables

public/
├── favicon.svg            # Source SVG for favicons
├── og-image*.svg          # Source SVGs for Open Graph images
├── profile-image.svg      # Source SVG for profile/avatar
├── logo-*.svg             # Brand assets
├── *.png                  # Generated PNGs from SVGs (via convert:images)
└── robots.txt             # Search engine directives

scripts/
└── convert-svgs.js        # Utility to generate PNG assets from SVGs
```

### Component Architecture

#### BaseLayout.astro

The foundation of all pages. Provides:

- SEO meta tags (title, description, keywords)
- Open Graph and Twitter Card tags
- JSON-LD structured data (Person schema)
- Performance optimizations (preconnect, dns-prefetch)
- Smooth scroll behavior for anchor links
- Responsive header spacing (80px top padding)

Props interface:

```typescript
interface Props {
  title?: string;
  description?: string;
  ogImage?: string;
}
```

Default values are defined in the layout - override them per-page as needed.

#### Header.astro

Sticky navigation component positioned at the top. Main content has 80px top padding to account for the fixed header.

#### Newsletter.astro

Reusable email signup component. Form action points to newsletter signup endpoint.

#### ProjectCard.astro

Reusable component for displaying projects. Used on homepage.

### Styling Approach

Global styles are defined in `src/styles/global.css` using CSS variables:

- Dark theme focused (Apple-inspired aesthetic)
- CSS variables for colors: `--color-bg`, `--color-accent`, etc.
- System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI'...`
- No CSS frameworks or preprocessors
- Responsive, mobile-first design

Component-scoped styles use Astro's scoped `<style>` tags.

### Asset Pipeline

SVG source files in `public/` are converted to PNG using `bun run convert:images`:

- OG images: 1200x630
- Profile images: multiple sizes (256, 512, 1000)
- Favicons: 32, 180, 192, 512
- Logos: various sizes
- Banner: 1280x640

The conversion script (`scripts/convert-svgs.js`) uses Sharp library for image processing.

## Content Updates

### Adding/Updating Projects

Edit the projects array in `src/pages/index.astro` (look for the Projects Section).

### Updating Links

Edit the links object in `src/pages/links.astro`:

```javascript
const links = {
  support: [...],
  crypto: [...],
  // etc.
};
```

### Updating SEO Metadata

Default values are in `src/layouts/BaseLayout.astro`. Override per-page by passing props:

```astro
<BaseLayout
  title="Custom Title"
  description="Custom description"
  ogImage="https://meysam.io/custom-og-image.png"
>
```

### Newsletter Form

Update form action in `src/components/Newsletter.astro` to point to your newsletter signup endpoint.

## SEO & Performance Features

The site includes comprehensive SEO optimizations:

- Semantic HTML5 structure
- Complete meta tag coverage (title, description, keywords)
- Open Graph and Twitter Card tags
- JSON-LD structured data (Person schema)
- Auto-generated sitemap.xml
- robots.txt configuration
- Canonical URLs
- Performance optimizations for Core Web Vitals

Target metrics:

- Lighthouse Performance: 95+
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Cumulative Layout Shift: <0.1

## Deployment

The site is deployed via GitHub Actions (`.github/workflows/*.yml`):

- Triggers: pushes to `main`, manual dispatch, daily schedule
- Uses `bun` for dependency management
- Runs `bun run build` (includes type checking)
- Deploys to GitHub Pages

Build output: `dist/` directory (static files)

## Development Notes

### Linting

- Oxlint is very strict (330+ rules)
- `console` statements are denied - use `loglevel` for logging
- Import cycles are denied
- Most TypeScript type checking happens at build time via `astro check`

### Type Safety

- TypeScript strict mode enabled
- Type checking runs before every build (`astro check && astro build`)
- Props interfaces defined for all components accepting props

### Path Aliases

Use `@` to reference `src/`:

```typescript
import Header from "@/components/Header.astro";
import "@/styles/global.css";
```

### Browser Support

Latest versions of Chrome, Firefox, Safari, and Edge.
