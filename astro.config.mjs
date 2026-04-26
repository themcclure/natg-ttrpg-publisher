import { defineConfig } from 'astro/config';
import remarkWikilinks from './src/plugins/remark-wikilinks.ts';
import wikilinkWarnings from './src/integrations/wikilink-warnings.ts';

export default defineConfig({
  integrations: [wikilinkWarnings()],
  markdown: {
    remarkPlugins: [remarkWikilinks],
  },
});
