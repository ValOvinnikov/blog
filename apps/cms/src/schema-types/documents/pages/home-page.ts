import { defineModulesField } from '@cms/schema-types/helpers/define-modules-field';
import { getDraftsClient } from '@cms/schema-types/helpers/get-drafts-client';
import { titleField } from '@cms/schema-types/helpers/title-field';
import { ctaSchema } from '@cms/schema-types/modules/module-cta';
import { heroSchema } from '@cms/schema-types/modules/module-hero';
import { newsletterSchema } from '@cms/schema-types/modules/module-newsletter';
import { postLatestSchema } from '@cms/schema-types/modules/module-post-latest';
import { seoSchema } from '@cms/schema-types/objects/seo';
import { House } from 'lucide-react';
import { defineField, defineType, type ValidationContext } from 'sanity';

type TModuleReference = { _type?: string; _ref?: string };

/**
 * More than one `module_postLatest` reference on the home page falls back to
 * the same "Latest posts" heading when its own `sectionHeader.heading` is
 * blank — duplicate landmark names/`<h2>`s for assistive tech.
 */
const validateSinglePostLatestWithoutHeading = async (
  modules: TModuleReference[] | undefined,
  context: ValidationContext,
): Promise<string | true> => {
  const postLatestIds = (modules ?? [])
    .filter(
      (module): module is TModuleReference & { _ref: string } =>
        module._type === postLatestSchema.name && Boolean(module._ref),
    )
    .map((module) => module._ref);

  if (postLatestIds.length < 2) return true;

  const client = getDraftsClient(context);

  const candidates = await client.fetch<{ heading?: string | null }[]>(
    `*[_id in $ids]{ "heading": sectionHeader.heading }`,
    { ids: postLatestIds },
  );

  const blankCount = candidates.filter(
    (candidate) => !candidate.heading?.trim(),
  ).length;

  return blankCount > 1
    ? 'Only one Post Latest module without its own heading is allowed per page — give this one a heading or remove the duplicate.'
    : true;
};

export const homePageSchema = defineType({
  name: 'page_home',
  title: 'Home Page',
  type: 'document',
  icon: House,
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title ?? 'Unknown',
        subtitle: 'Home singleton',
      };
    },
  },
  fields: [
    titleField(),
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'reference',
      description: 'The hero module rendered at the top of the home page.',
      to: [{ type: heroSchema.name }],
      validation: (rule) => rule.required(),
    }),
    defineModulesField({
      allow: [postLatestSchema.name, ctaSchema.name, newsletterSchema.name],
      validateCustom: (rule) =>
        rule.custom(validateSinglePostLatestWithoutHeading),
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: seoSchema.name,
      description:
        'Override Home page meta title, description, and social sharing image.',
    }),
  ],
});
