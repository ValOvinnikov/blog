import { contentSchema } from '@blog/studio/schema-types/modules/content/content';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { faqSchema } from '@blog/studio/schema-types/modules/faq/faq';
import { heroBlogSchema } from '@blog/studio/schema-types/modules/hero-blog/hero-blog';
import { heroStatementSchema } from '@blog/studio/schema-types/modules/hero-statement/hero-statement';
import { newsletterSchema } from '@blog/studio/schema-types/modules/newsletter/newsletter';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import { postListSchema } from '@blog/studio/schema-types/modules/post-list/post-list';
import { statsSchema } from '@blog/studio/schema-types/modules/stats/stats';

import { moduleInsertMenuGroups, sortModulesByKind } from './module-kinds';

describe('sortModulesByKind', () => {
  it('orders by kind, then by title within a kind', () => {
    expect(
      sortModulesByKind([
        postListSchema.name,
        newsletterSchema.name,
        faqSchema.name,
        statsSchema.name,
        postLatestSchema.name,
        contentSchema.name,
      ]),
    ).toEqual([
      contentSchema.name,
      faqSchema.name,
      statsSchema.name,
      newsletterSchema.name,
      postLatestSchema.name,
      postListSchema.name,
    ]);
  });

  it('puts modules without a kind last, by title', () => {
    expect(
      sortModulesByKind([
        heroStatementSchema.name,
        heroBlogSchema.name,
        ctaSchema.name,
      ]),
    ).toEqual([ctaSchema.name, heroBlogSchema.name, heroStatementSchema.name]);
  });
});

describe('moduleInsertMenuGroups', () => {
  it('builds one group per kind with an allowed module, skipping empty kinds', () => {
    expect(
      moduleInsertMenuGroups([
        postListSchema.name,
        newsletterSchema.name,
        ctaSchema.name,
      ]),
    ).toEqual([
      {
        name: 'conversion',
        title: 'Conversion',
        of: [ctaSchema.name, newsletterSchema.name],
      },
      { name: 'posts', title: 'Posts', of: [postListSchema.name] },
    ]);
  });

  it('leaves modules without a kind out of every group', () => {
    expect(moduleInsertMenuGroups([heroBlogSchema.name])).toEqual([]);
  });
});
