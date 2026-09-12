import { defineModulesField } from '@blog/studio/schema-types/helpers/define-modules-field';
import { headingBlockField } from '@blog/studio/schema-types/helpers/heading-block-field';
import { heroField } from '@blog/studio/schema-types/helpers/hero-field';
import { seoField } from '@blog/studio/schema-types/helpers/seo-field';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { validateHeroOrHeading } from '@blog/studio/schema-types/helpers/validate-hero-or-heading';
import { validateSingleBlankHeadingPerType } from '@blog/studio/schema-types/helpers/validate-single-blank-heading-per-type';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { newsletterSchema } from '@blog/studio/schema-types/modules/newsletter/newsletter';
import { postFeaturedSchema } from '@blog/studio/schema-types/modules/post-featured/post-featured';
import { postListSchema } from '@blog/studio/schema-types/modules/post-list/post-list';
import { Newspaper } from 'lucide-react';
import { defineType, type SanityDocument } from 'sanity';

type TModuleReference = { _type?: string; _ref?: string };

type TBlogPageDocument = {
  modules?: TModuleReference[];
};

const asBlogPageDocument = (
  document: SanityDocument | undefined,
): TBlogPageDocument | undefined => document as TBlogPageDocument | undefined;

const countPostListModules = (document: SanityDocument | undefined): number =>
  (asBlogPageDocument(document)?.modules ?? []).filter(
    (module) => module._type === postListSchema.name,
  ).length;

const validatePostListModuleCount = (
  document: SanityDocument | undefined,
): string | true =>
  countPostListModules(document) > 1
    ? 'Only one Post List module is allowed per page.'
    : true;

const validatePostListModulePresent = (
  document: SanityDocument | undefined,
): string | true =>
  countPostListModules(document) === 0
    ? 'Add a Post List module so this page can list posts.'
    : true;

export const blogPageSchema = defineType({
  name: 'page_blog',
  title: 'Post Index Page',
  type: 'document',
  icon: Newspaper,
  validation: (rule) => [
    ...validateHeroOrHeading()(rule),
    rule.custom(validatePostListModuleCount),
    rule.custom(validatePostListModulePresent).warning(),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title ?? 'Unknown',
        subtitle: 'Blog singleton',
      };
    },
  },
  fields: [
    titleField(),
    headingBlockField({
      description:
        'The page heading (h1) and its optional supporting line. Not shown when a hero is set.',
    }),
    heroField(),
    defineModulesField({
      allow: [
        postListSchema.name,
        ctaSchema.name,
        newsletterSchema.name,
        postFeaturedSchema.name,
      ],
      validateCustom: (rule) =>
        rule.custom(
          validateSingleBlankHeadingPerType([postFeaturedSchema.name]),
        ),
    }),
    seoField(),
  ],
});
