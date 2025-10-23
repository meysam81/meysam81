/**
 * SVG to PNG Converter
 * Converts all SVG brand assets to PNG format for broader compatibility
 *
 * Requirements: npm install sharp
 * Usage: node convert-svgs.js
 */

import log from "loglevel";
import sharp from "sharp";

import { access, constants } from "fs/promises";
import { basename, dirname, extname, join } from "path";

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

async function isValidSVG(filepath) {
  try {
    await access(filepath, constants.R_OK);
    var extension = extname(filepath).toLowerCase();
    return extension === ".svg";
  } catch (error) {
    log.error(`File access error for ${filepath}:`, error);
    return false;
  }
}

async function convertCustomSVG(filepath, customWidth, customHeight) {
  var filename = basename(filepath, ".svg");
  var dir = dirname(filepath);
  var outputPath = join(dir, `${filename}.png`);

  try {
    var metadata = await sharp(filepath).metadata();
    var width = customWidth || metadata.width || 1024;
    var height = customHeight || metadata.height || 1024;

    var resizeOptions = {
      width: width,
      height: height,
      fit: "inside",
      withoutEnlargement: false,
    };

    if (customWidth && customHeight) {
      resizeOptions.fit = "fill";
    } else if (customWidth || customHeight) {
      resizeOptions.fit = "inside";
    }

    await sharp(filepath)
      .resize(resizeOptions)
      .png()
      .toFile(outputPath);

    log.info(
      `Successfully converted ${filepath} to ${outputPath} (${width}x${height})`
    );
    return true;
  } catch (error) {
    log.error(`Failed to convert ${filepath}:`, error);
    return false;
  }
}

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

function parseArguments(args) {
  var filepaths = [];
  var width = null;
  var height = null;

  for (var i = 0; i < args.length; i++) {
    var arg = args[i];

    if (arg === "--width" || arg === "-w") {
      i++;
      if (i < args.length) {
        var parsedWidth = parseInt(args[i], 10);
        if (!isNaN(parsedWidth) && parsedWidth > 0) {
          width = parsedWidth;
        }
      }
    } else if (arg === "--height" || arg === "-h") {
      i++;
      if (i < args.length) {
        var parsedHeight = parseInt(args[i], 10);
        if (!isNaN(parsedHeight) && parsedHeight > 0) {
          height = parsedHeight;
        }
      }
    } else {
      filepaths.push(arg);
    }
  }

  return { filepaths: filepaths, width: width, height: height };
}

async function main() {
  var args = process.argv.slice(2);

  if (args.length === 0) {
    await convertSVGtoPNG();
  } else {
    var parsed = parseArguments(args);
    var successful = 0;
    var failed = 0;

    for (var i = 0; i < parsed.filepaths.length; i++) {
      var filepath = parsed.filepaths[i];
      var isValid = await isValidSVG(filepath);

      if (isValid) {
        var result = await convertCustomSVG(filepath, parsed.width, parsed.height);
        if (result) {
          successful++;
        } else {
          failed++;
        }
      } else {
        log.error(`Invalid or inaccessible SVG file: ${filepath}`);
        failed++;
      }
    }

    log.info(
      `Custom SVG conversion completed: ${successful} successful, ${failed} failed.`
    );
  }
}

// Run the conversion
// eslint-disable-next-line no-console
main().catch(console.error);
