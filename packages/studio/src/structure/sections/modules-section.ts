import { contentSchema } from '@blog/studio/schema-types/modules/content/content';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { faqSchema } from '@blog/studio/schema-types/modules/faq/faq';
import { featureListSchema } from '@blog/studio/schema-types/modules/feature-list/feature-list';
import { heroSchema } from '@blog/studio/schema-types/modules/hero/hero';
import { heroBlogSchema } from '@blog/studio/schema-types/modules/hero-blog/hero-blog';
import { heroProfileSchema } from '@blog/studio/schema-types/modules/hero-profile/hero-profile';
import { heroStatementSchema } from '@blog/studio/schema-types/modules/hero-statement/hero-statement';
import { logoWallSchema } from '@blog/studio/schema-types/modules/logo-wall/logo-wall';
import { newsletterSchema } from '@blog/studio/schema-types/modules/newsletter/newsletter';
import { postFeaturedSchema } from '@blog/studio/schema-types/modules/post-featured/post-featured';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import { postListSchema } from '@blog/studio/schema-types/modules/post-list/post-list';
import { postRelatedSchema } from '@blog/studio/schema-types/modules/post-related/post-related';
import { statsSchema } from '@blog/studio/schema-types/modules/stats/stats';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import { testimonialSchema } from '@blog/studio/schema-types/modules/testimonial/testimonial';
import type { TStructureSection } from '@blog/studio/structure/build-section/build-section';
import { Blocks } from 'lucide-react';

export const modulesSection: TStructureSection = {
  title: 'Modules',
  id: 'modules',
  icon: Blocks,
  groups: [
    {
      title: 'Heroes',
      items: [
        { schema: heroBlogSchema },
        { schema: heroStatementSchema },
        { schema: heroProfileSchema },
        { schema: heroSchema },
      ],
    },
    {
      title: 'Posts',
      items: [
        { schema: postListSchema },
        { schema: postLatestSchema },
        { schema: postFeaturedSchema },
        { schema: postRelatedSchema },
        { schema: taxonomyListSchema },
      ],
    },
    {
      title: 'Explainers',
      items: [
        { schema: contentSchema },
        { schema: featureListSchema },
        { schema: faqSchema },
      ],
    },
    {
      title: 'Proof',
      items: [
        { schema: testimonialSchema },
        { schema: logoWallSchema },
        { schema: statsSchema },
      ],
    },
    {
      title: 'Conversion',
      items: [{ schema: ctaSchema }, { schema: newsletterSchema }],
    },
  ],
};
