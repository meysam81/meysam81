import { defineCollection, z } from "astro:content";

var blogCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default("Meysam Azad"),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    ogImage: z.string().optional(),
    slug: z.string().optional(),
    references: z
      .array(
        z.object({
          title: z.string(),
          url: z.string().url(),
          description: z.string().optional(),
        })
      )
      .default([]),
  }),
});

export var collections = {
  blog: blogCollection,
};
