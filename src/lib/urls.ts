/**
 * Stable URL construction for content collection entries. Centralized here
 * so the link index, breadcrumb builder, and routing pages all agree.
 */

export type CollectionName =
  | 'characters'
  | 'npcs'
  | 'factions'
  | 'locations'
  | 'starships'
  | 'timelines'
  | 'episodes'
  | 'handouts';

export const ALL_COLLECTIONS: readonly CollectionName[] = [
  'characters', 'npcs', 'factions', 'locations',
  'starships', 'timelines', 'episodes', 'handouts',
] as const;

/**
 * Build the canonical URL for a given collection entry id.
 * For episodes/handouts, the season segment is derived from the id.
 */
export function entityUrl(collection: CollectionName, id: string): string {
  switch (collection) {
    case 'characters':
      return `/characters/${id}/`;
    case 'npcs':
      return `/encyclopedia/npcs/${id}/`;
    case 'factions':
      return `/encyclopedia/factions/${id}/`;
    case 'locations':
      return `/encyclopedia/locations/${id}/`;
    case 'starships':
      return `/encyclopedia/starships/${id}/`;
    case 'timelines':
      return `/encyclopedia/timelines/${id}/`;
    case 'episodes': {
      const season = id.slice(0, 3);
      return `/episodes/${season}/${id}/`;
    }
    case 'handouts': {
      // Handout ids look like "S00E01/captains-log".
      const parts = id.split('/');
      const episode = parts[0] ?? '';
      const slug = parts.slice(1).join('-');
      const season = episode.slice(0, 3);
      return `/episodes/${season}/${episode}/handouts/${slug}/`;
    }
  }
}
