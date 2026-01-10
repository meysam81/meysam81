/**
 * Centralized tool configuration for all developer tools.
 * Single source of truth for tool metadata, structured data, and FAQs.
 */

export interface FAQItem {
  question: string;
  answer: string;
}

export interface Tool {
  // Basic info
  slug: string;
  title: string;
  shortTitle?: string;
  description: string;
  shortDescription: string;

  // Categorization
  badge: "DevOps" | "Founders" | "Marketing";
  applicationCategory: "DeveloperApplication" | "BusinessApplication";

  // SEO
  keywords: string;
  ogImage: string;

  // Structured data
  featureList: string[];
  faqs: FAQItem[];

  // Status
  status: "published" | "coming-soon";
}

export interface ComingSoonTool {
  title: string;
  description: string;
  badge: string;
}

// Published tools with full configuration
export var tools: Tool[] = [
  {
    slug: "cron",
    title: "Cron Expression Generator",
    shortTitle: "Cron Generator",
    description:
      "Build and decode cron expressions with plain English. Instant validation, next 10 run times, and copy-ready output. Free, no ads.",
    shortDescription:
      "Build and decode cron expressions with plain English. Instant validation, next run times, and copy-ready output.",
    badge: "DevOps",
    applicationCategory: "DeveloperApplication",
    keywords:
      "cron expression generator, cron job scheduler, crontab generator, cron syntax, cron expression validator, cron to english, english to cron, cron calculator, next cron run time, cron expression examples, kubernetes cronjob, linux cron, unix cron, schedule task, recurring job scheduler, cron expression builder, crontab syntax, cron job examples, free cron generator, online cron tool",
    ogImage: "https://meysam.io/og/cron.png",
    featureList: [
      "Natural language to cron conversion",
      "Cron expression to English translation",
      "Next 10 run times calculation",
      "Copy to clipboard",
      "Shareable URLs",
      "Common presets",
    ],
    faqs: [
      {
        question: "What is a cron expression?",
        answer:
          "A cron expression is a string format used to schedule recurring tasks in Unix-like systems. It consists of 5 fields: minute (0-59), hour (0-23), day of month (1-31), month (1-12), and day of week (0-7).",
      },
      {
        question: "How do I run a cron job every 5 minutes?",
        answer:
          'Use the expression */5 * * * * to run every 5 minutes. The */5 in the minute field means "every 5 minutes" starting from 0.',
      },
      {
        question: "What does * mean in cron?",
        answer:
          'The asterisk (*) in cron means "every" or "all values". For example, * in the hour field means "every hour", and * in the day field means "every day".',
      },
      {
        question: "How do I schedule a cron job for weekdays only?",
        answer:
          "Use 1-5 or MON-FRI in the day of week field. For example, 0 9 * * 1-5 runs at 9:00 AM Monday through Friday.",
      },
      {
        question: "What is the difference between / and - in cron?",
        answer:
          'The slash (/) specifies step values like "every N units". The hyphen (-) specifies ranges. For example, */15 means "every 15 minutes" while 9-17 means "hours 9 through 17".',
      },
      {
        question: "How do I run something on the last day of every month?",
        answer:
          'Some cron implementations support L for "last". Use 0 0 L * * for midnight on the last day of every month. Note: Standard cron doesn\'t support L, but many modern schedulers (like Kubernetes CronJobs) do.',
      },
    ],
    status: "published",
  },
  {
    slug: "yaml-json",
    title: "YAML/JSON Validator & Converter",
    shortTitle: "YAML/JSON Validator",
    description:
      "Validate, format, and convert between YAML and JSON instantly. Free online tool with detailed error messages, line numbers, and RFC compliance. No signup required.",
    shortDescription:
      "Validate, format, and convert between YAML and JSON instantly. Detailed error messages with line numbers.",
    badge: "DevOps",
    applicationCategory: "DeveloperApplication",
    keywords:
      "yaml validator, json validator, yaml to json converter, json to yaml converter, yaml formatter, json formatter, yaml syntax checker, json syntax checker, yaml online, json online, kubernetes yaml validator, docker compose validator, github actions yaml, yaml lint, json lint, yaml beautifier, json beautifier, yaml parser, json parser, yaml 1.2, RFC 8259, free yaml tool, online json tool, yaml error checker, json error checker",
    ogImage: "https://meysam.io/og/yaml-json.png",
    featureList: [
      "YAML 1.2 specification compliance",
      "JSON RFC 8259 compliance",
      "Bidirectional YAML/JSON conversion",
      "Detailed error messages with line numbers",
      "Auto-format detection",
      "Pretty-print formatting",
      "Copy to clipboard",
      "Download as file",
      "Client-side processing (data never leaves your browser)",
    ],
    faqs: [
      {
        question: "How do I validate YAML online?",
        answer:
          "Paste your YAML content into the input editor. The validator automatically detects YAML format and validates it against the YAML 1.2 specification. Any syntax errors will be displayed with line numbers and helpful suggestions for fixing them.",
      },
      {
        question: "How do I convert YAML to JSON?",
        answer:
          'Paste your YAML content and click the "Convert to JSON" button. The tool parses your YAML according to the YAML 1.2 spec and outputs valid JSON following RFC 8259. You can then copy or download the result.',
      },
      {
        question: "How do I convert JSON to YAML?",
        answer:
          'Paste your JSON content and click the "Convert to YAML" button. The tool validates your JSON against RFC 8259 and converts it to clean, properly indented YAML 1.2 format.',
      },
      {
        question: "What causes YAML syntax errors?",
        answer:
          "Common YAML errors include: incorrect indentation (YAML uses spaces, not tabs), missing colons after keys, unquoted special characters, improper list formatting, and duplicate keys. Our validator shows the exact line and column where errors occur.",
      },
      {
        question: "Is my data secure when using this validator?",
        answer:
          "Yes, absolutely. All validation and conversion happens entirely in your browser using JavaScript. Your data never leaves your device and is never sent to any server. This is a 100% client-side tool.",
      },
      {
        question: "What YAML version does this validator support?",
        answer:
          "This validator supports YAML 1.2, the latest stable version of the YAML specification. It handles all standard YAML features including anchors, aliases, multi-line strings, block scalars, and complex nested structures.",
      },
      {
        question: "Can I validate Kubernetes YAML files?",
        answer:
          "Yes! This tool validates the YAML syntax of Kubernetes manifests, Helm charts, Docker Compose files, GitHub Actions workflows, Ansible playbooks, and any other YAML-based configuration files. It checks for valid YAML structure (syntax validation) but not Kubernetes-specific schema validation.",
      },
      {
        question: "What is the difference between YAML and JSON?",
        answer:
          "YAML and JSON are both data serialization formats. Key differences: YAML uses indentation and is more human-readable; JSON uses braces/brackets. YAML supports comments (#); JSON does not. YAML supports more types (dates, timestamps). Valid JSON is valid YAML (YAML is a superset). YAML is preferred for config files; JSON for APIs.",
      },
    ],
    status: "published",
  },
  {
    slug: "saas-idea-validator",
    title: "SaaS Idea Validator",
    shortTitle: "Idea Validator",
    description:
      "Score your startup idea against 20 battle-tested validation criteria. Free checklist for technical founders to objectively assess ideas before building.",
    shortDescription:
      "Score your startup idea against 20 battle-tested criteria. Get objective feedback before you invest months building.",
    badge: "Founders",
    applicationCategory: "BusinessApplication",
    keywords:
      "validate startup idea, saas idea checklist, startup validation tool, idea scoring, product validation checklist, is my saas idea good, startup idea validator, founder validation framework, business idea assessment, market validation, problem validation, should I build this, startup feasibility, idea viability test, pre-launch validation, technical founder tools",
    ogImage: "https://meysam.io/og/saas-idea-validator.png",
    featureList: [
      "20 battle-tested validation criteria",
      "5 category scoring (Market, Problem, Solution, Distribution, Founder Fit)",
      "Real-time progress tracking",
      "Personalized recommendations",
      "Shareable results",
      "Save progress locally",
      "Keyboard navigation support",
      "100% client-side (data never leaves your browser)",
    ],
    faqs: [
      {
        question: "How do I validate my SaaS idea?",
        answer:
          "Validate your SaaS idea by answering 20 questions across 5 key areas: Market (who you're selling to), Problem (what pain you're solving), Solution (how you're solving it), Distribution (how you'll reach customers), and Founder Fit (your unique advantages). This tool scores each area and provides specific recommendations.",
      },
      {
        question: "What score means my startup idea is viable?",
        answer:
          "A score of 70% or higher suggests a strong foundation worth pursuing. Scores between 55-70% indicate promising concepts that need work in specific areas. Below 55% means significant validation is needed before building. The most important factor isn't the total score, but addressing any critical gaps in Problem or Distribution categories.",
      },
      {
        question: "What are the most important startup validation criteria?",
        answer:
          "The most critical validation criteria are: 1) Have you talked to potential customers about the problem? 2) Is there evidence people will pay? 3) Do you have a clear path to reach customers? 4) Is your solution meaningfully better than alternatives? These four questions predict startup success more than any others.",
      },
      {
        question: "Is my data secure when using this validator?",
        answer:
          "Yes, completely. This tool runs 100% in your browser. Your idea name, answers, and results are never sent to any server. All data stays on your device. You can optionally save progress to your browser's local storage for future sessions.",
      },
      {
        question: "Who created this startup validation framework?",
        answer:
          "This framework was created by Meysam Azad, a technical founder with 8+ years of DevOps/SRE experience who is documenting his journey from engineer to indie hacker. The criteria are based on lessons from successful founders, common failure patterns, and frameworks like The Mom Test.",
      },
    ],
    status: "published",
  },
  {
    slug: "social-preview",
    title: "Social Preview Generator",
    shortTitle: "OG Image Generator",
    description:
      "Generate beautiful Open Graph images for your tools, blog posts, and pages. Three professional variants to choose from. Free, no signup required.",
    shortDescription:
      "Create beautiful Open Graph images for your pages. Three professional variants with instant PNG export.",
    badge: "Marketing",
    applicationCategory: "DeveloperApplication",
    keywords:
      "social preview generator, og image generator, open graph image maker, twitter card generator, social media image creator, free og image tool, meta image generator, link preview image, social share image, facebook og image",
    ogImage: "https://meysam.io/og/social-preview.png",
    featureList: [
      "Three professional design variants",
      "Real-time preview",
      "1200x630 PNG export",
      "No signup required",
      "Free to use",
    ],
    faqs: [],
    status: "published",
  },
];

