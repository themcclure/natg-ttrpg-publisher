/**
 * Pure parsing/normalization for Obsidian-style wikilinks (ADR-0002).
 * Used by both the remark plugin and the cross-references builder so we
 * don't drift on the regex or normalization rules between them.
 */

const WIKILINK_RE = /(!?)\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export interface ParsedWikilink {
  raw: string;          // the full match including delimiters, e.g. "[[Foo|Bar]]"
  isImage: boolean;     // true when the source is `![[...]]`
  target: string;       // the part before `|`, trimmed
  alias: string | null; // the part after `|`, trimmed; null if absent
  index: number;        // 0-based position in the source string
}

/** Find every wikilink occurrence in a string. */
export function extractWikilinks(text: string): ParsedWikilink[] {
  const out: ParsedWikilink[] = [];
  WIKILINK_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = WIKILINK_RE.exec(text)) !== null) {
    const [raw, bang, target, alias] = m;
    if (target === undefined) continue;
    out.push({
      raw,
      isImage: !!bang,
      target: target.trim(),
      alias: alias ? alias.trim() : null,
      index: m.index,
    });
  }
  return out;
}

/**
 * Normalize a wikilink target or an indexable string for matching.
 * ADR-0002: lowercase, treat whitespace/underscores as hyphens, strip other
 * non-alphanumerics, collapse hyphens, trim leading/trailing punctuation.
 * The `/` is preserved so scoped forms ("collection/name") survive normalization.
 */
export function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9/-]/g, '')
    .replace(/-+/g, '-')
    .replace(/(^[/-]+|[/-]+$)/g, '');
}

/**
 * Returns true if the resulting wikilink path looks like an image embed
 * (the `target` ends in a known image extension).
 */
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);
export function looksLikeImage(target: string): boolean {
  const idx = target.lastIndexOf('.');
  if (idx < 0) return false;
  return IMAGE_EXTS.has(target.slice(idx).toLowerCase());
}
