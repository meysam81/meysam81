# AGENTS.md

Guidelines for AI coding agents working on meysam.io - an Astro v5 personal blog with Tailwind v4.

## Build & Development Commands

```bash
# Package manager - MUST use bun (not npm/pnpm/yarn)
bun install                 # Install dependencies
bun start                   # Dev server at localhost:4321
bun run build               # Type check + production build
bun run lint                # Format (prettier) + lint (oxlint)

# Individual commands
bunx prettier -w .          # Format all files
bunx oxlint --fix .         # Lint with auto-fix
bunx astro check            # Type checking only
```

## Testing

No test framework. Validation via:

- `bun run build` - Type checking + build
- Pre-commit hooks: oxlint, prettier, commitlint

## Code Style

### Imports

```typescript
// Use @/ path alias for src imports
import Button from "@/components/ui/Button.astro";
import { useLogger } from "@/composables/useLogger";

// Use 'import type' for type-only imports
import type { CollectionEntry } from "astro:content";
```

### Variable Declarations

```typescript
// Use var for function/module scope (codebase convention)
var posts = await getCollection("blog");
var logger = useLogger("component");

// Use let only for block-scoped reassignment
```

### Function Style

```typescript
// Use named function expressions for callbacks
posts.filter(function filterPosts(post) {
  return !post.data.draft;
});
```

### Naming Conventions

| Type                | Convention | Example                |
| ------------------- | ---------- | ---------------------- |
| Files (utilities)   | kebab-case | `reading-time.ts`      |
| Files (components)  | PascalCase | `Button.astro`         |
| Components          | PascalCase | `ContentCard.astro`    |
| Functions/Variables | camelCase  | `filterPublishedPosts` |
| CSS variables       | kebab-case | `--color-bg`           |

### Logging - NO console statements

```typescript
// oxlint denies console.* - use loglevel instead
import { useLogger } from "@/composables/useLogger";

var logger = useLogger("MyComponent");
logger.debug("message");
logger.info("message");
logger.warn("message");
logger.error("message");
```

### Error Handling

- Empty catch blocks allowed (`allowEmptyCatch: true`)
- Use `try/catch` for async operations
- Prefer early returns over nested conditions

## Styling - Design Tokens

Use CSS variables from `src/styles/theme.css`. Never hardcode values:

```css
/* Correct */
color: var(--color-text-muted);
padding: var(--space-md);
font-size: var(--text-lg);
box-shadow: var(--shadow-lg);

/* Wrong */
color: #a0a0a0;
padding: 1.5rem;
```

### Key Tokens

- **Colors**: `--color-bg`, `--color-text`, `--color-accent`, `--color-border`
- **Spacing**: `--space-xs` to `--space-3xl`
- **Typography**: `--text-xs` to `--text-6xl`, `--font-sans`, `--font-mono`
- **Shadows**: `--shadow-sm` to `--shadow-xl`, `--shadow-accent`
- **Sizing**: `--size-header`, `--size-icon`, `--size-avatar`
- **Radius**: `--radius-xs` to `--radius-full`

## TypeScript Config

- Strict mode OFF (`strict: false`)
- `noImplicitAny: false` - implicit any allowed
- `strictNullChecks: false` - null checks not enforced

## Oxlint Rules (Key)

- `no-console`: denied - use loglevel
- `import/no-cycle`: denied
- `curly`: denied - always use braces
- `no-else-return`: denied - use early returns
- `prefer-await-to-then`: denied - use async/await
- `func-names`: denied - name all functions

## Project Structure

```
src/
  components/           # Astro components
    ui/                 # Button, Card, Input, Badge, Section
    vue/tools/          # Vue tool components
  composables/          # Vue composables
  content/blog/         # MDX blog posts
  layouts/              # BaseLayout, BlogPostLayout, ToolLayout
  pages/                # Routes
  utils/                # Utility functions
  styles/theme.css      # Design tokens
public/                 # Static assets
```

## Component Patterns

### Astro Components

```astro
---
import type { HTMLAttributes } from "astro/types";

interface Props extends HTMLAttributes<"div"> {
  variant?: "primary" | "secondary";
}

var { variant = "primary", class: className, ...attrs } = Astro.props;
---

<div class:list={[variant, className]} {...attrs}>
  <slot />
</div>
```

### Vue Islands

- `client:only="vue"` for tool pages
- `client:media` for conditional hydration

## Blog Post Frontmatter

