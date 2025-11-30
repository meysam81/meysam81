# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal landing page and blog built with Astro v5, featuring a modern design focused on newsletter conversions, project showcasing, and content publishing. The site includes a full-featured blogging system with MDX support, search functionality, comments, and analytics. It is optimized for performance (Lighthouse 95+), SEO, accessibility (WCAG 2.1 AA), and LLM discoverability.

## Development Commands

### Package Manager

This project uses **bun** as the package manager. All commands should use `bun` instead of `npm` or `pnpm`.

### Common Commands

```bash
# Development server (runs on http://localhost:3000)
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
- **Content**: MDX for blog posts with Content Collections
- **Styling**: Vanilla CSS with CSS variables, Lightning CSS transformer
- **TypeScript**: Base configuration (strict mode disabled for flexibility)
- **Build Tool**: Astro's built-in Vite-based bundler with Brotli compression
- **Search**: Pagefind (client-side full-text search)
- **Comments**: Giscus (GitHub-based discussions)
- **Analytics**: Pirsch (privacy-focused analytics)
- **Linting**: oxlint (fast Rust-based linter)

### Key Configuration

#### Astro Config (`astro.config.mjs`)

- Site URL: `https://meysam.io`
- Path alias: `@` maps to `/src`
- Inlined stylesheets for performance
- HTML compression enabled
- Prefetch strategy: viewport-based prefetching enabled
- Image service: Sharp with remote pattern support
- CSS: Lightning CSS transformer with code splitting
- Build optimizations: Brotli compression, manual chunk separation

**Integrations:**

- `@astrojs/mdx` - MDX support for blog posts
- `@astrojs/sitemap` - Auto-generated sitemap
- `astro-expressive-code` - Syntax highlighting with line numbers
- `@playform/compress` - Asset compression

#### TypeScript Config

- Extends `astro/tsconfigs/base`
- Strict mode disabled for flexibility
- JSX configured for React (though not actively used in components)

#### Oxlint Config (`.oxlintrc.json`)

- Extremely comprehensive linting rules (330+ rules configured)
- Import cycle detection enabled
- Console statements denied (use `loglevel` for logging)
- Most correctness rules disabled (category: "off")

### Project Structure

```
src/
├── components/
│   ├── Header.astro         # Sticky navigation bar
│   ├── Footer.astro         # Site footer with links
│   ├── Newsletter.astro     # Email capture form component
│   ├── ContentCard.astro    # Reusable card for projects and blog posts
│   ├── SearchBox.astro      # Full-text search using Pagefind
│   ├── TableOfContents.astro # Auto-generated TOC for blog posts
│   ├── Webmentions.astro    # Webmentions integration (likes, reposts, replies)
│   ├── CopyButton.astro     # Copy-to-clipboard functionality
│   ├── SeriesBanner.astro   # Banner showing series context on posts
│   └── SeriesNav.astro      # Prev/next navigation within a series
├── content/
│   └── blog/                # MDX blog posts
│       └── *.mdx            # Individual blog post files
├── layouts/
│   ├── BaseLayout.astro     # Base layout with SEO, meta tags, structured data
│   └── BlogPostLayout.astro # Specialized layout for blog posts
├── pages/
│   ├── index.astro          # Homepage (hero, about, projects, newsletter)
│   ├── links.astro          # Links page (sponsorships, referrals, social)
│   ├── 404.astro            # Custom 404 page
│   └── blog/
│       ├── index.astro      # Blog listing with featured posts and search
│       ├── [...slug].astro  # Dynamic blog post pages
│       ├── tags/
│       │   └── [tag].astro  # Tag-based post filtering
│       └── series/
│           └── [slug].astro # Series landing pages
├── utils/
│   ├── blog.ts              # filterPublishedPosts() function
│   ├── pirsch.ts            # Pirsch analytics integration
│   ├── reading-time.ts      # calculateReadingTime() function
│   ├── series.ts            # Series helper functions (getSeriesInfo, getAllSeries)
│   └── slug.ts              # slugify() function
├── styles/
│   └── global.css           # Global styles and CSS variables
├── content.config.ts        # Content Collections schema
└── main.js                  # Loglevel initialization

public/
├── favicon.svg              # Source SVG for favicons
├── og-image*.svg            # Source SVGs for Open Graph images
├── profile-image.svg        # Source SVG for profile/avatar
├── logo-*.svg               # Brand assets
├── *.png                    # Generated PNGs from SVGs (via convert:images)
└── robots.txt               # Search engine directives

scripts/
└── convert-svgs.js          # Utility to generate PNG assets from SVGs
```

### Content Collections

Blog posts use Astro Content Collections with the following schema (`src/content.config.ts`):

