/**
 * Location hierarchy (R-F-17 + container field, locations content model).
 *
 * Resolves each location's `container` reference into a parent edge,
 * accumulates the reverse "contains" relation, computes ancestor chains
 * for breadcrumbs, and detects cycles. Container cycles are a HARD FAIL
 * — they're structural errors, not authoring drift (R-NF-18).
 */

// `astro:content` is loaded dynamically — see comment in link-index.ts.
import { resolve } from 'node:path';
import { normalizeKey } from './wikilinks.ts';
import { entityUrl } from './urls.ts';

export interface LocationNode {
  id: string;
  title: string;
  url: string;
  containerRaw: string | null;     // as authored
  parent: LocationNode | null;     // resolved (null for top-level or unresolved)
  containerUnresolved: boolean;    // true if containerRaw was set but didn't resolve
  children: LocationNode[];
  ancestors: LocationNode[];       // root → self.parent (excluding self)
}

let cached: Promise<Map<string, LocationNode>> | null = null;

export function getLocationGraph(): Promise<Map<string, LocationNode>> {
  if (!cached) cached = build();
  return cached;
}

export async function getLocationNode(id: string): Promise<LocationNode | null> {
  return (await getLocationGraph()).get(id) ?? null;
}

async function build(): Promise<Map<string, LocationNode>> {
  const { getCollection } = await import('astro:content');
  const entries = await getCollection('locations');

  const byId = new Map<string, LocationNode>();
  const byKey = new Map<string, LocationNode>();

  for (const e of entries) {
    const data = e.data as { title: string; container?: string };
    const node: LocationNode = {
      id: e.id,
      title: data.title,
      url: entityUrl('locations', e.id),
      containerRaw: data.container ?? null,
      parent: null,
      containerUnresolved: false,
      children: [],
      ancestors: [],
    };
    byId.set(e.id, node);
    // Index by both raw id and normalized id so author can write either form
    // in `container:` (e.g. "alpha-quadrant" or "Alpha Quadrant").
    byKey.set(normalizeKey(e.id), node);
  }
  // Also key by title so `container: "Alpha Quadrant"` works.
  for (const node of byId.values()) {
    const titleKey = normalizeKey(node.title);
    if (!byKey.has(titleKey)) byKey.set(titleKey, node);
  }

  // Resolve parents.
  for (const node of byId.values()) {
    if (!node.containerRaw) continue;
    const parent = byKey.get(normalizeKey(node.containerRaw));
    if (parent) {
      node.parent = parent;
      parent.children.push(node);
    } else {
      node.containerUnresolved = true;
      // Same file-log mechanism as the wikilink plugin — see
      // src/integrations/wikilink-warnings.ts for the surfacing path.
      try {
        const { appendFileSync, mkdirSync } = await import('node:fs');
        mkdirSync(resolve(process.cwd(), '.astro'), { recursive: true });
        appendFileSync(
          resolve(process.cwd(), '.astro/build-warnings.log'),
          `[location] UNRESOLVED  locations/${node.id}  container: '${node.containerRaw}'\n`,
        );
      } catch {
        // Ignore — warnings are advisory.
      }
    }
  }

  // Detect cycles. A node walking its parent chain that revisits itself = cycle.
  for (const start of byId.values()) {
    const visited = new Set<string>();
    let cur: LocationNode | null = start;
    const trail: string[] = [];
    while (cur) {
      if (visited.has(cur.id)) {
        trail.push(cur.id);
        throw new Error(
          `Container cycle detected in locations: ${trail.join(' -> ')}`,
        );
      }
      visited.add(cur.id);
      trail.push(cur.id);
      cur = cur.parent;
    }
  }

  // Build ancestor chains (root first, parent last; excludes the node itself).
  for (const node of byId.values()) {
    const ancestors: LocationNode[] = [];
    let cur = node.parent;
    while (cur) {
      ancestors.unshift(cur);
      cur = cur.parent;
    }
    node.ancestors = ancestors;
  }

  // Sort children alphabetically per parent for stable rendering.
  for (const node of byId.values()) {
    node.children.sort((a, b) => a.title.localeCompare(b.title));
  }

  return byId;
}
