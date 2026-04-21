import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface NatgConfig {
  /** Absolute path to the sanitized NATG source vault. */
  sourcePath: string;
  /** Display title used in site chrome. */
  siteTitle: string;
  /** Production URL, used for canonical tags and absolute links. */
  siteUrl: string;
}

const repoRoot = dirname(fileURLToPath(import.meta.url));

const config: NatgConfig = {
  sourcePath: process.env.NATG_SOURCE
    ? resolve(process.env.NATG_SOURCE)
    : resolve(repoRoot, 'fixtures/natg-vault'),
  siteTitle: 'NATG Encyclopedia',
  siteUrl: 'https://TBD.vercel.app',
};

export default config;
