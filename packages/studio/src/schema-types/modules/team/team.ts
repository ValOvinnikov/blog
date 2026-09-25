import { CARD_IMAGE_SHAPE, CONTENT_ALIGNMENT } from '@blog/config/constants';
import { personSchema } from '@blog/studio/schema-types/documents/person/person';
import {
  alignmentField,
  alignmentFields,
} from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { ctaButtonsField } from '@blog/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { displayModeField } from '@blog/studio/schema-types/fields/display-mode-field/display-mode-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { toTitleCase } from '@blog/utils/primitives';
import { Users } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const teamSchema = defineType({
  name: 'module_team',
  title: 'Team',
  type: 'document',
  description:
    'A grid of people shown as cards, each drawn from an existing Person — used to introduce a team, staff, or contributors.',
  icon: Users,
  fields: [
    titleField(),
    brandVariantField(),
    headingBlockField(),
    defineField({
      name: 'members',
      title: 'Members',
      type: 'array',
      description:
        'The people on this team, in the order they should appear. Each is a Person, edited under People.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: personSchema.name }],
        }),
      ],
      validation: (rule) => [
        rule.required().error('Add at least two people.'),
        rule
          .min(2)
          .error(
            'A team needs at least two people. For one person, use a Profile Hero.',
          ),
        rule.max(12).error('A team holds at most twelve people.'),
        rule.unique(),
      ],
    }),
    defineField({
      name: 'showBios',
      title: 'Show Bios',
      type: 'boolean',
      description:
        "Show each person's full bio under their role. Off keeps the cards to photo, name and role.",
      initialValue: false,
    }),
    defineField({
      name: 'showSocialLinks',
      title: 'Show Social Links',
      type: 'boolean',
      description:
        "Show each person's social links as icons. Turn off on pages where visitors should stay, such as a landing page.",
      initialValue: true,
    }),
    defineField({
      name: 'imageShape',
      title: 'Image Shape',
      type: 'string',
      description:
        'How each photo is cropped. A person without a photo shows their initials.',
      options: {
        layout: 'dropdown',
        list: [CARD_IMAGE_SHAPE.CIRCLE, CARD_IMAGE_SHAPE.SQUARE].map(
          (value) => ({ title: toTitleCase(value), value }),
        ),
      },
      initialValue: CARD_IMAGE_SHAPE.CIRCLE,
      validation: (rule) => rule.required(),
    }),
    displayModeField(),
    alignmentField({
      name: 'cardAlignment',
      title: 'Card Alignment',
      description:
        "Aligns each person's photo, name and role inside their card.",
      list: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
      initialValue: CONTENT_ALIGNMENT.CENTER,
      validation: (rule) => rule.required(),
    }),
    ctaButtonsField(),
    ...alignmentFields([]),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      brandVariant: 'brandVariant',
      members: 'members',
    },
    prepare({ title, brandVariant, members }) {
      const count = Array.isArray(members) ? members.length : 0;

      return {
        title: title ?? 'Unknown',
        subtitle: moduleSubtitle(
          brandVariant,
          `${String(count)} ${count === 1 ? 'person' : 'people'}`,
        ),
      };
    },
  },
});
