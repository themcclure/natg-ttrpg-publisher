import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';

// Shared frontmatter across every markdown collection (see specs/03-content-model.md).
// `title` is the only universally-required field in v1 — everything else stays
// optional until real-world data reveals which fields are de facto required
// (see the schema-tightening checkpoint in 06-build-plan.md § Scheduled revisits).
const base = z.object({
  title: z.string().min(1, 'title is required and must be non-empty'),
  aliases: z.array(z.string()).optional(),
  summary: z.string().optional(),
  portrait: z.string().optional(),
});

const npcSchema = base.extend({
  species: z.string().optional(),
  affiliation: z.string().optional(),
  role: z.string().optional(),
});

const characterSchema = npcSchema.extend({
  // R-F-15: first-name-only exception to R-NF-09.
  player: z.string().optional(),
});

const factionSchema = base.extend({
  kind: z.string().optional(),
});

const locationSchema = base.extend({
  kind: z.string().optional(),
  sovereignty: z.string().optional(),
  container: z.string().optional(),
});

const starshipSchema = base.extend({
  class: z.string().optional(),
  registry: z.string().optional(),
  affiliation: z.string().optional(),
});

const timelineSchema = base.extend({
  scope: z.string().optional(),
});

// Handouts: markdown only. PDFs in the same tree are enumerated separately
// by src/lib/content.ts#listPdfHandouts since they carry no frontmatter.
const handoutSchema = base.extend({
  episode: z.string().optional(), // derived from parent folder if absent (R-F-11)
  kind: z.string().optional(),
});

// YAML parses an unquoted `2026-04-20` as a Date object, but our schema
// contract (specs/03-content-model.md) is that airDate is a YYYY-MM-DD
// string downstream. Accept both forms at parse time; normalize to string;
// then validate the format strictly.
const isoDate = z
  .union([z.string(), z.date()])
  .transform((val) => (val instanceof Date ? val.toISOString().slice(0, 10) : val))
  .pipe(
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'airDate must be YYYY-MM-DD')
      .refine((s) => !Number.isNaN(Date.parse(s)), 'airDate must be a real calendar date'),
  );

const episodeSchema = z.object({
  episode: z.string().regex(/^S\d{2}E\d{2}$/, 'episode must match S##E##'),
  title: z.string(),
  airDate: isoDate,
  teaser: z.string(),
  aliases: z.array(z.string()).optional(),
  portrait: z.string().optional(),
});

export const collections = {
  characters: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/characters' }),
    schema: characterSchema,
  }),
  npcs: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/npcs' }),
    schema: npcSchema,
  }),
  factions: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/factions' }),
    schema: factionSchema,
  }),
  locations: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/locations' }),
    schema: locationSchema,
  }),
  starships: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/starships' }),
    schema: starshipSchema,
  }),
  timelines: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/timelines' }),
    schema: timelineSchema,
  }),
  handouts: defineCollection({
    // Preserve the S##E## episode-folder case while lowercasing the handout
    // slug, so IDs look like "S00E01/captains-log". Matches how episode pages
    // address handouts and keeps episodeFromHandoutId() correct.
    loader: glob({
      pattern: '**/*.md',
      base: './src/content/handouts',
      generateId: ({ entry }) => {
        const withoutExt = entry.replace(/\.md$/i, '');
        const parts = withoutExt.split(/[\\/]/);
        const name = parts.pop() ?? '';
        const slug = name
          .toLowerCase()
          .replace(/[\s_]+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        return [...parts, slug].join('/');
      },
    }),
    schema: handoutSchema,
  }),
  episodes: defineCollection({
    // Only S##E##/index.md under episodes/. Season-meta files (_season.md
    // inside S##/ folders) are loaded separately via src/lib/content.ts.
    loader: glob({
      pattern: '*/index.md',
      base: './src/content/episodes',
      generateId: ({ entry }) => entry.split(/[\\/]/)[0],
    }),
    schema: episodeSchema,
  }),
};
