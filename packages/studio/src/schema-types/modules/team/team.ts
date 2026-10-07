import { CARD_IMAGE_SHAPE, CONTENT_ALIGNMENT } from '@blog/config/constants';
import { personSchema } from '@blog/studio/schema-types/documents/person/person';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { cardAlignmentField } from '@blog/studio/schema-types/fields/card-alignment-field/card-alignment-field';
import { ctaButtonsField } from '@blog/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { displayModeField } from '@blog/studio/schema-types/fields/display-mode-field/display-mode-field';
import { imageShapeField } from '@blog/studio/schema-types/fields/image-shape-field/image-shape-field';
import { showToggleField } from '@blog/studio/schema-types/fields/show-toggle-field/show-toggle-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { moduleHeadingBlockField } from '@blog/studio/schema-types/objects/module-heading-block/module-heading-block-field';
import { wideLayoutField } from '@blog/studio/schema-types/objects/wide-layout/wide-layout-field';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { Users } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const teamSchema = defineType({
  name: 'module_team',
  title: 'Team',
  type: 'document',
  description:
    'People drawn from existing Persons, shown as a single spotlight or a set of cards — used to introduce a founder, a team, staff, or contributors.',
  icon: Users,
  fields: [
    titleField(),
    brandVariantField(),
    moduleHeadingBlockField(),
    defineField({
      name: 'members',
      title: 'Members',
      type: 'array',
      description:
        'The people on this team, in the order they should appear. Each is a Person, edited under People. One person renders as a single spotlight; two or more as cards.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: personSchema.name }],
        }),
      ],
      validation: (rule) => [
        rule.required().error('Add at least one person.'),
        rule.min(1).error('Add at least one person.'),
        rule.max(12).error('A team holds at most twelve people.'),
        rule.unique(),
      ],
    }),
    showToggleField({
      name: 'showBios',
      title: 'Show Bios',
      description:
        "Show each person's full bio under their role. Off keeps the cards to photo, name and role.",
      initialValue: false,
    }),
    showToggleField({
      name: 'showSocialLinks',
      title: 'Show Social Links',
      description:
        "Show each person's social links as icons. Turn off on pages where visitors should stay, such as a landing page.",
      initialValue: true,
    }),
    imageShapeField({
      values: [CARD_IMAGE_SHAPE.CIRCLE, CARD_IMAGE_SHAPE.SQUARE],
      initialValue: CARD_IMAGE_SHAPE.CIRCLE,
      subject: 'photo',
    }),
    displayModeField(),
    ctaButtonsField(),
    ...alignmentFields([], {
      allow: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
      hasActions: true,
      alignsCarousel: true,
    }),
    cardAlignmentField({
      initialValue: CONTENT_ALIGNMENT.CENTER,
      hasSpotlight: true,
    }),
    wideLayoutField,
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
