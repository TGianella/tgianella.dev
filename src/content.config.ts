import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    cover: z.string().optional(), // R2 image URL
    coverAlt: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const talks = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/talks' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    abstract: z.string(),
    thumbnail: z.string().optional(), // image URL
    tags: z.array(z.string()).default([]),
    coSpeakers: z.array(z.object({
      name: z.string(),
      url: z.string().url().optional(),
    })).default([]),
    slides: z.string().url(),
    featuredVideo: z.string().optional(), // YouTube ID — manually chosen
    events: z.array(z.object({
      date: z.coerce.date(),
      name: z.string(),
      url: z.string().url().optional(),
      location: z.string(),
      scope: z.enum(['internal', 'regional', 'national']).default('national'),
      videoId: z.string().optional(),
      timestamp: z.number().optional(), // seconds
      duration: z.number(),
    })).min(1),
  }),
});

const gallery = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/gallery' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    coverImage: z.string(), // R2 image URL
    coverImageAlt: z.string(),
    date: z.coerce.date(),
    photos: z.array(
      z.object({
        src: z.string(), // R2 image URL
        alt: z.string(),
        caption: z.string().optional(),
        width: z.number(),
        height: z.number(),
      })
    ),
  }),
});

export const collections = { blog, talks, gallery };