// Coming soon tools (displayed on index page)
export var comingSoonTools: ComingSoonTool[] = [
  {
    title: "MRR Calculator",
    description: "Calculate SaaS metrics, runway, and growth projections.",
    badge: "Coming Soon",
  },
  {
    title: "Startup Cost Estimator",
    description: "Estimate your monthly burn rate and runway for your SaaS.",
    badge: "Coming Soon",
  },
];

// Keywords for the tools index page
export var toolsIndexKeywords =
  "free developer tools, online devops tools, web developer utilities, cron generator, yaml validator, json converter, free online tools, no signup tools, developer productivity, devops utilities, sre tools, technical tools, software engineering tools, startup idea validator, saas validation checklist, founder tools, social preview generator, og image generator, open graph image maker";

// Helper functions
export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find(function findTool(tool) {
    return tool.slug === slug;
  });
}

/**
 * Get a tool by slug or throw an error if not found.
 * Use this in pages where the tool must exist.
 */
export function getToolBySlugOrThrow(slug: string): Tool {
  var tool = getToolBySlug(slug);
  if (!tool) {
    throw new Error(
      "Tool '" +
        slug +
        "' not found in tools.ts. " +
        "Available tools: " +
        tools
          .map(function getSlug(t) {
            return t.slug;
          })
          .join(", "),
    );
  }
  return tool;
}

