import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://beyondthekeys.institute',
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto'
  }
});
