/**
 * SVG to PNG Converter
 * Converts all SVG brand assets to PNG format for broader compatibility
 *
 * Requirements: npm install sharp
 * Usage: node convert-svgs.js
 */

import { mkdir } from "fs/promises";
import log from "loglevel";
import { join } from "path";
import sharp from "sharp";

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

  // Social Media Cover Photos
  {
    input: "covers/x-twitter-header.svg",
    output: "covers/x-twitter-header.png",
    width: 1500,
    height: 500,
  },
  {
    input: "covers/linkedin-cover.svg",
    output: "covers/linkedin-cover.png",
    width: 1584,
    height: 396,
  },
  {
    input: "covers/youtube-banner.svg",
    output: "covers/youtube-banner.png",
    width: 2560,
    height: 1440,
  },
  {
    input: "covers/facebook-cover.svg",
    output: "covers/facebook-cover.png",
    width: 820,
    height: 312,
  },
  {
    input: "covers/github-readme-banner.svg",
    output: "covers/github-readme-banner.png",
    width: 1280,
    height: 320,
  },
  {
    input: "covers/twitch-banner.svg",
    output: "covers/twitch-banner.png",
    width: 1200,
    height: 480,
  },
  {
    input: "covers/threads-header.svg",
    output: "covers/threads-header.png",
    width: 1500,
    height: 500,
  },
  {
    input: "covers/universal-banner.svg",
    output: "covers/universal-banner.png",
    width: 1200,
    height: 400,
  },
  {
    input: "covers/email-header.svg",
    output: "covers/email-header.png",
    width: 600,
    height: 200,
  },

  // Favicon sizes (from favicon.svg)
  { input: "favicon.svg", output: "favicon-32.png", width: 32, height: 32 },
  { input: "favicon.svg", output: "favicon-180.png", width: 180, height: 180 },
  { input: "favicon.svg", output: "favicon-192.png", width: 192, height: 192 },
  { input: "favicon.svg", output: "favicon-512.png", width: 512, height: 512 },
  {
    input: "favicon.svg",
    output: "favicon-1024.png",
    width: 1024,
    height: 1024,
  },
];

async function convertSVGtoPNG() {
  const publicDir = "./public";
  const coversDir = join(publicDir, "covers");

  // Ensure covers directory exists
  try {
    await mkdir(coversDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, that's fine
    log.warn(`⚠️ Could not create directory ${coversDir}:`, error.message);
  }

  log.info("🎨 Converting SVGs to PNGs...\n");

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

      log.info(`✅ ${conversion.input} → ${conversion.output}`);
      successful++;
    } catch (error) {
      log.error(`❌ Failed to convert ${conversion.input}:`, error.message);
      failed++;
    }
  }

  log.info(`\n📊 Conversion complete:`);
  log.info(`   Successful: ${successful}`);
  log.info(`   Failed: ${failed}`);

  if (successful > 0) {
    log.info(`\n✨ PNG files generated in ${publicDir}/`);
  }
}

// Run the conversion
convertSVGtoPNG().catch(log.error);
