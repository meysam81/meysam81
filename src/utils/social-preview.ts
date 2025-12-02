/**
 * Social Preview Generator Utility
 * Uses html-to-image to capture DOM elements as PNG images
 */

import { toPng, toBlob } from "html-to-image";

export interface SocialPreviewProps {
  // Required
  title: string;

  // Optional content
  subtitle?: string;
  description?: string;
  category?: string;

  // Optional metadata
  author?: string;
  url?: string;

  // Optional features
  features?: string[];

  // Visual customization
  icon?: "clock" | "code" | "chart" | "lightbulb" | "rocket" | "tool" | "none";

  // Variant selection
  variant?: "minimal" | "gradient" | "split";
}

export interface GeneratorOptions {
  quality?: number;
  pixelRatio?: number;
}

const DEFAULT_OPTIONS: GeneratorOptions = {
  quality: 0.95,
  pixelRatio: 2,
};

/**
 * Generate a PNG data URL from a DOM element
 */
export async function generatePreview(
  element: HTMLElement,
  options: GeneratorOptions = {},
): Promise<string> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  try {
    const dataUrl = await toPng(element, {
      width: 1200,
      height: 630,
      pixelRatio: mergedOptions.pixelRatio,
      cacheBust: true,
      backgroundColor: "#0a0a0a",
      style: {
        transform: "scale(1)",
        transformOrigin: "top left",
      },
    });
    return dataUrl;
  } catch (error) {
    throw new Error(`Failed to generate preview: ${error}`);
  }
}

/**
 * Generate a Blob from a DOM element
 */
export async function generatePreviewBlob(
  element: HTMLElement,
  options: GeneratorOptions = {},
): Promise<Blob> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  const blob = await toBlob(element, {
    width: 1200,
    height: 630,
    pixelRatio: mergedOptions.pixelRatio,
    cacheBust: true,
    backgroundColor: "#0a0a0a",
  });

  if (!blob) {
    throw new Error("Failed to generate blob");
  }

  return blob;
}

/**
 * Download a PNG from a DOM element
 */
export async function downloadPreview(
  element: HTMLElement,
  filename: string = "social-preview.png",
  options: GeneratorOptions = {},
): Promise<void> {
  const dataUrl = await generatePreview(element, options);

  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/**
 * Copy preview to clipboard as PNG
 */
export async function copyPreviewToClipboard(
  element: HTMLElement,
  options: GeneratorOptions = {},
): Promise<void> {
  const blob = await generatePreviewBlob(element, options);

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blob,
      }),
    ]);
  } catch (error) {
    throw new Error(`Failed to copy to clipboard: ${error}`);
  }
}

/**
 * SVG Icon paths for the preview variants
 */
export const ICONS = {
  clock: `<circle cx="60" cy="60" r="55" stroke="currentColor" stroke-width="4" fill="none"/>
    <line x1="60" y1="60" x2="60" y2="30" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
    <line x1="60" y1="60" x2="85" y2="75" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
    <circle cx="60" cy="60" r="5" fill="currentColor"/>`,

  code: `<polyline points="40 40 20 60 40 80" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <polyline points="80 40 100 60 80 80" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <line x1="65" y1="30" x2="55" y2="90" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`,

  chart: `<rect x="20" y="50" width="20" height="50" rx="4" fill="currentColor" opacity="0.5"/>
    <rect x="50" y="30" width="20" height="70" rx="4" fill="currentColor" opacity="0.7"/>
    <rect x="80" y="10" width="20" height="90" rx="4" fill="currentColor"/>`,

  lightbulb: `<path d="M60 15 L60 5" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
    <path d="M30 30 L22 22" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
    <path d="M90 30 L98 22" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
    <circle cx="60" cy="55" r="30" stroke="currentColor" stroke-width="4" fill="none"/>
    <path d="M45 85 L45 95 C45 100 50 105 60 105 C70 105 75 100 75 95 L75 85" stroke="currentColor" stroke-width="4" fill="none"/>`,

  rocket: `<path d="M60 100 L60 70" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
    <path d="M40 100 L60 70 L80 100" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <ellipse cx="60" cy="45" rx="20" ry="35" stroke="currentColor" stroke-width="4" fill="none"/>
    <circle cx="60" cy="40" r="8" fill="currentColor"/>`,

  tool: `<path d="M85 35 L105 15 L115 25 L95 45" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <rect x="25" y="55" width="50" height="50" rx="8" stroke="currentColor" stroke-width="4" fill="none" transform="rotate(-45 50 80)"/>`,

  none: "",
};
