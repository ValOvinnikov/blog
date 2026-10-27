import { languageSwitcherField } from '@blog/studio/schema-types/fields/language-switcher-field/language-switcher-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { brandTaglineSchema } from '@blog/studio/schema-types/objects/brand-tagline/brand-tagline';
import { linkRefSchema } from '@blog/studio/schema-types/objects/link-ref/link-ref';
import { linkRefWithSubItemsSchema } from '@blog/studio/schema-types/objects/link-ref-with-sub-items/link-ref-with-sub-items';
import { Menu } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const navigationSettingsSchema = defineType({
  name: 'settings_navigation',
  title: 'Navigation',
  type: 'document',
  description: 'The links shown in the main site navigation.',
  icon: Menu,
  preview: { select: { title: 'title' } },
  fields: [
    titleField(),
    defineField({
      name: 'items',
      title: 'Header Links',
      type: 'array',
      description:
        'Top-level links in the site header. A link with sub-items opens a list of further links.',
      of: [
        defineArrayMember({ type: linkRefSchema.name }),
        defineArrayMember({ type: linkRefWithSubItemsSchema.name }),
      ],
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: brandTaglineSchema.name,
      description:
        'Optional short line shown under the logo, e.g. "build 2026.07 · online".',
    }),
    languageSwitcherField(),
  ],
});
