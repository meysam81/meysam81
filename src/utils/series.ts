import type { CollectionEntry } from "astro:content";
import { slugify } from "./slug";

export interface SeriesInfo {
  name: string;
  slug: string;
  currentOrder: number;
  totalPosts: number;
  prevPost: CollectionEntry<"blog"> | null;
  nextPost: CollectionEntry<"blog"> | null;
}

export interface SeriesSummary {
  name: string;
  slug: string;
  postCount: number;
  posts: CollectionEntry<"blog">[];
}

/**
 * Get all posts belonging to a specific series, sorted by seriesOrder
 */
export function getPostsBySeries(
  posts: CollectionEntry<"blog">[],
  seriesSlug: string
): CollectionEntry<"blog">[] {
  return posts
    .filter(function filterBySeries(post) {
      if (!post.data.series) {
        return false;
      }
      return slugify(post.data.series) === seriesSlug;
    })
    .sort(function sortByOrder(a, b) {
      var orderA = a.data.seriesOrder ?? 999;
      var orderB = b.data.seriesOrder ?? 999;
      return orderA - orderB;
    });
}

/**
 * Get series information for a specific post (prev/next navigation, position)
 */
export function getSeriesInfo(
  posts: CollectionEntry<"blog">[],
  currentPost: CollectionEntry<"blog">
): SeriesInfo | null {
  if (!currentPost.data.series) {
    return null;
  }

  var seriesSlug = slugify(currentPost.data.series);
  var seriesPosts = getPostsBySeries(posts, seriesSlug);

  if (seriesPosts.length === 0) {
    return null;
  }

  var currentIndex = seriesPosts.findIndex(function findCurrent(post) {
    return post.slug === currentPost.slug;
  });

  if (currentIndex === -1) {
    return null;
  }

  return {
    name: currentPost.data.series,
    slug: seriesSlug,
    currentOrder: currentPost.data.seriesOrder ?? (currentIndex + 1),
    totalPosts: seriesPosts.length,
    prevPost: currentIndex > 0 ? seriesPosts[currentIndex - 1] : null,
    nextPost:
      currentIndex < seriesPosts.length - 1
        ? seriesPosts[currentIndex + 1]
        : null,
  };
}

/**
 * Get all unique series from posts with their metadata
 */
export function getAllSeries(
  posts: CollectionEntry<"blog">[]
): SeriesSummary[] {
  var seriesMap = new Map<string, SeriesSummary>();

  posts.forEach(function processPosts(post) {
    if (!post.data.series) {
      return;
    }

    var slug = slugify(post.data.series);

    if (!seriesMap.has(slug)) {
      seriesMap.set(slug, {
        name: post.data.series,
        slug: slug,
        postCount: 0,
        posts: [],
      });
    }

    var series = seriesMap.get(slug)!;
    series.postCount++;
    series.posts.push(post);
  });

  // Sort posts within each series by seriesOrder
  seriesMap.forEach(function sortSeriesPosts(series) {
    series.posts.sort(function sortByOrder(a, b) {
      var orderA = a.data.seriesOrder ?? 999;
      var orderB = b.data.seriesOrder ?? 999;
      return orderA - orderB;
    });
  });

  return Array.from(seriesMap.values()).sort(function sortByName(a, b) {
    return a.name.localeCompare(b.name);
  });
}
