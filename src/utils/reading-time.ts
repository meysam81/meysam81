export function calculateReadingTime(content: string): number {
  var wordsPerMinute = 200;
  var words = content.trim().split(/\s+/).length;
  var minutes = Math.ceil(words / wordsPerMinute);
  return minutes;
}
