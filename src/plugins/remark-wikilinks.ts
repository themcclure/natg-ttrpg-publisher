/**
 * M4-full wikilink remark plugin (ADR-0002).
 *
 * Replaces every `[[…]]` in a markdown body with either a real link to the
 * resolved entry or a visually-broken span. Image embeds (`![[image.ext]]`)
 * become `<img>` against the flat `/_assets/` mirror; non-image embeds
 * (transclusion) collapse to plain text per ADR-0002.
 *
 * Warnings are emitted to stderr in a grep-friendly format. R-NF-18:
 * default is warn-only; setting `NATG_STRICT_LINKS=true` upgrades the
 * first broken or ambiguous wikilink encountered into a build failure.
 */

import type { Root } from 'mdast';
import type { Node, Parent } from 'unist';
import { visit, SKIP } from 'unist-util-visit';
import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { extractWikilinks, looksLikeImage } from '../lib/wikilinks.ts';
import { getLinkIndex, resolveWikilink, type IndexEntry } from '../lib/link-index.ts';

const STRICT = process.env.NATG_STRICT_LINKS === 'true';
const WARNING_LOG = resolve(process.cwd(), '.astro/build-warnings.log');

interface TextNode extends Node {
  type: 'text';
  value: string;
}

interface ImageNode extends Node {
  type: 'image';
  url: string;
  alt: string;
}

interface LinkNode extends Node {
  type: 'link';
  url: string;
  title?: string | null;
  data?: { hProperties?: Record<string, string> };
  children: TextNode[];
}

type Replacement = TextNode | ImageNode | LinkNode;

function relPath(filePath: string | undefined): string {
  if (!filePath) return '<unknown>';
  const idx = filePath.indexOf('/src/content/');
  if (idx < 0) return filePath;
  return 'src/content/' + filePath.slice(idx + '/src/content/'.length);
}

function warn(message: string): void {
  // Astro's Vite worker swallows stderr, so we route warnings through a
  // file that the wikilink-warnings integration prints on build:done.
  try {
    mkdirSync(resolve(process.cwd(), '.astro'), { recursive: true });
    appendFileSync(WARNING_LOG, message + '\n');
  } catch {
    // Warnings are advisory; ignore fs errors.
  }
  if (STRICT) {
    throw new Error(`Strict link mode (NATG_STRICT_LINKS=true) tripped: ${message}`);
  }
}

function brokenLink(target: string, displayText: string): LinkNode {
  return {
    type: 'link',
    url: '',
    data: {
      hProperties: {
        class: 'wikilink-broken',
        title: `Unresolved: [[${target}]]`,
        'aria-disabled': 'true',
      },
    },
    children: [{ type: 'text', value: displayText }],
  };
}

function resolvedLink(entry: IndexEntry, displayText: string): LinkNode {
  return {
    type: 'link',
    url: entry.url,
    data: {
      hProperties: {
        class: 'wikilink',
        'data-collection': entry.collection,
      },
    },
    children: [{ type: 'text', value: displayText }],
  };
}

export default function remarkWikilinks() {
  return async (tree: Root, file: { path?: string }) => {
    const linkIndex = await getLinkIndex();
    const source = relPath(file?.path);

    visit(tree, 'text', (node, index, parent) => {
      if (!parent || index === undefined) return;
      const value = (node as TextNode).value;
      if (!value.includes('[[')) return;

      const wikilinks = extractWikilinks(value);
      if (wikilinks.length === 0) return;

      const replacements: Replacement[] = [];
      let cursor = 0;

      for (const wl of wikilinks) {
        if (wl.index > cursor) {
          replacements.push({ type: 'text', value: value.slice(cursor, wl.index) });
        }

        if (wl.isImage) {
          if (looksLikeImage(wl.target)) {
            replacements.push({
              type: 'image',
              url: `/_assets/${wl.target}`,
              alt: wl.alias ?? wl.target,
            });
          } else {
            // Non-image embed (transclusion). Render plain text per ADR-0002.
            replacements.push({ type: 'text', value: wl.alias ?? wl.target });
          }
          cursor = wl.index + wl.raw.length;
          continue;
        }

        const result = resolveWikilink(wl.target, linkIndex);
        if (result.kind === 'resolved') {
          const display = wl.alias ?? result.entry.title;
          replacements.push(resolvedLink(result.entry, display));
        } else if (result.kind === 'ambiguous') {
          const candidates = result.candidates
            .map((c) => `${c.collection}/${c.id}`)
            .join(', ');
          warn(
            `[wikilink] AMBIGUOUS   ${source}  [[${wl.target}]] (tier=${result.tier}) -> ${candidates}`,
          );
          replacements.push(brokenLink(wl.target, wl.alias ?? wl.target));
        } else {
          warn(`[wikilink] UNRESOLVED  ${source}  [[${wl.target}]]`);
          replacements.push(brokenLink(wl.target, wl.alias ?? wl.target));
        }

        cursor = wl.index + wl.raw.length;
      }

      if (cursor < value.length) {
        replacements.push({ type: 'text', value: value.slice(cursor) });
      }

      (parent as Parent).children.splice(index, 1, ...(replacements as Node[]));
      return [SKIP, index + replacements.length];
    });
  };
}
