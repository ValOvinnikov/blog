import { newsletterContentFields } from '@cms/schema-types/helpers/newsletter-content-fields';
import { titleField } from '@cms/schema-types/helpers/title-field';
import { Mail } from 'lucide-react';
import { defineType } from 'sanity';

export const newsletterSchema = defineType({
  name: 'module_newsletter',
  title: 'Newsletter Signup',
  type: 'document',
  icon: Mail,
  fields: [
    titleField({ description: 'Internal label shown in the Studio.' }),
    ...newsletterContentFields(),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'heading',
    },
    prepare({ title, subtitle }) {
      return {
        title: title ?? 'Unknown',
        subtitle,
      };
    },
  },
});
