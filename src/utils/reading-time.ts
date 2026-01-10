var WORDS_PER_MINUTE = 200;

/**
 * Calculate reading time in minutes for a given text content.
 */
export function calculateReadingTime(content: string): number {
  var words = content.trim().split(/\s+/).length;
  var minutes = Math.ceil(words / WORDS_PER_MINUTE);
  return minutes;
}

/**
 * Format reading time as a human-readable string (e.g., "5 min read")
 */
export function formatReadingTime(content: string): string {
  return calculateReadingTime(content) + " min read";
}

/**
 * Calculate total reading time for multiple content pieces (e.g., series posts)
 */
export function calculateTotalReadingTime(contents: string[]): number {
  var totalWords = contents.reduce(function sumWords(acc, content) {
    return acc + content.trim().split(/\s+/).length;
  }, 0);
  return Math.ceil(totalWords / WORDS_PER_MINUTE);
}
