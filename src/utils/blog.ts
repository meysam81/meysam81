import type { CollectionEntry } from "astro:content";

/**
 * Filter and sort blog posts for production.
 * In dev mode, shows all posts. In production, hides drafts and future-dated posts.
 */
export function filterPublishedPosts(
  posts: CollectionEntry<"blog">[],
): CollectionEntry<"blog">[] {
  var now = new Date();

  return posts
    .filter(function filterPosts(post) {
      if (import.meta.env.DEV) {
        return true;
      }
      var isFuture = post.data.pubDate > now;
      return !post.data.draft && !isFuture;
    })
    .sort(function sortPosts(a, b) {
      return b.data.pubDate.getTime() - a.data.pubDate.getTime();
    });
}

/**
 * Format a date for display in the blog.
 * Returns format like "Jan 15, 2025"
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/**
 * Extract all unique tags from an array of posts, sorted alphabetically.
 */
export function getAllTags(posts: CollectionEntry<"blog">[]): string[] {
  return [
    ...new Set(
      posts.flatMap(function flatMapTags(post) {
        return post.data.tags || [];
      }),
    ),
  ].sort();
}

/**
 * Filter posts by a specific tag.
 */
export function getPostsByTag(
  posts: CollectionEntry<"blog">[],
  tag: string,
): CollectionEntry<"blog">[] {
  return posts.filter(function filterByTag(post) {
    return post.data.tags?.includes(tag);
  });
}

/**
 * Split posts into featured and regular groups.
 */
export function splitByFeatured(posts: CollectionEntry<"blog">[]) {
  return {
    featured: posts.filter(function filterFeatured(post) {
      return post.data.featured;
    }),
    regular: posts.filter(function filterRegular(post) {
      return !post.data.featured;
    }),
  };
}
