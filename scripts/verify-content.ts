#!/usr/bin/env node
/**
 * Cross-file consistency checks that per-file Zod schemas can't express.
 * Runs before `astro build`. Exits non-zero on the first failure found.
 *
 * Currently enforces:
 *  - Every episode's frontmatter `episode` field matches its parent folder.
 *
 * Add more checks here as they're identified (e.g. container cycle detection,
 * slug collisions across collections if we decide to hard-fail those).
 */

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const episodesRoot = resolve(repoRoot, 'src/content/episodes');

interface Problem {
  file: string;
  message: string;
}

async function verifyEpisodes(): Promise<Problem[]> {
  const problems: Problem[] = [];
  if (!existsSync(episodesRoot)) return problems;

  const entries = await readdir(episodesRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    // Only episode folders match S##E##. Season folders match S## and are skipped here.
    if (!/^S\d{2}E\d{2}$/.test(entry.name)) continue;

    const indexPath = resolve(episodesRoot, entry.name, 'index.md');
    const relFile = `src/content/episodes/${entry.name}/index.md`;
    if (!existsSync(indexPath)) {
      problems.push({ file: relFile, message: 'missing index.md' });
      continue;
    }

    const raw = await readFile(indexPath, 'utf8');
    const { data } = matter(raw);
    const episodeValue = typeof data.episode === 'string' ? data.episode : undefined;

    if (!episodeValue) {
      problems.push({
        file: relFile,
        message: 'frontmatter `episode` is missing',
      });
      continue;
    }

    if (episodeValue !== entry.name) {
      problems.push({
        file: relFile,
        message: `frontmatter \`episode: ${episodeValue}\` does not match folder name "${entry.name}"`,
      });
    }
  }
  return problems;
}

async function main(): Promise<void> {
  const problems = await verifyEpisodes();

  if (problems.length > 0) {
    console.error('Content verification failed:');
    for (const p of problems) {
      console.error(`  ${p.file}: ${p.message}`);
    }
    process.exit(1);
  }

  console.log('Content verification passed.');
}

main().catch((err) => {
  console.error('verify-content failed:');
  console.error(err);
  process.exit(1);
});
