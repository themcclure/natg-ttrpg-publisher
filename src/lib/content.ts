/**
 * Build-time content helpers that Astro's content collection API doesn't cover:
 *  - Season-meta files (_season.md) are loaded outside of collections.
 *  - PDF handouts are enumerated directly from the filesystem.
 *  - Episode IDs are extracted from handout paths.
 *
 * All paths are resolved relative to the repo root so these helpers work
 * regardless of where they're imported from.
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const contentRoot = resolve(repoRoot, 'src/content');
const episodesRoot = resolve(contentRoot, 'episodes');
const handoutsRoot = resolve(contentRoot, 'handouts');

export interface SeasonMeta {
  season: string;       // canonical form, e.g. "S00"
  displayName: string;  // e.g. "Pilot" or fallback "Season 00"
}

/**
 * Loads _season.md for a given season code. Falls back to a default
 * displayName if the file or the field is absent (R-F-16).
 */
export async function loadSeason(season: string): Promise<SeasonMeta> {
  const fallback = `Season ${season.replace(/^S/, '')}`;
  const seasonFile = resolve(episodesRoot, season, '_season.md');
  if (!existsSync(seasonFile)) {
    return { season, displayName: fallback };
  }
  const raw = await readFile(seasonFile, 'utf8');
  const { data } = matter(raw);
  const displayName = typeof data.displayName === 'string' ? data.displayName : fallback;
  return { season, displayName };
}

/**
 * Lists all seasons present in src/content/episodes/ by looking for S##
 * directories. Each result includes the resolved display name.
 */
export async function listSeasons(): Promise<SeasonMeta[]> {
  if (!existsSync(episodesRoot)) return [];
  const entries = await readdir(episodesRoot, { withFileTypes: true });
  const seasons = entries
    .filter((e) => e.isDirectory() && /^S\d{2}$/.test(e.name))
    .map((e) => e.name)
    .sort();
  return Promise.all(seasons.map(loadSeason));
}

export interface PdfHandout {
  episode: string;     // e.g. "S00E01"
  filename: string;    // e.g. "briefing-packet.pdf"
  size: number;        // bytes
  path: string;        // absolute path on disk
}

/**
 * Lists PDF handouts, optionally scoped to a single episode (R-F-31).
 * Returns an empty array if the handouts/ tree is missing.
 */
export async function listPdfHandouts(episode?: string): Promise<PdfHandout[]> {
  if (!existsSync(handoutsRoot)) return [];
  const episodeDirs = episode
    ? [episode]
    : (await readdir(handoutsRoot, { withFileTypes: true }))
        .filter((e) => e.isDirectory() && /^S\d{2}E\d{2}$/.test(e.name))
        .map((e) => e.name)
        .sort();

  const results: PdfHandout[] = [];
  for (const ep of episodeDirs) {
    const epDir = resolve(handoutsRoot, ep);
    if (!existsSync(epDir)) continue;
    const files = await readdir(epDir);
    for (const f of files) {
      if (!f.toLowerCase().endsWith('.pdf')) continue;
      const p = resolve(epDir, f);
      const s = await stat(p);
      results.push({ episode: ep, filename: f, size: s.size, path: p });
    }
  }
  return results;
}

/**
 * Extracts the S##E## episode code from a handout's content collection ID.
 * Handout IDs look like "S00E01/captains-log"; this returns "S00E01" or null.
 */
export function episodeFromHandoutId(id: string): string | null {
  const m = id.match(/^(S\d{2}E\d{2})\//);
  return m ? (m[1] ?? null) : null;
}
