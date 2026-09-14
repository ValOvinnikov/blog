import { linksField } from '@blog/studio/schema-types/fields/links-field/links-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { socialLinkRefSchema } from '@blog/studio/schema-types/objects/social-link-ref/social-link-ref';
import { PanelBottom } from 'lucide-react';
import { defineType } from 'sanity';

export const footerSettingsSchema = defineType({
  name: 'settings_footer',
  title: 'Footer',
  type: 'document',
  description: 'What appears in the site footer, at the bottom of every page.',
  icon: PanelBottom,
  preview: { select: { title: 'title' } },
  fields: [
    titleField(),
    linksField({
      name: 'social',
      title: 'Social Links',
      description: 'Social profile links shown in the site footer.',
      of: [socialLinkRefSchema.name],
    }),
  ],
});
