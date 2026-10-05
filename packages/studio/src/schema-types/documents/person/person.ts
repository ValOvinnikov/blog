import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { localizedOneLineTextField } from '@blog/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { localizedParagraphTextField } from '@blog/studio/schema-types/fields/localized-paragraph-text-field/localized-paragraph-text-field';
import { localizedImageWithAltSchema } from '@blog/studio/schema-types/objects/localized-image-with-alt/localized-image-with-alt';
import { socialProfileSchema } from '@blog/studio/schema-types/objects/social-profile/social-profile';
import { defaultLanguageValue } from '@blog/studio/schema-types/validation/default-language-value/default-language-value';
import { validateLocalizedMaxLength } from '@blog/studio/schema-types/validation/validate-localized-max-length/validate-localized-max-length';
import { UserRound } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

const ROLE_MAX_LENGTH = 100;

export const personSchema = defineType({
  name: 'person',
  title: 'Person',
  type: 'document',
  description:
    'A person the site credits or introduces — shown on the posts they wrote, on a profile hero, and on the team.',
  icon: UserRound,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description:
        'Full display name shown on posts and any hero introducing this person.',
      validation: (rule) => rule.required().max(100),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: localizedImageWithAltSchema.name,
      description:
        "Photo shown on posts, this person's profile hero, and their team card. Leave empty to show initials instead.",
    }),
    localizedParagraphTextField({
      name: 'bio',
      title: 'Bio',
      description:
        "Short biography shown on this person's profile hero, and on their team card when that module's Show Bios is on.",
    }),
    localizedOneLineTextField({
      name: 'role',
      title: 'Role',
      description:
        'Job title or role shown beneath their name (e.g. "Senior Engineer").',
      validation: (rule) =>
        rule.custom(
          validateLocalizedMaxLength(
            ROLE_MAX_LENGTH,
            `Keep the role under ${ROLE_MAX_LENGTH} characters.`,
          ),
        ),
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      description:
        "Links to social profiles shown as icons on this person's profile hero and their team card.",
      of: [defineArrayMember({ type: socialProfileSchema.name })],
    }),
    defineField({
      name: 'profilePage',
      title: 'Profile Page',
      type: 'reference',
      description: "Optional page this person's byline links to.",
      to: [{ type: linkSchema.name }],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      role: 'role',
      media: 'image',
    },
    prepare({ title, role, media }) {
      return {
        title,
        subtitle: defaultLanguageValue(role),
        media,
      };
    },
  },
});
