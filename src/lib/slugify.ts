/**
 * Slug helper per specs/03-content-model.md.
 *
 * Title resolution is not needed: `title` is now a required frontmatter field
 * (R-F-12), so consumers read `entry.data.title` directly.
 */

/**
 * Derives a URL-safe slug from a filename-like input.
 *   - Lowercase
 *   - Spaces and underscores become hyphens
 *   - Non-alphanumeric characters (other than hyphens) stripped
 *   - Consecutive hyphens collapsed
 *   - Leading/trailing hyphens trimmed
 *
 * Example: "Captain Riker (XO).md" -> "captain-riker-xo"
 */
export function slugify(input: string): string {
  return input
    .replace(/\.md$/, '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
