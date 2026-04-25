#!/usr/bin/env tsx
/**
 * NATG sync: copies supported files from the source vault into src/content/.
 * Implements R-F-01 through R-F-06. See specs/01-requirements.md.
 */
import { readdir, stat, mkdir, rm, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../natg.config.ts';

// R-F-03: supported file types.
const SUPPORTED_EXTENSIONS = new Set([
  '.md',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
  '.pdf',
]);

// Asset extensions are mirrored to public/_assets/ for direct serving (R-F-02).
const ASSET_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.pdf',
]);

// R-F-04: known top-level folders. Anything else triggers a warning.
const COLLECTION_FOLDERS = new Set([
  'characters', 'factions', 'locations', 'npcs',
  'starships', 'timelines', 'handouts', 'episodes',
]);
const ASSET_FOLDERS = new Set(['images']);
const KNOWN_TOP_LEVEL = new Set([...COLLECTION_FOLDERS, ...ASSET_FOLDERS]);

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const destDir = resolve(repoRoot, 'src', 'content');
const assetsDir = resolve(repoRoot, 'public', '_assets');

interface SyncCounts {
  copied: number;
  skipped: number;
  bytes: number;
  assetsCopied: number;
  assetCollisions: number;
}

// Tracks which basenames have already landed in public/_assets/ so we can
// warn on collisions (e.g. two PDFs named the same in different episodes).
const seenAssetBasenames = new Map<string, string>();

async function main(): Promise<void> {
  const started = Date.now();
  const source = config.sourcePath;

  console.log('NATG sync');
  console.log(`  source: ${source}`);
  console.log(`  dest:   ${destDir}`);
  console.log('');

  if (!existsSync(source)) {
    console.error(`Error: source folder does not exist: ${source}`);
    console.error('Set NATG_SOURCE to point at your vault, or ensure fixtures/natg-vault/ is present.');
    process.exit(1);
  }

  await rm(destDir, { recursive: true, force: true });
  await mkdir(destDir, { recursive: true });
  await rm(assetsDir, { recursive: true, force: true });
  await mkdir(assetsDir, { recursive: true });
  seenAssetBasenames.clear();

  // Warn about unknown top-level folders (R-F-04).
  const topLevel = await readdir(source, { withFileTypes: true });
  for (const entry of topLevel) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
    if (!KNOWN_TOP_LEVEL.has(entry.name)) {
      console.warn(`  warn: unknown top-level folder '${entry.name}/' (copied, but not a recognized collection)`);
    }
  }

  const counts: SyncCounts = {
    copied: 0,
    skipped: 0,
    bytes: 0,
    assetsCopied: 0,
    assetCollisions: 0,
  };
  await walk(source, source, counts);

  const elapsed = Date.now() - started;
  console.log('');
  console.log(`  Wrote ${counts.copied} files to src/content/ (${formatBytes(counts.bytes)})`);
  console.log(`  Mirrored ${counts.assetsCopied} assets to public/_assets/`);
  if (counts.assetCollisions > 0) {
    console.log(`  ${counts.assetCollisions} asset filename collision(s) — see warnings above`);
  }
  if (counts.skipped > 0) {
    console.log(`  Skipped ${counts.skipped} files per R-F-05`);
  }
  console.log(`  Done in ${elapsed}ms.`);
}

async function walk(root: string, current: string, counts: SyncCounts): Promise<void> {
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(current, entry.name);
    const relPath = relative(root, srcPath);

    if (entry.isDirectory()) {
      // Skip hidden and underscore-prefixed directories outright.
      // (Files inside them won't be reached; there are no whitelisted
      // underscore-prefixed *directories* at present.)
      if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
      await walk(root, srcPath, counts);
      continue;
    }

    if (!entry.isFile()) continue;

    if (shouldSkipFile(entry.name, relPath)) {
      counts.skipped++;
      continue;
    }

    if (!SUPPORTED_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      counts.skipped++;
      continue;
    }

    const destPath = join(destDir, relPath);
    await mkdir(dirname(destPath), { recursive: true });
    await copyFile(srcPath, destPath);
    const s = await stat(srcPath);
    counts.bytes += s.size;
    counts.copied++;

    // Mirror asset files into public/_assets/ (flat, by basename) so the
    // static build can serve them. R-F-02. M4-full will replace the flat
    // mirror with index-based path resolution.
    const ext = extname(entry.name).toLowerCase();
    if (ASSET_EXTENSIONS.has(ext)) {
      const previous = seenAssetBasenames.get(entry.name);
      if (previous && previous !== relPath) {
        console.warn(
          `  warn: asset filename collision '${entry.name}' — '${previous}' overwritten by '${relPath}'`,
        );
        counts.assetCollisions++;
      }
      seenAssetBasenames.set(entry.name, relPath);
      await copyFile(srcPath, join(assetsDir, entry.name));
      counts.assetsCopied++;
    }
  }
}

/**
 * R-F-05 skip rules applied at the file level.
 *  - CLAUDE.md at any depth: skipped.
 *  - Files starting with '.' : skipped.
 *  - Files starting with '_' : skipped, except episodes/S##/_season.md.
 */
function shouldSkipFile(filename: string, relPath: string): boolean {
  if (filename === 'CLAUDE.md') return true;
  if (filename.startsWith('.')) return true;
  if (filename.startsWith('_')) {
    if (filename === '_season.md' && isSeasonMetaPath(relPath)) return false;
    return true;
  }
  return false;
}

function isSeasonMetaPath(relPath: string): boolean {
  // Normalize separators for cross-platform match.
  const normalized = relPath.split(/[\\/]/).join('/');
  return /^episodes\/S\d{2}\/_season\.md$/.test(normalized);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

main().catch((err) => {
  console.error('Sync failed:');
  console.error(err);
  process.exit(1);
});
