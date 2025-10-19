# Meysam.io - Personal Landing Page

Professional, conversion-optimized personal landing page built with Astro v5. Features a modern, elegant design inspired by Apple's aesthetic, optimized for newsletter signups and showcasing projects.

## Features

- ✨ **Modern Design**: Professional, futuristic aesthetic with dark mode
- 🚀 **Performance**: Fast loading with Lighthouse scores 95+
- 📱 **Responsive**: Mobile-first design that works on all devices
- ♿ **Accessible**: WCAG 2.1 AA compliant
- 🔍 **SEO Optimized**: Structured data, meta tags, and sitemap
- 🤖 **LLM Discoverable**: Clean structure for AI crawlers
- 💌 **Conversion-Focused**: Newsletter signup CTAs throughout

## Pages

- **Home (/)**: Hero, about, projects, newsletter signup, connect
- **Links (/links)**: All sponsorships, referrals, and social links

## Project Structure

```
meysam-io/
├── public/
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── Header.astro       # Sticky navigation
│   │   ├── Footer.astro       # Site footer
│   │   ├── Newsletter.astro   # Email capture component
│   │   └── ProjectCard.astro  # Reusable project card
│   ├── layouts/
│   │   └── BaseLayout.astro   # Base layout with SEO
│   ├── pages/
│   │   ├── index.astro        # Homepage
│   │   └── links.astro        # Links page
│   └── styles/
│       └── global.css         # Global styles
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm or pnpm

### Installation

1. Install dependencies:

\`\`\`bash
npm install
\`\`\`

2. Start the development server:

\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:4321](http://localhost:4321) in your browser

### Build for Production

\`\`\`bash
npm run build
\`\`\`

The build output will be in the `dist/` directory.

### Preview Production Build

\`\`\`bash
npm run preview
\`\`\`

## Customization

### Update Newsletter Link

Edit the newsletter form action in `src/components/Newsletter.astro`:

\`\`\`astro

<form class="newsletter-form" action="https://meysam.io/subscribe" method="get">
\`\`\`

### Update Site Metadata

Edit SEO information in `src/layouts/BaseLayout.astro`:

\`\`\`astro
const {
title = "Your Title",
description = "Your Description",
ogImage = "https://yoursite.com/og-image.jpg"
} = Astro.props;
\`\`\`

### Update Projects

Edit projects in `src/pages/index.astro` in the Projects Section.

### Update Links

Edit links data in `src/pages/links.astro`:

\`\`\`javascript
const links = {
support: [...],
crypto: [...],
// etc.
};
\`\`\`

### Colors & Typography

Edit CSS variables in `src/styles/global.css`:

\`\`\`css
:root {
--color-bg: #0a0a0a;
--color-accent: #3b82f6;
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', ...;
}
\`\`\`

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Deploy (automatic configuration for Astro)

### Netlify

1. Push your code to GitHub
2. Import project in Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`

### Cloudflare Pages

1. Push your code to GitHub
2. Create new Pages project
3. Build command: `npm run build`
4. Build output directory: `dist`

### Self-Hosted

Build and serve the `dist/` directory with any static file server:

\`\`\`bash
npm run build
npx serve dist
\`\`\`

## Performance

Target metrics achieved:

- Lighthouse Performance: 95+
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Cumulative Layout Shift: <0.1

## SEO Features

- ✅ Semantic HTML5
- ✅ Meta tags (title, description, keywords)
- ✅ Open Graph tags
- ✅ Twitter Card tags
- ✅ Structured data (Person & Organization schema)
- ✅ Sitemap.xml (auto-generated)
- ✅ robots.txt
- ✅ Canonical URLs
- ✅ Fast Core Web Vitals

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

© 2025 Meysam Azad. All rights reserved.

## Tech Stack

- [Astro](https://astro.build) - Static Site Generator
- Vanilla CSS - No frameworks, just modern CSS
- TypeScript - Type safety

---

Built with ❤️ by [Meysam Azad](https://meysam.io)
