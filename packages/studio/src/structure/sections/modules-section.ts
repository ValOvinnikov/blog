import { contentSchema } from '@blog/studio/schema-types/modules/content/content';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { heroSchema } from '@blog/studio/schema-types/modules/hero/hero';
import { heroBlogSchema } from '@blog/studio/schema-types/modules/hero-blog/hero-blog';
import { heroStatementSchema } from '@blog/studio/schema-types/modules/hero-statement/hero-statement';
import { newsletterSchema } from '@blog/studio/schema-types/modules/newsletter/newsletter';
import { postFeaturedSchema } from '@blog/studio/schema-types/modules/post-featured/post-featured';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import { postListSchema } from '@blog/studio/schema-types/modules/post-list/post-list';
import { postRelatedSchema } from '@blog/studio/schema-types/modules/post-related/post-related';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import type { TStructureSection } from '@blog/studio/structure/build-section/build-section';
import { Blocks } from 'lucide-react';

export const modulesSection: TStructureSection = {
  title: 'Modules',
  id: 'modules',
  icon: Blocks,
  groups: [
    {
      title: 'Post modules',
      items: [
        { schema: postListSchema },
        { schema: postLatestSchema },
        { schema: postFeaturedSchema },
        { schema: postRelatedSchema },
        { schema: taxonomyListSchema },
      ],
    },
    {
      title: 'Content modules',
      items: [
        { schema: heroSchema },
        { schema: heroBlogSchema },
        { schema: heroStatementSchema },
        { schema: contentSchema },
        { schema: ctaSchema },
        { schema: newsletterSchema },
      ],
    },
  ],
};
