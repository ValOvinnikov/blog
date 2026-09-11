import type { TTopicIndexPage } from '@blog/service';

import { makeIndexPageLoader } from './index-page-fixtures';

const seo: TTopicIndexPage['seo'] = {
  title: 'Topics',
  description: 'Browse every post by topic.',
  ogTitle: 'Topics',
  ogDescription: 'Browse every post by topic.',
  ogImage: undefined,
};

const withHero: TTopicIndexPage = {
  headingBlock: { heading: 'Topics' },
  hero: { id: 'topics-hero-1', type: 'module_hero' },
  modules: [],
  seo,
};

const withoutHero: TTopicIndexPage = {
  headingBlock: {
    heading: 'Topics',
    supportingText: 'Browse every post by topic.',
  },
  hero: undefined,
  modules: [],
  seo,
};

/**
 * Storybook-only stand-in for the real `getTopicsIndexPage`, which chains
 * through `getTenantSanityContext` (reads `headers()`) into a live Sanity
 * fetch — neither is available in Storybook (`.storybook/main.ts` aliases
 * the exact specifier to this module). Selects between a hero and a plain
 * heading by the `tenant` argument each story already passes in as an arg.
 */
export const getTopicsIndexPage = makeIndexPageLoader({
  withHero,
  withoutHero,
});
