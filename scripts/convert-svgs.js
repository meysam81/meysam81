/**
 * SVG to PNG Converter
 * Converts all SVG brand assets to PNG format for broader compatibility
 *
 * Requirements: npm install sharp
 * Usage: node convert-svgs.js
 */

import sharp from "sharp";
import log from "loglevel";

import { join } from "path";

const conversions = [
  // OG Images (1200x630)
  { input: "og-image.svg", output: "og-image.png", width: 1200, height: 630 },
  {
    input: "og-image-links.svg",
    output: "og-image-links.png",
    width: 1200,
    height: 630,
  },
  {
    input: "og-image-newsletter.svg",
    output: "og-image-newsletter.png",
    width: 1200,
    height: 630,
  },

  // Profile/Avatar (multiple sizes)
  {
    input: "profile-image.svg",
    output: "profile-image-1000.png",
    width: 1000,
    height: 1000,
  },
  {
    input: "profile-image.svg",
    output: "profile-image-512.png",
    width: 512,
    height: 512,
  },
  {
    input: "profile-image.svg",
    output: "profile-image-256.png",
    width: 256,
    height: 256,
  },

  // Logo variations
  {
    input: "logo-horizontal.svg",
    output: "logo-horizontal.png",
    width: 400,
    height: 100,
  },
  {
    input: "logo-mark.svg",
    output: "logo-mark-200.png",
    width: 200,
    height: 200,
  },
  {
    input: "logo-mark.svg",
    output: "logo-mark-512.png",
    width: 512,
    height: 512,
  },

  // Banner
  { input: "banner.svg", output: "banner.png", width: 1280, height: 640 },

  // Favicon sizes (from favicon.svg)
  { input: "favicon.svg", output: "favicon-32.png", width: 32, height: 32 },
  { input: "favicon.svg", output: "favicon-180.png", width: 180, height: 180 },
  { input: "favicon.svg", output: "favicon-192.png", width: 192, height: 192 },
  { input: "favicon.svg", output: "favicon-512.png", width: 512, height: 512 },
];

async function convertSVGtoPNG() {
  const publicDir = "./public";

  let successful = 0;
  let failed = 0;

  for (const conversion of conversions) {
    const inputPath = join(publicDir, conversion.input);
    const outputPath = join(publicDir, conversion.output);

    try {
      await sharp(inputPath)
        .resize(conversion.width, conversion.height)
        .png()
        .toFile(outputPath);

      successful++;
    } catch (error) {
      log.error(
        `Failed to convert ${conversion.input} to ${conversion.output}:`,
        error
      );
      failed++;
    }
  }

  log.info(
    `SVG to PNG conversion completed: ${successful} successful, ${failed} failed.`
  );
}

// Run the conversion
// eslint-disable-next-line no-console
convertSVGtoPNG().catch(console.error);
