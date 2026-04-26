/**
 * Wikilink resolver index (ADR-0002).
 *
 * Walks src/content/ via node:fs and parses frontmatter with gray-matter.
 * Deliberately does NOT import from `astro:content` — the remark plugin
 * that uses this index runs outside Astro's Vite context, where the
 * virtual module isn't resolvable.
 *
 * Memoized at module scope: built once per Astro build process.
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import matter from 'gray-matter';
import { normalizeKey } from './wikilinks.ts';
import { slugify } from './slugify.ts';
import { entityUrl, ALL_COLLECTIONS, type CollectionName } from './urls.ts';

export interface IndexEntry {
  collection: CollectionName;
  id: string;
  title: string;
  url: string;
  basename: string; // last path segment of id, lowercased
}

export interface LinkIndex {
  byFilename: Map<string, IndexEntry[]>;
  byScopedKey: Map<string, IndexEntry[]>;
  byTitle: Map<string, IndexEntry[]>;
  byAlias: Map<string, IndexEntry[]>;
  all: IndexEntry[];
}

export type ResolveResult =
  | { kind: 'resolved'; entry: IndexEntry; tier: 'filename' | 'scoped' | 'title' | 'alias' }
  | { kind: 'broken'; target: string }
  | { kind: 'ambiguous'; target: string; candidates: IndexEntry[]; tier: 'filename' | 'scoped' | 'title' | 'alias' };

// Resolve relative to the Astro project root rather than this file's path.
// Astro bundles src/lib modules into dist/.prerender/chunks/ during build, so
// `import.meta.url` doesn't reliably point back to src/. process.cwd() is the
// project root throughout `npm run build`.
const contentRoot = resolve(process.cwd(), 'src/content');

let cached: Promise<LinkIndex> | null = null;

export function getLinkIndex(): Promise<LinkIndex> {
  if (!cached) cached = build();
  return cached;
}

async function build(): Promise<LinkIndex> {
  const byFilename = new Map<string, IndexEntry[]>();
  const byScopedKey = new Map<string, IndexEntry[]>();
  const byTitle = new Map<string, IndexEntry[]>();
  const byAlias = new Map<string, IndexEntry[]>();
  const all: IndexEntry[] = [];

  for (const collection of ALL_COLLECTIONS) {
    const items = await listCollection(collection);
    for (const { id, absPath } of items) {
      const raw = await readFile(absPath, 'utf8');
      const { data } = matter(raw);
      const title = typeof data.title === 'string' && data.title.trim() !== ''
        ? data.title
        : id;
      const aliases = Array.isArray(data.aliases) ? (data.aliases as unknown[]).filter((a): a is string => typeof a === 'string') : [];
      const basename = (id.split('/').pop() ?? id).toLowerCase();

      const entry: IndexEntry = {
        collection,
        id,
        title,
        url: entityUrl(collection, id),
        basename,
      };
      all.push(entry);

      pushTo(byFilename, normalizeKey(basename), entry);
      pushTo(byScopedKey, normalizeKey(`${collection}/${basename}`), entry);
      pushTo(byTitle, normalizeKey(title), entry);
      for (const alias of aliases) pushTo(byAlias, normalizeKey(alias), entry);
    }
  }

  return { byFilename, byScopedKey, byTitle, byAlias, all };
}

interface ListedItem {
  id: string;
  absPath: string;
}

async function listCollection(collection: CollectionName): Promise<ListedItem[]> {
  const dir = resolve(contentRoot, collection);
  if (!existsSync(dir)) return [];

  if (collection === 'episodes') {
    // Episodes are addressed as folder-per-episode with index.md inside.
    const out: ListedItem[] = [];
    const dirents = await readdir(dir, { withFileTypes: true });
    for (const d of dirents) {
      if (!d.isDirectory() || !/^S\d{2}E\d{2}$/.test(d.name)) continue;
      const indexPath = resolve(dir, d.name, 'index.md');
      if (existsSync(indexPath)) out.push({ id: d.name, absPath: indexPath });
    }
    return out;
  }

  if (collection === 'handouts') {
    // Handouts addressed as <S##E##>/<slugified-filename>.
    const out: ListedItem[] = [];
    const dirents = await readdir(dir, { withFileTypes: true });
    for (const d of dirents) {
      if (!d.isDirectory() || !/^S\d{2}E\d{2}$/.test(d.name)) continue;
      const epDir = resolve(dir, d.name);
      const files = await readdir(epDir);
      for (const f of files) {
        if (!f.endsWith('.md')) continue;
        if (f.startsWith('_') || f.startsWith('.')) continue;
        const slug = slugify(f);
        if (!slug) continue;
        out.push({ id: `${d.name}/${slug}`, absPath: resolve(epDir, f) });
      }
    }
    return out;
  }

  // Default: flat *.md at the top level of the collection folder.
  const out: ListedItem[] = [];
  const files = await readdir(dir);
  for (const f of files) {
    if (!f.endsWith('.md')) continue;
    if (f.startsWith('_') || f.startsWith('.')) continue;
    const abs = resolve(dir, f);
    const s = await stat(abs);
    if (!s.isFile()) continue;
    const id = f.replace(/\.md$/i, '');
    out.push({ id, absPath: abs });
  }
  return out;
}

function pushTo(map: Map<string, IndexEntry[]>, key: string, entry: IndexEntry): void {
  if (!key) return;
  const existing = map.get(key);
  if (existing) existing.push(entry);
  else map.set(key, [entry]);
}

export function resolveWikilink(target: string, index: LinkIndex): ResolveResult {
  const trimmed = target.trim();
  if (!trimmed) return { kind: 'broken', target };

  if (trimmed.includes('/')) {
    const key = normalizeKey(trimmed);
    const hits = index.byScopedKey.get(key);
    if (hits && hits.length > 0) {
      if (hits.length === 1) return { kind: 'resolved', entry: hits[0]!, tier: 'scoped' };
      return { kind: 'ambiguous', target, candidates: hits, tier: 'scoped' };
    }
  }

  const key = normalizeKey(trimmed);
  if (!key) return { kind: 'broken', target };

  const fnHits = index.byFilename.get(key);
  if (fnHits && fnHits.length > 0) {
    if (fnHits.length === 1) return { kind: 'resolved', entry: fnHits[0]!, tier: 'filename' };
    return { kind: 'ambiguous', target, candidates: fnHits, tier: 'filename' };
  }

  const tHits = index.byTitle.get(key);
  if (tHits && tHits.length > 0) {
    if (tHits.length === 1) return { kind: 'resolved', entry: tHits[0]!, tier: 'title' };
    return { kind: 'ambiguous', target, candidates: tHits, tier: 'title' };
  }

  const aHits = index.byAlias.get(key);
  if (aHits && aHits.length > 0) {
    if (aHits.length === 1) return { kind: 'resolved', entry: aHits[0]!, tier: 'alias' };
    return { kind: 'ambiguous', target, candidates: aHits, tier: 'alias' };
  }

  return { kind: 'broken', target };
}
