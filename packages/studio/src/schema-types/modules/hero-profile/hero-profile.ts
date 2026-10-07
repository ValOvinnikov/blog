import { personSchema } from '@blog/studio/schema-types/documents/person/person';
import { ctaButtonsField } from '@blog/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { heroBackgroundAndShapeFields } from '@blog/studio/schema-types/fields/hero-background-and-shape-fields/hero-background-and-shape-fields';
import { heroContentPositionFields } from '@blog/studio/schema-types/fields/hero-content-position-fields/hero-content-position-fields';
import { heroMediaOrderSplitField } from '@blog/studio/schema-types/fields/hero-media-order-fields/hero-media-order-fields';
import { localizedOneLineTextField } from '@blog/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { showToggleField } from '@blog/studio/schema-types/fields/show-toggle-field/show-toggle-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { heroFieldsets } from '@blog/studio/schema-types/modules/hero-fieldsets/hero-fieldsets';
import { heroLayoutField } from '@blog/studio/schema-types/objects/hero-layout/hero-layout-field';
import { localizedImageWithAltSchema } from '@blog/studio/schema-types/objects/localized-image-with-alt/localized-image-with-alt';
import { moduleHeadingBlockField } from '@blog/studio/schema-types/objects/module-heading-block/module-heading-block-field';
import { defaultLanguageValue } from '@blog/studio/schema-types/validation/default-language-value/default-language-value';
import { UserCircle } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const heroProfileSchema = defineType({
  name: 'module_heroProfile',
  title: 'Profile Hero',
  type: 'document',
  description:
    'A hero built around a person — their photo and social profiles drawn from an author, alongside a heading and actions you write yourself. Use it to introduce a specific author or team member.',
  icon: UserCircle,
  fieldsets: [...heroFieldsets],
  fields: [
    titleField(),
    ...heroBackgroundAndShapeFields(),
    moduleHeadingBlockField(),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      description:
        "The person this hero introduces. Supplies the hero's photo and social profiles.",
      to: [{ type: personSchema.name }],
      validation: (rule) =>
        rule.required().error('Choose the person this hero introduces.'),
    }),
    showToggleField({
      name: 'showRole',
      title: 'Show Role',
      description:
        "Use the author's role as the line above the heading. Turn off to type your own, or to show none.",
      initialValue: true,
    }),
    localizedOneLineTextField({
      name: 'eyebrow',
      title: 'Eyebrow',
      description: 'Short line above the heading.',
      hidden: ({ parent }) =>
        (parent as { showRole?: boolean } | undefined)?.showRole !== false,
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: localizedImageWithAltSchema.name,
      description:
        "Upload an image to use it here. Stacked and Split fall back to the author's photo; the Banner shows the brand band without one.",
    }),
    ctaButtonsField(),
    showToggleField({
      name: 'showSocialLinks',
      title: 'Show Social Links',
      description:
        "Whether to display the author's social profile links in this hero.",
      initialValue: true,
    }),
    showToggleField({
      name: 'showBio',
      title: 'Show Bio',
      description: "Show the author's bio under the supporting text.",
      initialValue: true,
    }),
    ...heroContentPositionFields(),
    heroMediaOrderSplitField(),
    heroLayoutField,
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'headingBlock.heading',
    },
    prepare({ title, subtitle }) {
      return {
        title: title ?? 'Unknown',
        subtitle: defaultLanguageValue(subtitle) ?? 'No heading yet',
      };
    },
  },
});
