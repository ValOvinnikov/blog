import { Cookie } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const cookieSettingsItemSchema = defineType({
  name: 'cookieSettingsItem',
  title: 'Cookie Settings',
  type: 'object',
  description:
    'Sets where the Cookie settings link sits among the fine print. The link shows on every site either way.',
  icon: Cookie,
  fields: [
    // Sanity rejects an object type with no fields; this one only marks a position.
    defineField({ name: 'placement', type: 'string', hidden: true }),
  ],
  preview: {
    prepare() {
      return { title: 'Cookie settings' };
    },
  },
});
