/**
 * Backlinks builder (R-F-24).
 *
 * Reads the raw markdown body of every entry, extracts wikilinks, resolves
 * each via the shared link index, and builds a reverse map of
 * targetUrl → list of source entries that link to it.
 *
 * Memoized at module scope so it runs once per Astro build process. Reading
 * `entry.body` directly (rather than going through render()) means we don't
 * depend on page-render order — backlinks are populated as soon as any
 * template asks for them.
 */

// `astro:content` is loaded dynamically — see comment in link-index.ts.
import { extractWikilinks } from './wikilinks.ts';
import { getLinkIndex, resolveWikilink } from './link-index.ts';
import { ALL_COLLECTIONS } from './urls.ts';

export interface BackrefSource {
  collection: string;
  id: string;
  title: string;
  url: string;
}

let cached: Promise<Map<string, BackrefSource[]>> | null = null;

export async function getBacklinksFor(targetUrl: string): Promise<BackrefSource[]> {
  const all = await getAllBacklinks();
  return all.get(targetUrl) ?? [];
}

export function getAllBacklinks(): Promise<Map<string, BackrefSource[]>> {
  if (!cached) cached = build();
  return cached;
}

async function build(): Promise<Map<string, BackrefSource[]>> {
  const { getCollection } = await import('astro:content');
  const linkIndex = await getLinkIndex();
  const refs = new Map<string, BackrefSource[]>();

  for (const collection of ALL_COLLECTIONS) {
    const entries = await getCollection(collection);
    for (const e of entries) {
      const body = (e as { body?: string }).body ?? '';
      if (!body) continue;
      const sourceEntry = linkIndex.all.find(
        (ie) => ie.collection === collection && ie.id === e.id,
      );
      if (!sourceEntry) continue;

      const sourceRef: BackrefSource = {
        collection,
        id: e.id,
        title: sourceEntry.title,
        url: sourceEntry.url,
      };

      const wikilinks = extractWikilinks(body);
      const seen = new Set<string>();
      for (const wl of wikilinks) {
        if (wl.isImage) continue; // image embeds are not cross-refs
        const result = resolveWikilink(wl.target, linkIndex);
        if (result.kind !== 'resolved') continue;
        const targetUrl = result.entry.url;
        if (targetUrl === sourceRef.url) continue; // skip self-links
        if (seen.has(targetUrl)) continue;          // dedupe within a source
        seen.add(targetUrl);
        const list = refs.get(targetUrl);
        if (list) list.push(sourceRef);
        else refs.set(targetUrl, [sourceRef]);
      }
    }
  }

  // Sort each backref list deterministically (by source title).
  for (const list of refs.values()) {
    list.sort((a, b) => a.title.localeCompare(b.title));
  }

  return refs;
}

/** Group backlinks by collection for the "Referenced by" rendering pattern. */
export function groupByCollection(refs: BackrefSource[]): Map<string, BackrefSource[]> {
  const grouped = new Map<string, BackrefSource[]>();
  for (const r of refs) {
    const list = grouped.get(r.collection);
    if (list) list.push(r);
    else grouped.set(r.collection, [r]);
  }
  return grouped;
}
