import { modules } from '@blog/studio/schema-types/modules';
import { childPagesSchema } from '@blog/studio/schema-types/modules/child-pages/child-pages';
import { contentSchema } from '@blog/studio/schema-types/modules/content/content';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { faqSchema } from '@blog/studio/schema-types/modules/faq/faq';
import { featureHighlightsSchema } from '@blog/studio/schema-types/modules/feature-highlights/feature-highlights';
import { featureListSchema } from '@blog/studio/schema-types/modules/feature-list/feature-list';
import { logoWallSchema } from '@blog/studio/schema-types/modules/logo-wall/logo-wall';
import { newsletterSchema } from '@blog/studio/schema-types/modules/newsletter/newsletter';
import { postFeaturedSchema } from '@blog/studio/schema-types/modules/post-featured/post-featured';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import { postListSchema } from '@blog/studio/schema-types/modules/post-list/post-list';
import { postRelatedSchema } from '@blog/studio/schema-types/modules/post-related/post-related';
import { pricingSchema } from '@blog/studio/schema-types/modules/pricing/pricing';
import { statsSchema } from '@blog/studio/schema-types/modules/stats/stats';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import { teamSchema } from '@blog/studio/schema-types/modules/team/team';
import { testimonialSchema } from '@blog/studio/schema-types/modules/testimonial/testimonial';
import { timelineSchema } from '@blog/studio/schema-types/modules/timeline/timeline';

export const moduleKinds = [
  {
    name: 'explainers',
    title: 'Explainers',
    modules: [
      contentSchema,
      featureListSchema,
      featureHighlightsSchema,
      timelineSchema,
      faqSchema,
      childPagesSchema,
    ],
  },
  {
    name: 'proof',
    title: 'Proof',
    modules: [testimonialSchema, teamSchema, logoWallSchema, statsSchema],
  },
  {
    name: 'conversion',
    title: 'Conversion',
    modules: [ctaSchema, newsletterSchema, pricingSchema],
  },
  {
    name: 'posts',
    title: 'Posts',
    modules: [
      postListSchema,
      postLatestSchema,
      postFeaturedSchema,
      postRelatedSchema,
      taxonomyListSchema,
    ],
  },
];

const titleByName = new Map<string, string>(
  modules.map((module) => [module.name, module.title ?? module.name]),
);

const kindIndexByName = new Map<string, number>(
  moduleKinds.flatMap((kind, index) =>
    kind.modules.map((module) => [module.name, index] as const),
  ),
);

const kindIndex = (name: string) =>
  kindIndexByName.get(name) ?? moduleKinds.length;

const title = (name: string) => titleByName.get(name) ?? name;

export const sortModulesByKind = (names: string[]) =>
  [...names].sort(
    (a, b) => kindIndex(a) - kindIndex(b) || title(a).localeCompare(title(b)),
  );

export const moduleInsertMenuGroups = (names: string[]) => {
  const sorted = sortModulesByKind(names);

  return moduleKinds.flatMap((kind, index) => {
    const of = sorted.filter((name) => kindIndexByName.get(name) === index);

    return of.length > 0 ? [{ name: kind.name, title: kind.title, of }] : [];
  });
};
