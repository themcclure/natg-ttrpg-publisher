import { defineConfig } from 'astro/config';
import remarkWikilinks from './src/plugins/remark-wikilinks.ts';

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkWikilinks],
  },
});
