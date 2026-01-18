import { getCollection } from "astro:content";
import { filterPublishedPosts } from "@/utils/blog";
import type { APIRoute, GetStaticPaths } from "astro";

export var getStaticPaths: GetStaticPaths = async function getStaticPaths() {
  var posts = await getCollection("blog");
  var publishedPosts = filterPublishedPosts(posts);
  return publishedPosts.map(function mapPosts(post) {
    return {
      params: { slug: post.slug },
      props: { post },
    };
  });
};

export var GET: APIRoute = async function GET({ props }) {
  var { post } = props;
  var frontmatter = [
    "---",
    `title: "${post.data.title}"`,
    `description: "${post.data.description}"`,
    `date: ${post.data.pubDate.toISOString().split("T")[0]}`,
    `author: ${post.data.author}`,
    post.data.updatedDate
      ? `updated: ${post.data.updatedDate.toISOString().split("T")[0]}`
      : null,
    post.data.tags.length > 0
      ? `tags:\n${post.data.tags.map(function mapTag(tag) { return `  - ${tag}`; }).join("\n")}`
      : null,
    `url: https://meysam.io/blog/${post.slug}/`,
    "---",
  ]
    .filter(Boolean)
    .join("\n");

  var markdown = frontmatter + "\n" + post.body;

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `inline; filename="${post.slug}.md"`,
    },
  });
};
