# CLAUDE.md

Astro v5 personal blog and landing page at `https://meysam.io`. MDX blog with search (Pagefind), comments (Giscus), and analytics (Pirsch).

## Critical Rules

- **Package manager**: Use `bun` exclusively (not npm/pnpm/yarn)
- **No console statements**: Use `loglevel` instead - oxlint denies `console.*`
- **Path aliases**: Always use `@/` for src imports: `import X from "@/components/X.astro"`
- **Styling**: Tailwind v4 with design tokens in `src/styles/theme.css`

## Commands

```bash
bun start                              # Dev server at localhost:3000
bun run build                          # Type check + production build
bun run convert:images                 # SVG to PNG conversion
bunx oxlint@latest --fix --fix-suggestions  # Lint
bunx prettier@latest -w .              # Format
```

## Project Structure

```
src/
├── components/          # Astro components (Header, Footer, Newsletter, ContentCard, etc.)
│   ├── ui/              # Reusable UI components (Button, Card, Input, Badge, Section)
│   └── vue/             # Vue components for interactivity
│       └── tools/       # Vue tool page components
├── composables/         # Vue composables (useScrollLock, useLogger, useScrollPercentage)
├── content/blog/*.mdx   # Blog posts with frontmatter
├── layouts/             # BaseLayout.astro, BlogPostLayout.astro
├── pages/               # index.astro, links.astro, 404.astro, blog/
├── utils/               # blog.ts, reading-time.ts, series.ts, slug.ts, pirsch.ts
├── styles/theme.css     # Tailwind v4 design tokens and global styles
└── content.config.ts    # Content Collections schema
public/                  # Static assets (SVGs, PNGs, robots.txt)
scripts/convert-svgs.js  # Asset conversion utility
```

## Blog Post Frontmatter

```yaml
title: string # Required
description: string # Required
pubDate: Date # Required
updatedDate?: Date
author?: string # Default: "Meysam Azad"
tags?: string[]
draft?: boolean # Excluded from production if true
featured?: boolean # Shows in featured section
ogImage?: string
slug?: string # Custom URL slug
series?: string # Series name for grouping
seriesOrder?: number # Position in series (1, 2, 3...)
references?: Array<{title, url, description?}> # External links
relatedPosts?: string[] # Slugs of related internal posts
```

## Common Tasks

**Add blog post**: Create `src/content/blog/post-name.mdx` with frontmatter above

**Add to series**: Include `series: "Series Name"` and `seriesOrder: N` in frontmatter

**Update projects**: Edit projects array in `src/pages/index.astro` (Projects Section)

**Update links**: Edit links object in `src/pages/links.astro`

**Override SEO**: Pass `title`, `description`, `ogImage` props to `BaseLayout`

## Key Patterns

- Dark theme with Apple-inspired aesthetic
- Mobile-first responsive design
- 80px top padding accounts for sticky header
- Expressive Code for syntax highlighting with line numbers
- Content Collections for type-safe blog content
- Lightning CSS transformer for modern CSS

## Linting

Oxlint is strict (330+ rules). Key restrictions:

- Import cycles denied
- Console statements denied
- Type checking via `astro check` at build time

## Pre-commit Hooks

Configured in `.pre-commit-config.yaml`: oxlint, prettier, commitlint (conventional commits), actionlint

## Environment Variables

```
PIRSCH_CLIENT_ID      # Analytics
PIRSCH_CLIENT_SECRET  # Analytics
PIRSCH_HOSTNAME       # Analytics
```

## Integrations

- **Giscus**: GitHub Discussions-based comments in BlogPostLayout
- **Pagefind**: Client-side search, index built during `bun run build`
- **Webmention.io**: IndieWeb mentions (likes, reposts, replies)
- **Pirsch**: Privacy-focused analytics
- **Vue**: Islands architecture for interactive components

## Design System

Design tokens defined in `src/styles/theme.css`. Never use hardcoded values.

### Colors

- Background: `var(--color-bg)`, `var(--color-bg-elevated)`, `var(--color-bg-card)`
- Text: `var(--color-text)`, `var(--color-text-muted)`, `var(--color-text-dim)`
- Interactive: `var(--color-accent)`, `var(--color-accent-hover)`, `var(--color-accent-light)`
- Borders: `var(--color-border)`, `var(--color-border-hover)`
- Semantic: `var(--color-success)`, `var(--color-error)`, `var(--color-warning)`

### Spacing

Use `var(--space-xs)` through `var(--space-3xl)`:

- xs: 0.5rem, sm: 1rem, md: 1.5rem, lg: 2rem, xl: 3rem, 2xl: 4rem, 3xl: 6rem

### Typography

- Font: `var(--font-sans)`, `var(--font-mono)`
- Sizes: `var(--text-xs)` through `var(--text-5xl)` (fluid)

### UI Components

Import from `@/components/ui`:

- `Button` - variant: primary/secondary/ghost, size: sm/md/lg
- `Card` - hover, padding options (none/sm/md/lg/xl)
- `Input` - with label, error, hint support
- `Badge` - variant: default/success/warning/error/accent
- `Section` - variant: default/hero/narrow
- `Container` - variant: default/narrow

## Vue Islands

Interactive components in `src/components/vue/`:

- `MobileMenu.vue` - client:media="(max-width: 768px)"

Tool pages use `client:only="vue"` for full client-side rendering.

### Composables

Located in `src/composables/`:

- `useScrollLock()` - body scroll locking for modals/menus
- `useLogger(prefix)` - loglevel wrapper (no console.\*)
- `useScrollPercentage()` - reactive scroll percentage tracking
