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
