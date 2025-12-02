import type { CollectionEntry } from "astro:content";

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
