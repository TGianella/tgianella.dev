import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      thumbnail: image().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      coAuthors: z
        .array(
          z.object({
            name: z.string(),
            url: z.string().url().optional(),
            picture: z.string().optional(),
          }),
        )
        .default([]),
      firstPublishedIn: z
        .object({
          name: z.string(),
          url: z.string().url().optional(),
        })
        .optional(),
    }),
});

const talks = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/talks" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      abstract: z.string(),
      thumbnail: image().optional(),
      tags: z.array(z.string()).default([]),
      coSpeakers: z
        .array(
          z.object({
            name: z.string(),
            url: z.string().url().optional(),
            picture: z.string().optional(), // image URL
          }),
        )
        .default([]),
      slides: z.string().url().optional(),
      featuredVideo: z.string().optional(), // YouTube ID — manually chosen
      events: z
        .array(
          z.object({
            date: z.coerce.date(),
            name: z.string(),
            url: z.string().url().optional(),
            location: z.string(),
            scope: z
              .enum(["internal", "regional", "national"])
              .default("national"),
            videoId: z.string().optional(),
            timestamp: z.number().optional(), // seconds
            duration: z.number(),
          }),
        )
        .default([]),
    }),
});

const gallery = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/gallery" }),
  schema: z.object({
    src: z.string(),
    alt: z.string(),
    width: z.number(),
    height: z.number(),
    date: z.coerce.date(),
    location: z.string().optional(),
    caption: z.string().optional(),
  }),
});

export const collections = { blog, talks, gallery };
