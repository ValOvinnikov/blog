import { modules } from '@shinefold/studio/schema-types/modules';
import { contactFormSchema } from '@shinefold/studio/schema-types/modules/contact-form/contact-form';
import { contentSchema } from '@shinefold/studio/schema-types/modules/content/content';
import { cookieSettingsSchema } from '@shinefold/studio/schema-types/modules/cookie-settings/cookie-settings';
import { ctaSchema } from '@shinefold/studio/schema-types/modules/cta/cta';
import { embedSchema } from '@shinefold/studio/schema-types/modules/embed/embed';
import { faqSchema } from '@shinefold/studio/schema-types/modules/faq/faq';
import { featureHighlightsSchema } from '@shinefold/studio/schema-types/modules/feature-highlights/feature-highlights';
import { featureListSchema } from '@shinefold/studio/schema-types/modules/feature-list/feature-list';
import { logoWallSchema } from '@shinefold/studio/schema-types/modules/logo-wall/logo-wall';
import { newsletterSchema } from '@shinefold/studio/schema-types/modules/newsletter/newsletter';
import { postFeaturedSchema } from '@shinefold/studio/schema-types/modules/post-featured/post-featured';
import { postLatestSchema } from '@shinefold/studio/schema-types/modules/post-latest/post-latest';
import { postListSchema } from '@shinefold/studio/schema-types/modules/post-list/post-list';
import { postRelatedSchema } from '@shinefold/studio/schema-types/modules/post-related/post-related';
import { pricingSchema } from '@shinefold/studio/schema-types/modules/pricing/pricing';
import { sectionPagesSchema } from '@shinefold/studio/schema-types/modules/section-pages/section-pages';
import { statsSchema } from '@shinefold/studio/schema-types/modules/stats/stats';
import { taxonomyListSchema } from '@shinefold/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import { teamSchema } from '@shinefold/studio/schema-types/modules/team/team';
import { testimonialSchema } from '@shinefold/studio/schema-types/modules/testimonial/testimonial';
import { timelineSchema } from '@shinefold/studio/schema-types/modules/timeline/timeline';
import { hasLength } from '@shinefold/utils/primitives';

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
      sectionPagesSchema,
      embedSchema,
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
    modules: [
      ctaSchema,
      newsletterSchema,
      contactFormSchema,
      cookieSettingsSchema,
      pricingSchema,
    ],
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

export const getModuleTitle = (name: string) => titleByName.get(name) ?? name;

export const sortModulesByKind = (names: string[]) =>
  [...names].sort(
    (a, b) =>
      kindIndex(a) - kindIndex(b) ||
      getModuleTitle(a).localeCompare(getModuleTitle(b)),
  );

export const moduleInsertMenuGroups = (names: string[]) => {
  const sorted = sortModulesByKind(names);

  return moduleKinds.flatMap((kind, index) => {
    const of = sorted.filter((name) => kindIndexByName.get(name) === index);

    return hasLength(of) ? [{ name: kind.name, title: kind.title, of }] : [];
  });
};
