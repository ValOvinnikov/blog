import type { TTagIndexPage } from '@blog/service';

import { makeIndexPageLoader } from './index-page-fixtures';

const seo: TTagIndexPage['seo'] = {
  title: 'Tags',
  description: 'Browse every post by tag.',
  ogTitle: 'Tags',
  ogDescription: 'Browse every post by tag.',
  ogImageUrl: undefined,
};

const withHero: TTagIndexPage = {
  headingBlock: { heading: 'Tags' },
  hero: { id: 'tags-hero-1', type: 'module_hero' },
  modules: [],
  seo,
};

const withoutHero: TTagIndexPage = {
  headingBlock: {
    heading: 'Tags',
    supportingText: 'Browse every post by tag.',
  },
  hero: undefined,
  modules: [],
  seo,
};

/**
 * Storybook-only stand-in for the real `getTagsIndexPage`, which chains
 * through `getTenantSanityContext` (reads `headers()`) into a live Sanity
 * fetch — neither is available in Storybook (`.storybook/main.ts` aliases
 * the exact specifier to this module). Selects between a hero and a plain
 * heading by the `tenant` argument each story already passes in as an arg.
 */
export const getTagsIndexPage = makeIndexPageLoader({ withHero, withoutHero });