```typescript
{
  title: string;          // Post title (required)
  description: string;    // Post description (required)
  pubDate: Date;          // Publication date (required)
  updatedDate?: Date;     // Last update date
  author?: string;        // Author name (default: "Meysam Azad")
  tags?: string[];        // Post tags for categorization
  draft?: boolean;        // Draft posts are excluded from production
  featured?: boolean;     // Featured posts appear in special section
  ogImage?: string;       // Custom Open Graph image
  slug?: string;          // Custom URL slug
  series?: string;        // Series name (e.g., "Customer Discovery Journey")
  seriesOrder?: number;   // Order within series (1, 2, 3...)
  references?: Array<{    // Further reading/citations
    title: string;
    url: string;
    description?: string;
  }>;
}
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

#### BlogPostLayout.astro

Specialized layout for blog posts. Features:

- Reading time calculation
- Post metadata display (dates, author, tags)
- Table of contents with scroll-spy
- Clickable heading permalinks
- Image zoom on click (medium-zoom)
- Giscus comments integration
- Webmentions display (likes, reposts, replies)
- References/Further Reading section
- Pirsch page view counts
- Series banner and navigation (when post is part of a series)

#### SeriesBanner.astro

Displays at the top of posts that are part of a series. Shows:

- Series name with link to series landing page
- Position indicator (e.g., "Part 2 of 4")

#### SeriesNav.astro

Navigation component for series posts. Displays:

- Series name with link to landing page
- Previous post link (if exists)
- Next post link (if exists)
- Position indicator (1 / 4)

#### Header.astro

Sticky navigation component positioned at the top. Main content has 80px top padding to account for the fixed header.

#### Newsletter.astro

Reusable email signup component. Form action points to newsletter signup endpoint.

#### ContentCard.astro

Reusable component for displaying content items (projects, blog posts, etc). Used on homepage and blog listing page.

#### SearchBox.astro

Client-side full-text search powered by Pagefind. Features debounced input and result excerpts.

#### TableOfContents.astro

Auto-generated table of contents for blog posts with scroll-spy functionality to highlight current section.

#### Webmentions.astro

Displays webmentions from webmention.io including likes, reposts, and replies.

### Styling Approach

Global styles are defined in `src/styles/global.css` using CSS variables:

- Dark theme focused (Apple-inspired aesthetic)
- CSS variables for colors: `--color-bg`, `--color-accent`, `--color-success`, etc.
- System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI'...`
- No CSS frameworks or preprocessors
- Responsive, mobile-first design
- Lightning CSS for modern CSS transforms

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

### Adding Blog Posts

Create a new MDX file in `src/content/blog/` with frontmatter:

```mdx
---
title: "Post Title"
description: "Post description for SEO and previews"
pubDate: 2024-01-15
tags: ["tag1", "tag2"]
featured: false
draft: false
references:
  - title: "Reference Title"
    url: "https://example.com"
---

Your content here...
```

Blog posts support:

- MDX components and expressions
- Code blocks with syntax highlighting and line numbers (via Expressive Code)
- Auto-generated heading anchors
- Image optimization
- Series grouping (see below)

### Adding Posts to a Series

To group posts into a series, add the `series` and `seriesOrder` fields to the frontmatter:

```mdx
---
title: "Part 1: Getting Started"
description: "First post in the series"
pubDate: 2024-01-15
series: "Customer Discovery Journey"
seriesOrder: 1
---
```

When a post is part of a series:

- A banner appears at the top showing series context
- Navigation appears after the content with prev/next links
- A dedicated landing page is auto-generated at `/blog/series/[slug]`

### Adding/Updating Projects

Edit the projects array in `src/pages/index.astro` (look for the Projects Section). Uses the `ContentCard` component.

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

## Third-Party Integrations

### Giscus (Comments)

GitHub-based comment system integrated in BlogPostLayout. Configured to use GitHub Discussions for storing comments.

### Webmention.io

Webmentions integration for receiving likes, reposts, and replies from the IndieWeb. Displayed via the Webmentions component.

### Pirsch Analytics

Privacy-focused analytics for tracking page views. Environment variables:

- `PIRSCH_CLIENT_ID`
- `PIRSCH_CLIENT_SECRET`
- `PIRSCH_HOSTNAME`

### Pagefind

Client-side full-text search engine. Index is built automatically during the Astro build process and served as static files.

## SEO & Performance Features

The site includes comprehensive SEO optimizations:

- Semantic HTML5 structure
- Complete meta tag coverage (title, description, keywords)
- Open Graph and Twitter Card tags
- JSON-LD structured data (Person schema)
- Auto-generated sitemap.xml
- RSS feed for blog posts
- robots.txt configuration
- Canonical URLs
- Performance optimizations for Core Web Vitals

Target metrics:

- Lighthouse Performance: 95+
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Cumulative Layout Shift: <0.1

## Deployment

The site is deployed via GitHub Actions (`.github/workflows/ci.yml`):

### Production Deployment (GitHub Pages)

- **Triggers**: Pushes to `main` branch, manual dispatch, daily schedule (midnight UTC)
- **Target**: GitHub Pages
- **Process**:
  - Uses `bun` for dependency management
  - Runs `bun run build` (includes type checking via `astro check`)
  - Uploads artifact to GitHub Pages
  - Deploys to production environment
- **Environment Variables**: `PIRSCH_CLIENT_ID`, `PIRSCH_CLIENT_SECRET` (analytics)

### Preview Deployment (Netlify)

- **Triggers**: Pull requests
- **Target**: Netlify (temporary preview URLs)
- **Process**:
  - Builds the site with the same production build command
  - Deploys to Netlify using `netlify-cli@v23`
  - Posts preview URL as a comment on the PR
- **Environment Variables**: `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`
- **PR Comment**: Automated comment with live preview link using `meysam81/comment-pr@main`

### Build Configuration

- Build output: `dist/` directory (static files)
- Node modules caching: Speeds up builds by caching `node_modules` based on `bun.lock`
- Concurrency control: Cancels in-progress runs when new commits are pushed to the same ref

## Development Notes

### Linting

- Oxlint is very strict (330+ rules)
- `console` statements are denied - use `loglevel` for logging
- Import cycles are denied
- Most TypeScript type checking happens at build time via `astro check`

### Logging

Use `loglevel` instead of `console` for logging. Initialize via `src/main.js`.

### Path Aliases

Use `@` to reference `src/`:

```typescript
import Header from "@/components/Header.astro";
import "@/styles/global.css";
```

### Browser Support

Latest versions of Chrome, Firefox, Safari, and Edge.
