import { contentSchema } from '@blog/studio/schema-types/modules/content/content';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { faqSchema } from '@blog/studio/schema-types/modules/faq/faq';
import { heroBlogSchema } from '@blog/studio/schema-types/modules/hero-blog/hero-blog';
import { heroStatementSchema } from '@blog/studio/schema-types/modules/hero-statement/hero-statement';
import { newsletterSchema } from '@blog/studio/schema-types/modules/newsletter/newsletter';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import { postListSchema } from '@blog/studio/schema-types/modules/post-list/post-list';
import { statsSchema } from '@blog/studio/schema-types/modules/stats/stats';

import {
  moduleInsertMenuGroups,
  moduleKinds,
  sortModulesByKind,
} from './module-kinds';

const [, , CONVERSION_KIND, POSTS_KIND] = moduleKinds;

describe(sortModulesByKind, () => {
  it.each([
    {
      case: 'orders by kind, then by title within a kind',
      names: [
        postListSchema.name,
        newsletterSchema.name,
        faqSchema.name,
        statsSchema.name,
        postLatestSchema.name,
        contentSchema.name,
      ],
      expected: [
        contentSchema.name,
        faqSchema.name,
        statsSchema.name,
        newsletterSchema.name,
        postLatestSchema.name,
        postListSchema.name,
      ],
    },
    {
      case: 'puts modules without a kind last, by title',
      names: [heroStatementSchema.name, heroBlogSchema.name, ctaSchema.name],
      expected: [ctaSchema.name, heroBlogSchema.name, heroStatementSchema.name],
    },
  ])('$case', ({ names, expected }) => {
    expect(sortModulesByKind(names)).toEqual(expected);
  });
});

describe(moduleInsertMenuGroups, () => {
  it.each([
    {
      case: 'builds one group per kind with an allowed module, skipping empty kinds',
      names: [postListSchema.name, newsletterSchema.name, ctaSchema.name],
      expected: [
        {
          name: CONVERSION_KIND?.name,
          title: CONVERSION_KIND?.title,
          of: [ctaSchema.name, newsletterSchema.name],
        },
        {
          name: POSTS_KIND?.name,
          title: POSTS_KIND?.title,
          of: [postListSchema.name],
        },
      ],
    },
    {
      case: 'leaves modules without a kind out of every group',
      names: [heroBlogSchema.name],
      expected: [],
    },
  ])('$case', ({ names, expected }) => {
    expect(moduleInsertMenuGroups(names)).toEqual(expected);
  });
});
