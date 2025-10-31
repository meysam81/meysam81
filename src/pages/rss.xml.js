import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { filterPublishedPosts } from "@/utils/blog";

export async function GET(context) {
  var posts = await getCollection("blog");
  var publishedPosts = filterPublishedPosts(posts);

  return rss({
    title: "Meysam Azad - Shipping SaaS with DevOps Discipline",
    description:
      "Customer discovery, product validation, and building in public from a DevOps engineer turned indie hacker. Real insights from 8 years managing production systems applied to bootstrapped SaaS development.",
    site: context.site,
    items: publishedPosts.map(function prepareRSSItem(post) {
      return {
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: post.data.description,
        link: `/blog/${post.slug}/`,
      };
    }),
  });
}