```yaml
title: "Post Title" # required
description: "Description" # required
pubDate: 2025-01-01 # required
updatedDate: 2025-01-02 # optional
author: "Meysam Azad" # default
tags: ["tag1"] # optional
draft: false # optional
featured: false # optional
series: "Series Name" # optional
seriesOrder: 1 # optional
```

## Commit Messages

Conventional commits (commitlint enforced):

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `chore:` maintenance
- `refactor:` code restructure

## Refactoring Progress (DRY & Modularity)

### Phase 1: Tool Pages - COMPLETED

Created centralized tools infrastructure:

- `src/data/tools.ts` - Single source of truth for tool metadata, keywords, structured data
- `src/components/ToolNewsletterCTA.astro` - Reusable newsletter CTA with form handling
- `src/components/FAQAccordion.astro` - Reusable FAQ accordion component
- `src/styles/tools.css` - Shared styles for reference tables, error cards

Refactored tool pages to use new components:

- `src/pages/tools/index.astro` - Uses centralized tools config
- `src/pages/tools/cron.astro` - Uses FAQAccordion, ToolNewsletterCTA
- `src/pages/tools/yaml-json.astro` - Uses FAQAccordion, ToolNewsletterCTA
- `src/pages/tools/saas-idea-validator.astro` - Uses FAQAccordion, ToolNewsletterCTA
- `src/pages/tools/social-preview.astro` - Uses ToolNewsletterCTA

### Phase 2: Blog Utilities - COMPLETED

Created shared blog utilities:

- `src/utils/blog.ts` - Added `formatDate()`, `getAllTags()`, `getPostsByTag()`, `splitByFeatured()`
- `src/utils/reading-time.ts` - Added `formatReadingTime()`, `calculateTotalReadingTime()`
- `src/components/TagsFilter.astro` - Reusable tags filter with active state
- `src/components/BackLink.astro` - Reusable back link with arrow icon

Refactored blog pages to use shared utilities:

- `src/pages/blog/index.astro` - Uses TagsFilter, formatDate, formatReadingTime, splitByFeatured
- `src/pages/blog/tags/[tag].astro` - Uses TagsFilter, BackLink, formatDate, filterPublishedPosts
- `src/pages/blog/series/[slug].astro` - Uses BackLink, formatDate, formatReadingTime

### Phase 3: Vue Components - PARTIALLY COMPLETED

Files created:

- `src/composables/useToast.ts` - Toast visibility state management with auto-timeout
- `src/composables/useUrlParams.ts` - URL parameter handling (get, set, encode/decode)
- `src/styles/tool-components.css` - Shared Vue tool styles

Optional (not implemented):

- `src/components/vue/ui/CopyButton.vue` - Reusable copy button
- `src/components/vue/ui/Toast.vue` - Toast notification component

### Phase 4: Utilities Cleanup - COMPLETED

- Removed `src/utils/logger.ts` and updated all imports to use `useLogger` composable:
  - `src/pages/blog/[...slug].astro`
  - `src/utils/idea-validator.ts`
  - `src/utils/pirsch.ts`
- Converted `src/utils/cron.js` to TypeScript (`src/utils/cron.ts`) with proper interfaces:
  - Added types: `TimeResult`, `IntervalResult`, `PatternMatch`, `ValidationResult`, `CronPreset`, `ExamplePhrase`, `Pattern`
  - Updated imports in `src/pages/tools/cron.astro` and `src/components/vue/tools/CronTool.vue`

### Phase 5: Layout Refactoring - COMPLETED

- Created `src/components/ui/Icon.astro` - Centralized icon component with 24 icon types:
  - Navigation: arrow-left, arrow-right, external-link, link
  - Actions: checkmark, checkmark-circle, copy
  - Info: clock, book, document, search, spinner, eye
  - Page: home, user, briefcase, envelope, open-book
  - Social: x-twitter, linkedin, github, youtube, rss, email
- Created `src/components/AsideSection.astro` - Reusable aside section for blog post sidebars
- Standardized UI component props (HTMLAttributes extension):
  - `src/components/ui/Badge.astro` - extends `HTMLAttributes<"span">`
  - `src/components/ui/Container.astro` - extends `HTMLAttributes<"div">`
  - `src/components/ui/Section.astro` - extends `HTMLAttributes<"section">`
- Added `.gradient-text` utility class to `src/styles/theme.css`
- Updated `src/components/BackLink.astro` to use centralized Icon component
