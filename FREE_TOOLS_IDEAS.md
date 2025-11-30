# meysam.io - Free Tools Strategy

> **Last Updated**: 2025-11-29
> **Status**: In Progress (Wave 1)
> **Newsletter CTA**: newsletter.meysam.io

## Executive Summary

Build a suite of free, standalone micro-tools that solve specific problems for DevOps engineers, aspiring technical founders, and indie hackers. Each tool serves as a lead magnet converting visitors to newsletter subscribers, building trust and brand awareness before users need deeper content. Target: 5-10 high-utility tools deployed as static sites with zero friction and newsletter-only CTAs.

---

## Implementation Status

| Tool                          | Status       | URL                     | Notes                                                                                          |
| ----------------------------- | ------------ | ----------------------- | ---------------------------------------------------------------------------------------------- |
| **Cron Expression Generator** | ✅ Completed | `/tools/cron`           | Bidirectional English↔cron conversion, 70+ natural language patterns, next 10 runs calculation |
| **YAML/JSON Validator**       | 🔲 Planned   | `/tools/yaml-json`      | Wave 1                                                                                         |
| **SaaS Idea Validator**       | 🔲 Planned   | `/tools/idea-validator` | Wave 1                                                                                         |

---

## Table of Contents

- [Project Context](#project-context)
- [Market Analysis](#market-analysis)
- [Free Tool Ideas](#free-tool-ideas)
- [Prioritization Matrix](#prioritization-matrix)
- [Implementation Roadmap](#implementation-roadmap)
- [Newsletter Integration](#newsletter-integration)
- [Success Metrics](#success-metrics)
- [Anti-Ideas: What We Won't Build](#anti-ideas-what-we-wont-build)

---

## Project Context

**Core Value Proposition**: Authentic documentation of the journey from DevOps engineer (8+ years) to indie hacker, combining production systems experience with honest entrepreneurship lessons.

**Primary ICPs**:

- **ICP 1 - Aspiring Technical Founders**: Senior engineers (5-10 years experience) considering the leap to indie hacking. Comfortable with code, uncertain about business. Looking for relatable journey documentation and actionable frameworks.
- **ICP 2 - DevOps/SRE Practitioners**: Engineers working in production systems wanting battle-tested solutions. Reading developer-friendly.blog for technical content. Value no-BS, production-grade recommendations.
- **ICP 3 - Build-in-Public Followers**: Individuals following entrepreneur journeys for education and entertainment. Subscribe to multiple newsletters, active on X/Twitter. Want honest updates including failures.

**Core Problem Space**: Bridging the gap between technical engineering excellence and entrepreneurial success—helping engineers build products, not just systems.

**Tech Stack**: Astro v5 (static), MDX, vanilla CSS, Bun, TypeScript. Tools should be static/client-side where possible.

**Existing Landing Page**: Yes, meysam.io with newsletter integration (Listmonk + Altcha CAPTCHA).

---

## Market Analysis

### Core Market

**Core Market Keywords**:

- "devops to founder"
- "engineer starting saas"
- "technical founder journey"
- "indie hacker devops"
- "building in public engineer"
- "customer discovery for engineers"
- "sre side projects"

**Core Market Pain Points**:

- Don't know how to validate ideas before building
- Over-engineer everything, ship slowly
- Struggle with distribution and marketing
- Can't find problems worth solving
- Build features, not businesses
- No framework for customer conversations

**Core Market "I wish I had..."**:

- A checklist to validate my SaaS idea quickly
- Templates for customer interview questions
- A way to calculate if my pricing makes sense
- Quick tools that help me ship faster, not slower

### Adjacent Markets

**Adjacent Market 1: DevOps/SRE Engineers (Daily Utilities)**

- **Overlap**: Same technical background, same daily tools
- **Entry point**: Productivity tools they use every day (YAML validators, cron generators, K8s helpers)
- **Conversion path**: "This free tool was useful → who made this? → oh, interesting journey → subscribe"

**Adjacent Market 2: Early-Stage SaaS Founders (Non-Technical or Technical)**

- **Overlap**: Building products, need validation, thinking about pricing and positioning
- **Entry point**: Business validation tools (MRR calculators, pricing calculators, idea validators)
- **Conversion path**: "This calculator helped me think through pricing → this person gets SaaS → subscribe for more"

**Adjacent Market 3: Developer Content Creators**

- **Overlap**: Engineers who write, document, or share knowledge
- **Entry point**: Content creation utilities (README generators, blog post templates, OG image makers)
- **Conversion path**: "This made my README better → author is also a technical writer → subscribe"

---

## Free Tool Ideas

### Tool 1: Cron Expression Generator & Explainer

**One-liner**: Build and decode cron expressions with plain English

**URL slug**: `meysam.io/tools/cron`

**Target market**: Adjacent (DevOps/SRE Engineers)

**Search intent**: "cron expression generator" — ~40K monthly searches globally

**The job**:

- User has: A scheduling requirement like "every Monday at 9am"
- User wants: The correct cron syntax + validation it's right
- Current alternatives: crontab.guru (good but no generator), random websites with ads

**Why this works as a lead magnet**:

- DevOps engineers use cron constantly
- Shows technical competence immediately
- Natural fit for "more DevOps tips" newsletter hook

**Core functionality**:

1. Input: Plain English description OR cron expression
2. Two-way conversion (English ↔ cron syntax)
3. Visual calendar preview showing next 10 run times
4. Copy button for the expression
5. Output: Validated cron expression + explanation

**Newsletter hook**: "Get weekly DevOps tips and production insights from 8+ years in the trenches"

**Technical approach**:

- Type: Client-side only
- Key tech: cronstrue library (cron to English), custom parser for English to cron
- Complexity: S
- Estimated build: 2-3 days

**Virality mechanics**:

- [x] Shareable output (link with cron expression in URL params)
- [x] "Built by meysam.io" footer
- [x] Social-friendly preview (OG image with cron expression)

**Risks/Considerations**:

- Competitive space, but most competitors are ad-heavy
- Differentiate with cleaner UX and bidirectional conversion

---

### Tool 2: SaaS Idea Validator Checklist

**One-liner**: Score your startup idea against 20 validation criteria

**URL slug**: `meysam.io/tools/idea-validator`

**Target market**: Core (Aspiring Technical Founders)

**Search intent**: "validate startup idea" / "saas idea checklist" — ~5K monthly searches

**The job**:

- User has: A SaaS idea they're excited about
- User wants: Objective assessment before investing months building
- Current alternatives: Random blog posts, no interactive tool

**Why this works as a lead magnet**:

- Directly addresses ICP 1's core anxiety
- Demonstrates author's credibility in idea validation
- Natural lead-in to "follow my validation journey" newsletter

**Core functionality**:

1. 20 yes/no questions across categories (Market, Problem, Solution, Distribution, Founder-Fit)
2. Each question has tooltip explaining why it matters
3. Real-time score calculation with visual indicator
4. Category breakdown showing strengths/weaknesses
5. Output: Overall score + actionable recommendations

**Newsletter hook**: "Get weekly lessons from my own idea validation journey—what worked, what failed"

**Technical approach**:

- Type: Client-side only
- Key tech: Vanilla JS, localStorage for saving progress
- Complexity: S
- Estimated build: 2 days

**Virality mechanics**:

- [x] Shareable output (score card image)
- [x] "Validated with meysam.io" badge on results
- [x] Social-friendly preview (score visualization)

**Risks/Considerations**:

- Subjective by nature—need clear disclaimers
- Questions must be genuinely insightful, not generic

---

### Tool 3: Customer Interview Question Generator

**One-liner**: Generate problem-discovery questions for any market

**URL slug**: `meysam.io/tools/interview-questions`

**Target market**: Core (Aspiring Technical Founders)

**Search intent**: "customer interview questions" / "customer discovery questions" — ~3K monthly searches

**The job**:

- User has: A market or problem area they want to explore
- User wants: Non-leading questions that uncover real pain points
- Current alternatives: Mom Test book (great but not actionable tool), generic templates

**Why this works as a lead magnet**:

- Solves immediate pain for founders doing discovery
- Demonstrates deep understanding of customer discovery
- Perfect newsletter funnel ("follow my 100 interviews journey")

**Core functionality**:

1. Input: Target market/persona and problem space
2. Generate 15-20 questions across categories (Problem, Current Solutions, Priorities, Budget)
3. Each question has explanation of what insight it seeks
4. One-click copy all or individual questions
5. Output: Customized interview script

**Newsletter hook**: "Join 1,500+ engineers learning to talk to customers—weekly interview insights and templates"

**Technical approach**:

- Type: Client-side with optional AI enhancement
- Key tech: Curated question templates with variable interpolation; optional OpenAI API for custom generation
- Complexity: S (template-based) or M (AI-enhanced)
- Estimated build: 2-4 days

**Virality mechanics**:

- [x] Shareable output (question list as image or PDF)
- [x] "Generated with meysam.io" attribution
- [x] Social-friendly preview

**Risks/Considerations**:

- AI version requires API costs or rate limiting
- Template version may feel generic—need high-quality base questions

---

### Tool 4: YAML/JSON Validator & Converter

**One-liner**: Validate, format, and convert between YAML and JSON

**URL slug**: `meysam.io/tools/yaml-json`

**Target market**: Adjacent (DevOps/SRE Engineers)

**Search intent**: "yaml validator" / "yaml to json converter" — ~50K monthly searches combined

**The job**:

- User has: YAML or JSON that might have syntax errors
- User wants: Instant validation + conversion to the other format
- Current alternatives: Many exist but often cluttered with ads

**Why this works as a lead magnet**:

- Extremely high search volume
- Used multiple times daily by DevOps engineers
- Quick win that builds trust for deeper content

**Core functionality**:

1. Paste YAML or JSON in left pane
2. Auto-detect format
3. Validate with clear error messages (line numbers, suggestions)
4. One-click convert to other format
5. Output: Validated, formatted code + conversion

**Newsletter hook**: "Weekly DevOps tips—production lessons from 8+ years of YAML debugging"

**Technical approach**:

- Type: Client-side only
- Key tech: js-yaml library, native JSON.parse
- Complexity: XS
- Estimated build: 1-2 days

**Virality mechanics**:

- [x] Shareable output (link with encoded content for short snippets)
- [x] Clean, minimal branding
- [x] Social-friendly preview

**Risks/Considerations**:

- Very competitive space
- Differentiate with speed, cleanliness, and no ads

---

### Tool 5: MRR & Runway Calculator

**One-liner**: Calculate SaaS metrics and runway from your numbers

**URL slug**: `meysam.io/tools/mrr-calculator`

**Target market**: Core (Aspiring Technical Founders) + Adjacent (Early-Stage Founders)

**Search intent**: "mrr calculator" / "startup runway calculator" — ~8K monthly searches

**The job**:

- User has: Revenue numbers, costs, and growth rate
- User wants: Clear metrics (MRR, ARR, churn rate, runway) and projections
- Current alternatives: Spreadsheet templates, scattered calculators

**Why this works as a lead magnet**:

- Every SaaS founder obsesses over these numbers
- Shows author understands SaaS business mechanics
- Natural segue to building-in-public content

**Core functionality**:

1. Input: Monthly revenue, customers, churn, monthly costs
2. Calculate: MRR, ARR, churn rate, LTV, CAC ratio
3. Runway projection with burn rate
4. Growth projections at current rate (3, 6, 12 months)
5. Output: Dashboard view + exportable summary

**Newsletter hook**: "Follow my journey from $0 MRR to product-market fit—weekly transparent updates"

**Technical approach**:

- Type: Client-side only
- Key tech: Vanilla JS, Chart.js for visualizations
- Complexity: S
- Estimated build: 2-3 days

**Virality mechanics**:

- [x] Shareable output (metrics card image)
- [x] "Calculated with meysam.io" watermark option
- [x] Social-friendly preview

**Risks/Considerations**:

- Numbers are sensitive—ensure no data is transmitted
- Privacy-first messaging important

---

### Tool 6: Kubernetes Manifest Generator

**One-liner**: Generate K8s YAML from a simple form

**URL slug**: `meysam.io/tools/k8s-generator`

**Target market**: Adjacent (DevOps/SRE Engineers)

**Search intent**: "kubernetes yaml generator" / "k8s deployment generator" — ~15K monthly searches

**The job**:

- User has: A container they want to deploy to Kubernetes
- User wants: Correct YAML without memorizing the schema
- Current alternatives: kubectl create --dry-run, scattered generators

**Why this works as a lead magnet**:

- K8s YAML is notoriously verbose and error-prone
- Every DevOps engineer has this pain point
- Demonstrates deep K8s expertise

**Core functionality**:

1. Select resource type (Deployment, Service, ConfigMap, Secret, Ingress)
2. Fill in form fields (image, ports, replicas, env vars, etc.)
3. Real-time YAML preview
4. Validate against K8s schema
5. Output: Production-ready YAML with best practices comments

**Newsletter hook**: "Production Kubernetes patterns from 8+ years of running clusters at scale"

**Technical approach**:

- Type: Client-side only
- Key tech: Form state management, YAML generation, K8s schema validation
- Complexity: M
- Estimated build: 4-5 days

**Virality mechanics**:

- [x] Shareable output (YAML file download)
- [x] "Generated with meysam.io" comment in YAML
- [x] Social-friendly preview

**Risks/Considerations**:

- K8s schema is complex—start with common resources only
- Must stay updated with K8s versions

---

### Tool 7: Pricing Page Calculator

**One-liner**: Model SaaS pricing tiers with revenue projections

**URL slug**: `meysam.io/tools/pricing-calculator`

**Target market**: Core (Aspiring Technical Founders)

**Search intent**: "saas pricing calculator" / "pricing tier calculator" — ~4K monthly searches

**The job**:

- User has: A product they need to price
- User wants: To model different pricing tiers and see revenue impact
- Current alternatives: Spreadsheets, guesswork

**Why this works as a lead magnet**:

- Pricing is one of the hardest decisions for founders
- Shows author thinks strategically about business, not just code
- Perfect for "follow my pricing experiments" content

**Core functionality**:

1. Define up to 4 pricing tiers (name, price, features)
2. Input expected customer distribution across tiers
3. Model scenarios (optimistic, realistic, conservative)
4. Calculate blended ARPU, projected MRR at various customer counts
5. Output: Visual breakdown + recommendations

**Newsletter hook**: "Pricing experiments, customer discovery, and SaaS lessons—weekly from the trenches"

**Technical approach**:

- Type: Client-side only
- Key tech: Vanilla JS, simple charting
- Complexity: S
- Estimated build: 2-3 days

**Virality mechanics**:

- [x] Shareable output (pricing breakdown image)
- [x] "Modeled with meysam.io" attribution
- [x] Social-friendly preview

**Risks/Considerations**:

- Pricing is highly contextual—tool should educate, not prescribe
- Include disclaimer about market-specific factors

---

### Tool 8: README Generator

**One-liner**: Generate professional GitHub README from prompts

**URL slug**: `meysam.io/tools/readme-generator`

**Target market**: Adjacent (Developer Content Creators)

**Search intent**: "readme generator" / "github readme template" — ~25K monthly searches

**The job**:

- User has: A project that needs documentation
- User wants: A professional, complete README quickly
- Current alternatives: Templates, but require manual customization

**Why this works as a lead magnet**:

- Every developer needs READMEs
- Shows author cares about documentation and communication
- Connects to developer audience broadly

**Core functionality**:

1. Input: Project name, description, features, installation steps
2. Select sections to include (badges, screenshots, contributing, license)
3. Choose style (minimal, detailed, badges-heavy)
4. Live preview with markdown rendering
5. Output: Complete README.md ready to copy

**Newsletter hook**: "Technical writing, open source, and building in public—weekly insights for shipping developers"

**Technical approach**:

- Type: Client-side only
- Key tech: Template interpolation, markdown preview
- Complexity: S
- Estimated build: 2-3 days

**Virality mechanics**:

- [x] Shareable output (README file)
- [x] Optional "README generated with meysam.io/tools/readme-generator" badge
- [x] Social-friendly preview

**Risks/Considerations**:

- Many competitors exist
- Differentiate with opinionated, high-quality templates

---

### Tool 9: .env Validator & Documentation Generator

**One-liner**: Validate .env files and generate documentation

**URL slug**: `meysam.io/tools/env-validator`

**Target market**: Adjacent (DevOps/SRE Engineers + Developers)

**Search intent**: "env file validator" / "dotenv documentation" — ~5K monthly searches

**The job**:

- User has: A .env file that might have issues or needs documentation
- User wants: Validation + auto-generated .env.example
- Current alternatives: Manual review, no dedicated tools

**Why this works as a lead magnet**:

- Solves a real annoyance (missing env vars cause runtime errors)
- Security angle (detect accidentally committed secrets)
- Connects to DevOps security expertise

**Core functionality**:

1. Paste .env file content
2. Validate: syntax errors, duplicate keys, empty values
3. Security scan: flag potential secrets (API keys, passwords)
4. Generate .env.example with sanitized values
5. Output: Validation report + .env.example + documentation table

**Newsletter hook**: "Production security and DevOps best practices—lessons from 8+ years keeping systems safe"

**Technical approach**:

- Type: Client-side only (no data transmitted)
- Key tech: Regex parsing, pattern matching for secrets
- Complexity: S
- Estimated build: 2 days

**Virality mechanics**:

- [x] Shareable output (.env.example file)
- [x] Security report shareable as image
- [x] Social-friendly preview

**Risks/Considerations**:

- Users may be nervous about pasting secrets—emphasize client-side only
- Clear privacy messaging essential

---

### Tool 10: Technical Founder Daily Standup Template

**One-liner**: Structure your daily build-in-public updates

**URL slug**: `meysam.io/tools/standup`

**Target market**: Core (Aspiring Technical Founders + Build-in-Public Followers)

**Search intent**: "build in public template" / "indie hacker daily update" — ~2K monthly searches

**The job**:

- User has: Progress to share but struggles with format/consistency
- User wants: A structured template that makes updates easy
- Current alternatives: Freeform tweets, inconsistent formats

**Why this works as a lead magnet**:

- Directly serves ICP 1 and ICP 3
- Promotes build-in-public culture author embodies
- Creates daily touchpoint opportunity

**Core functionality**:

1. Fill in structured fields (Yesterday, Today, Blockers, Metrics, Mood)
2. Select platform format (X/Twitter, LinkedIn, Newsletter)
3. Auto-format with character count
4. Track history (localStorage) for consistency
5. Output: Formatted update ready to post

**Newsletter hook**: "Daily build-in-public inspiration—follow one engineer's journey from $0 to PMF"

**Technical approach**:

- Type: Client-side only
- Key tech: Form handling, localStorage history, copy/share functionality
- Complexity: XS
- Estimated build: 1-2 days

**Virality mechanics**:

- [x] Shareable output (formatted post with optional attribution)
- [x] "Formatted with meysam.io" optional tag
- [x] Social-friendly preview

**Risks/Considerations**:

- Niche tool, lower search volume
- Value is in habitual use, not one-time visits

---

## Prioritization Matrix

**Scoring Criteria**:

- **Utility (3x)**: How genuinely useful? Would I use it?
- **Strategic Fit (2x)**: How well does it funnel to newsletter/main content?
- **Discovery (2x)**: Search volume, shareability, viral potential
- **Build Effort (1x)**: Inverse scoring—lower effort = higher score

**Score = (Utility×3 + Fit×2 + Discovery×2 + (10-Effort)×1) / 8**

| Rank | Tool                               | Utility | Fit | Discovery | Effort | Score |
| ---- | ---------------------------------- | ------- | --- | --------- | ------ | ----- |
| 1    | Cron Expression Generator          | 9       | 7   | 9         | 3      | 7.9   |
| 2    | YAML/JSON Validator                | 9       | 6   | 10        | 2      | 7.8   |
| 3    | SaaS Idea Validator                | 8       | 10  | 6         | 3      | 7.6   |
| 4    | MRR & Runway Calculator            | 8       | 9   | 7         | 3      | 7.5   |
| 5    | Customer Interview Questions       | 7       | 10  | 5         | 4      | 7.0   |
| 6    | .env Validator                     | 8       | 7   | 6         | 3      | 6.9   |
| 7    | README Generator                   | 7       | 5   | 9         | 3      | 6.8   |
| 8    | Kubernetes Manifest Generator      | 8       | 7   | 8         | 5      | 6.6   |
| 9    | Pricing Page Calculator            | 7       | 9   | 5         | 4      | 6.6   |
| 10   | Technical Founder Standup Template | 6       | 9   | 4         | 2      | 6.3   |

---

## Implementation Roadmap

### Wave 1: Quick Wins (Build First)

High-impact AND low-effort tools. Get these live fast to start capturing traffic.

| Tool                          | Why Wave 1                                                 | Est. Build |
| ----------------------------- | ---------------------------------------------------------- | ---------- |
| **Cron Expression Generator** | Highest combined score, massive search volume, XS-S effort | 2-3 days   |
| **YAML/JSON Validator**       | Extremely high search volume, XS effort, daily use tool    | 1-2 days   |
| **SaaS Idea Validator**       | Direct ICP 1 target, high strategic fit, low effort        | 2 days     |

**Wave 1 Total**: ~5-7 days of build time

### Wave 2: Strategic Bets

Higher effort but strong strategic alignment with ICPs.

| Tool                             | Why Wave 2                                                   | Est. Build |
| -------------------------------- | ------------------------------------------------------------ | ---------- |
| **MRR & Runway Calculator**      | Core ICP tool, builds credibility as business-savvy engineer | 2-3 days   |
| **Customer Interview Questions** | Direct ICP 1 pain point, unique positioning                  | 2-4 days   |
| **.env Validator**               | Security angle differentiates, practical utility             | 2 days     |

**Wave 2 Total**: ~6-9 days of build time

### Wave 3: Market Expansion

Adjacent market plays to broaden top-of-funnel.

| Tool                              | Which Adjacent Market       | Est. Build |
| --------------------------------- | --------------------------- | ---------- |
| **README Generator**              | Developer content creators  | 2-3 days   |
| **Kubernetes Manifest Generator** | DevOps engineers (advanced) | 4-5 days   |
| **Pricing Page Calculator**       | Early-stage SaaS founders   | 2-3 days   |

**Wave 3 Total**: ~8-11 days of build time

### Parking Lot

Ideas that didn't make the initial cut:

| Tool                         | Why Not Now                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------ |
| **Standup Template**         | Lower search volume, niche use case. Revisit if build-in-public content grows. |
| **Docker Compose Validator** | Similar to YAML validator, may cannibalize. Evaluate after Wave 1 data.        |
| **OG Image Generator**       | Crowded space, lower strategic fit. Only if clear differentiation emerges.     |

---

## Newsletter Integration

### Value Proposition by Tool

| Tool                         | Newsletter Hook                                      | Expected Conversion |
| ---------------------------- | ---------------------------------------------------- | ------------------- |
| Cron Expression Generator    | "Weekly DevOps tips from 8+ years in production"     | Medium              |
| YAML/JSON Validator          | "Production debugging lessons and DevOps patterns"   | Low-Medium          |
| SaaS Idea Validator          | "Follow my validation journey—weekly lessons"        | High                |
| MRR & Runway Calculator      | "Transparent SaaS metrics from my own journey"       | High                |
| Customer Interview Questions | "100 customer interviews documented—weekly insights" | High                |
| .env Validator               | "Security and DevOps best practices weekly"          | Medium              |
| README Generator             | "Technical writing and shipping tips"                | Low                 |
| K8s Manifest Generator       | "Production Kubernetes patterns"                     | Medium              |
| Pricing Page Calculator      | "SaaS pricing experiments and lessons"               | Medium-High         |

### CTA Placement

**During use** (non-intrusive):

- Subtle footer: "Built by Meysam — 1,500+ engineers read my weekly DevOps & indie hacking lessons"
- Link, not popup. Don't interrupt the workflow.

**On output** (after value delivered):

- After result/download: "Found this useful? Get weekly tools and insights →"
- Optional: checkbox to add small attribution to generated content

**Exit intent** (last chance, gentle):

- Only trigger once per session
- Copy: "Before you go—join 1,500+ engineers getting weekly production insights"
- Easy dismiss, no dark patterns

---

## Success Metrics

| Metric                          | Target               | Measurement          |
| ------------------------------- | -------------------- | -------------------- |
| Tool visits (per tool, monthly) | 1,000+               | Pirsch analytics     |
| Newsletter conversion rate      | 2-5%                 | Listmonk             |
| Referral traffic to main site   | 10% of tool visitors | Pirsch referrer data |
| Tool shares/backlinks           | 5+ per tool          | Manual tracking, GSC |
| Time on tool page               | >60 seconds          | Pirsch               |
| Return visitors                 | 20%+                 | Pirsch               |

### Tracking Implementation

Each tool should fire Pirsch events for:

- `tool_used` — user completed the primary action
- `newsletter_cta_shown` — CTA was displayed
- `newsletter_cta_clicked` — user clicked subscribe
- `result_copied` — user copied output
- `result_shared` — user used share functionality

---

## Anti-Ideas: What We Won't Build

### 1. Generic Calculators (BMI, Mortgage, etc.)

**Why not**: Zero strategic fit. Attracts wrong audience. No path to newsletter value.

### 2. AI Chatbot/Assistant

**Why not**: Expensive to run, high maintenance, commoditized. Doesn't differentiate.

### 3. "Freemium" Tools with Paywalled Features

**Why not**: Violates core strategy. Trust is built through generosity. Free means free.

### 4. Tools Requiring Account Creation

**Why not**: Friction kills conversion. Value first, relationship second.

### 5. Tools Competing with Main Products (FindForce, Awesome Directories)

**Why not**: Cannibalization. Free tools feed the newsletter, not compete with products.

### 6. Complex Backend-Heavy Tools

**Why not**: Hosting costs, maintenance burden, downtime risk. Static-first philosophy.

### 7. Tools That Take >5 Minutes to Deliver Value

**Why not**: Attention is scarce. Instant utility builds trust. If it needs a tutorial, it's too complex.

### 8. "Me Too" Tools Without Clear Differentiation

**Why not**: No point competing with established tools unless we're 10x better on some axis (speed, UX, no ads, specific niche).

---

## Technical Architecture Notes

### Recommended Stack for Tools

```
Framework: Astro v5 (consistent with main site)
Styling: Vanilla CSS + CSS variables (match main site design system)
Interactivity: Astro islands with vanilla JS (or Vue for complex state)
Build: Bun
Hosting: Same GitHub Pages deployment as main site
```

### URL Structure

Tools live under `/tools/[slug]`:

```
meysam.io/tools/cron
meysam.io/tools/yaml-json
meysam.io/tools/idea-validator
...
```

### Shared Components

Create once, reuse across tools:

- `ToolLayout.astro` — consistent header, footer, newsletter CTA placement
- `CopyButton.astro` — already exists, reuse
- `ShareButtons.astro` — X, LinkedIn, copy link
- `NewsletterCTA.astro` — tool-specific variant

### Analytics Integration

Each tool page should include:

- Pirsch page view tracking (automatic)
- Custom events for key actions
- UTM parameters for newsletter attribution

---

_This document is a living strategy. Update as tools launch and data comes in._
