/**
 * Episode-collection helpers. Uses Astro's content collection API, so these
 * are only callable from Astro pages/components.
 */

import { getCollection, type CollectionEntry } from 'astro:content';
import { loadSeason, type SeasonMeta } from './content.ts';

type Episode = CollectionEntry<'episodes'>;

/**
 * Returns the episode with the highest S##E## code, per R-F-44.
 */
export async function getCurrentEpisode(): Promise<Episode | null> {
  const episodes = await getCollection('episodes');
  if (episodes.length === 0) return null;
  return episodes.reduce((current, candidate) =>
    candidate.data.episode > current.data.episode ? candidate : current,
  );
}

export interface SeasonGroup {
  meta: SeasonMeta;
  episodes: Episode[];
}

/**
 * Groups episodes by season (S##) in ascending order, with each group's
 * episodes sorted ascending by S##E## within it.
 */
export async function groupEpisodesBySeason(): Promise<SeasonGroup[]> {
  const episodes = await getCollection('episodes');
  const bySeason = new Map<string, Episode[]>();
  for (const ep of episodes) {
    const season = ep.data.episode.slice(0, 3); // S00E01 → S00
    if (!bySeason.has(season)) bySeason.set(season, []);
    bySeason.get(season)!.push(ep);
  }

  const sortedSeasons = [...bySeason.keys()].sort();
  const groups: SeasonGroup[] = [];
  for (const season of sortedSeasons) {
    const meta = await loadSeason(season);
    const eps = bySeason.get(season)!.sort((a, b) =>
      a.data.episode.localeCompare(b.data.episode),
    );
    groups.push({ meta, episodes: eps });
  }
  return groups;
}

/**
 * Extracts the season prefix (S##) from an episode code (S##E##).
 */
export function seasonOf(episodeCode: string): string {
  return episodeCode.slice(0, 3);
}
