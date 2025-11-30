import type { CollectionEntry } from "astro:content";

// when duplicate slugs are found, add a deterministic 6-char hash suffix to make them unique
var slugToFilepath: Record<string, string> = {};

export function filterPublishedPosts(
  posts: CollectionEntry<"blog">[]
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
    .map(function mapPosts(post) {
      var slug = post.data.slug;
      if (slug in slugToFilepath) {
        var existingPath = slugToFilepath[slug];
        var combined = slug + existingPath;
        var hash = Array.from(combined)
          .reduce(function hashReducer(acc, char) {
            return acc + char.charCodeAt(0);
          }, 0)
          .toString(16)
          .slice(-6);
        slug = `${slug}-${hash}`;
      }
      slugToFilepath[slug] = post.filePath;
      return {
        ...post,
        data: {
          ...post.data,
          slug: slug,
        },
      };
    })
    .sort(function sortPosts(a, b) {
      return b.data.pubDate.getTime() - a.data.pubDate.getTime();
    });
}
