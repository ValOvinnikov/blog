import { markerField } from '@blog/studio/schema-types/fields/marker-field/marker-field';
import { Cookie } from 'lucide-react';
import { defineType } from 'sanity';

export const cookieSettingsItemSchema = defineType({
  name: 'cookieSettingsItem',
  title: 'Cookie Settings',
  type: 'object',
  description:
    'Sets where the Cookie settings link sits among the fine print when it shows. The Footer settings on the Look page and the cookie banner decide whether it does.',
  icon: Cookie,
  fields: [markerField()],
  preview: {
    prepare() {
      return { title: 'Cookie settings' };
    },
  },
});