export function getPublishedTools(): Tool[] {
  return tools.filter(function filterPublished(tool) {
    return tool.status === "published";
  });
}

/**
 * Generate WebApplication structured data for a tool
 */
export function generateToolStructuredData(tool: Tool): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.title,
    description: tool.description,
    url: "https://meysam.io/tools/" + tool.slug,
    applicationCategory: tool.applicationCategory,
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: tool.featureList,
    author: {
      "@type": "Person",
      name: "Meysam Azad",
      url: "https://meysam.io",
    },
  };
}

/**
 * Generate FAQPage structured data from FAQs
 */
export function generateFAQStructuredData(faqs: FAQItem[]): object | null {
  if (faqs.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(function mapFAQ(faq) {
      return {
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      };
    }),
  };
}

/**
 * Generate CollectionPage structured data for tools index
 */
export function generateToolsIndexStructuredData(): object {
  var publishedTools = getPublishedTools();

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Free Developer Tools",
    description:
      "Free tools for developers, DevOps engineers, and technical founders. No signup required.",
    url: "https://meysam.io/tools",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: publishedTools.map(function mapTool(tool, index) {
        return {
          "@type": "ListItem",
          position: index + 1,
          name: tool.title,
          url: "https://meysam.io/tools/" + tool.slug,
        };
      }),
    },
  };
}
