import {
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
} from '@shinefold/config/constants';
import { personSchema } from '@shinefold/studio/schema-types/documents/person/person';
import { cardModuleAppearance } from '@shinefold/studio/schema-types/fields/appearance-fields/appearance-fields';
import { cardAlignmentField } from '@shinefold/studio/schema-types/fields/card-alignment-field/card-alignment-field';
import { ctaButtonsField } from '@shinefold/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { imageShapeField } from '@shinefold/studio/schema-types/fields/image-shape-field/image-shape-field';
import { showToggleField } from '@shinefold/studio/schema-types/fields/show-toggle-field/show-toggle-field';
import { titleField } from '@shinefold/studio/schema-types/fields/title-field/title-field';
import { moduleHeadingBlockField } from '@shinefold/studio/schema-types/objects/module-heading-block/module-heading-block-field';
import { moduleSubtitle } from '@shinefold/studio/schema-types/preview/module-subtitle/module-subtitle';
import { Users } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

const NO_MEMBERS_ERROR = 'Add at least one person.';

export const teamSchema = defineType({
  name: 'module_team',
  title: 'Team',
  type: 'document',
  description:
    'People drawn from existing Persons, shown as a single spotlight or a set of cards — used to introduce a founder, a team, staff, or contributors.',
  icon: Users,
  ...cardModuleAppearance({
    content: [
      titleField(),
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
          rule.required().error(NO_MEMBERS_ERROR),
          rule.min(1).error(NO_MEMBERS_ERROR),
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
      ctaButtonsField(),
    ],
    beforeDisplayMode: [
      imageShapeField({
        values: [CARD_IMAGE_SHAPE.CIRCLE, CARD_IMAGE_SHAPE.SQUARE],
        initialValue: CARD_IMAGE_SHAPE.CIRCLE,
        subject: 'photo',
      }),
    ],
    displayMode: true,
    headingAlignment: {
      allow: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
      hasActions: true,
      alignsCarousel: true,
    },
    afterHeadingAlignment: [
      cardAlignmentField({
        initialValue: CONTENT_ALIGNMENT.CENTER,
        hasSpotlight: true,
      }),
    ],
  }),
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
