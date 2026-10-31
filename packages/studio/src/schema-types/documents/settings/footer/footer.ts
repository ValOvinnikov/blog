import { languageSwitcherField } from '@blog/studio/schema-types/fields/language-switcher-field/language-switcher-field';
import { localizedMultilineTextField } from '@blog/studio/schema-types/fields/localized-multiline-text-field/localized-multiline-text-field';
import { localizedOneLineTextField } from '@blog/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { cookieSettingsItemSchema } from '@blog/studio/schema-types/objects/cookie-settings-item/cookie-settings-item';
import { footerLinkGroupSchema } from '@blog/studio/schema-types/objects/footer-link-group/footer-link-group';
import { linkRefSchema } from '@blog/studio/schema-types/objects/link-ref/link-ref';
import { socialProfileSchema } from '@blog/studio/schema-types/objects/social-profile/social-profile';
import { validateArrayTypeAtMostOnce } from '@blog/studio/schema-types/validation/validate-array-type-at-most-once/validate-array-type-at-most-once';
import { PanelBottom } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const footerSettingsSchema = defineType({
  name: 'settings_footer',
  title: 'Footer',
  type: 'document',
  description: 'What appears in the site footer, at the bottom of every page.',
  icon: PanelBottom,
  preview: { select: { title: 'title' } },
  fields: [
    titleField(),
    defineField({
      name: 'social',
      title: 'Social Links',
      type: 'array',
      description: 'Social profile links shown in the site footer.',
      of: [defineArrayMember({ type: socialProfileSchema.name })],
    }),
    defineField({
      name: 'groups',
      title: 'Groups',
      type: 'array',
      description:
        'Columns of links, each under a heading you choose, shown in this order.',
      of: [defineArrayMember({ type: footerLinkGroupSchema.name })],
    }),
    localizedOneLineTextField({
      name: 'about',
      title: 'About',
      description:
        'A sentence about your site, shown under the logo. Leave empty to show none.',
    }),
    localizedMultilineTextField({
      name: 'address',
      title: 'Address',
      description:
        'A postal address, shown under the about text with each line as you type it.',
    }),
    defineField({
      name: 'privacyPolicy',
      title: 'Privacy Policy',
      type: linkRefSchema.name,
      description:
        'Your privacy policy, linked from the cookie banner and next to the copyright line at the bottom of the footer.',
    }),
    defineField({
      name: 'finePrint',
      title: 'Fine Print',
      type: 'array',
      description:
        'Small links after the privacy policy, such as terms or a legal notice. Add Cookie settings to choose where that link sits.',
      of: [
        defineArrayMember({ type: linkRefSchema.name }),
        defineArrayMember({ type: cookieSettingsItemSchema.name }),
      ],
      validation: (rule) =>
        rule.custom(
          validateArrayTypeAtMostOnce(
            cookieSettingsItemSchema.name,
            'Cookie settings can appear only once.',
          ),
        ),
    }),
    languageSwitcherField(),
    defineField({
      name: 'showRssFeed',
      title: 'Show RSS feed',
      type: 'boolean',
      description: "Shows a link to your site's RSS feed.",
      initialValue: true,
    }),
  ],
});
