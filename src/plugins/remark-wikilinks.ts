/**
 * M4-lite wikilink remark plugin.
 *
 * Transforms Obsidian-style wikilinks in the markdown AST so prose doesn't
 * leak `[[…]]` syntax to readers. No resolution / no link-index / no
 * backlinks yet — that's M4-full (ADR-0002).
 *
 *   [[target]]               -> plain text "target"
 *   [[target|alias]]         -> plain text "alias"
 *   ![[image.png]]           -> <img src="/_assets/image.png" alt="image.png">
 *   ![[image.png|alt text]]  -> <img src="/_assets/image.png" alt="alt text">
 *   ![[Note]] (no extension) -> plain text "Note" (transclusion is out of scope)
 *
 * Asset URLs are constructed against the flat public/_assets/ mirror that
 * sync.ts populates (see R-F-02). M4-full will replace the flat lookup
 * with the proper link-index resolver.
 */

import type { Root } from 'mdast';
import type { Node, Parent } from 'unist';
import { visit, SKIP } from 'unist-util-visit';

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);
const WIKILINK_RE = /(!?)\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

interface TextNode extends Node {
  type: 'text';
  value: string;
}

interface ImageNode extends Node {
  type: 'image';
  url: string;
  alt: string;
}

type ReplacementNode = TextNode | ImageNode;

function getExtension(target: string): string {
  const idx = target.lastIndexOf('.');
  return idx >= 0 ? target.slice(idx).toLowerCase() : '';
}

export default function remarkWikilinks() {
  return (tree: Root) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || index === undefined) return;
      const value = (node as TextNode).value;
      if (!value.includes('[[')) return;

      const replacements: ReplacementNode[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      WIKILINK_RE.lastIndex = 0;

      while ((match = WIKILINK_RE.exec(value)) !== null) {
        const [full, bang, rawTarget, rawAlias] = match;
        const target = rawTarget?.trim() ?? '';
        const alias = rawAlias?.trim();
        const start = match.index;

        if (start > lastIndex) {
          replacements.push({ type: 'text', value: value.slice(lastIndex, start) });
        }

        if (bang) {
          const ext = getExtension(target);
          if (IMAGE_EXTS.has(ext)) {
            replacements.push({
              type: 'image',
              url: `/_assets/${target}`,
              alt: alias ?? target,
            });
          } else {
            // Non-image embed (transclusion) — render as plain text. ADR-0002.
            replacements.push({ type: 'text', value: alias ?? target });
          }
        } else {
          replacements.push({ type: 'text', value: alias ?? target });
        }

        lastIndex = start + full.length;
      }

      if (replacements.length === 0) return;

      if (lastIndex < value.length) {
        replacements.push({ type: 'text', value: value.slice(lastIndex) });
      }

      (parent as Parent).children.splice(index, 1, ...(replacements as Node[]));
      return [SKIP, index + replacements.length];
    });
  };
}
