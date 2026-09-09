import { contentSchema } from '@blog/studio/schema-types/modules/module-content';
import { ctaSchema } from '@blog/studio/schema-types/modules/module-cta';
import { heroSchema } from '@blog/studio/schema-types/modules/module-hero';
import { heroBlogSchema } from '@blog/studio/schema-types/modules/module-hero-blog';
import { newsletterSchema } from '@blog/studio/schema-types/modules/module-newsletter';
import { postFeaturedSchema } from '@blog/studio/schema-types/modules/module-post-featured';
import { postLatestSchema } from '@blog/studio/schema-types/modules/module-post-latest';
import { postListSchema } from '@blog/studio/schema-types/modules/module-post-list';
import { postRelatedSchema } from '@blog/studio/schema-types/modules/module-post-related';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/module-taxonomy-list';
import type { TStructureGroup } from '@blog/studio/structure/build-grouped-list';

export const modulesGroups: TStructureGroup[] = [
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
      { schema: contentSchema },
      { schema: ctaSchema },
      { schema: newsletterSchema },
    ],
  },
];
