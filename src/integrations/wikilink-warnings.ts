/**
 * Astro integration that surfaces wikilink-resolution warnings collected by
 * the remark-wikilinks plugin.
 *
 * The plugin runs inside Astro's Vite worker, where stderr is swallowed.
 * It appends warnings to .astro/build-warnings.log instead. This integration
 * runs in the main Astro process — where stdio works normally — and prints
 * the log on build:done, then deletes it.
 */

import type { AstroIntegration } from 'astro';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';

export default function wikilinkWarningsIntegration(): AstroIntegration {
  const logPath = resolve(process.cwd(), '.astro/build-warnings.log');

  return {
    name: 'natg:wikilink-warnings',
    hooks: {
      // Note: we deliberately do NOT clear the log on build:start — the
      // remark plugin runs before astro:build:start (during content sync /
      // type generation), so a start-hook delete would wipe warnings just
      // written. Instead, build:done reads + unlinks the file, leaving
      // each build's output self-contained.
      'astro:build:done': () => {
        if (!existsSync(logPath)) return;
        const content = readFileSync(logPath, 'utf8').trim();
        unlinkSync(logPath);
        if (!content) return;
        const lines = content.split('\n');
        const counts = { unresolved: 0, ambiguous: 0, location: 0 };
        for (const line of lines) {
          if (line.includes('UNRESOLVED')) counts.unresolved++;
          if (line.includes('AMBIGUOUS')) counts.ambiguous++;
          if (line.startsWith('[location]')) counts.location++;
        }
        console.log('');
        console.log('Build warnings:');
        for (const line of lines) console.log('  ' + line);
        console.log(
          `  --- ${lines.length} total (unresolved=${counts.unresolved}, ambiguous=${counts.ambiguous}, location=${counts.location})`,
        );
      },
    },
  };
}
