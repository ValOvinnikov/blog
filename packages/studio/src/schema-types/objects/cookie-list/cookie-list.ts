import { PORTABLE_TEXT_BLOCK_TYPE } from '@shinefold/config/constants';
import { markerField } from '@shinefold/studio/schema-types/fields/marker-field/marker-field';
import { Cookie } from 'lucide-react';
import { defineType } from 'sanity';

export const cookieListSchema = defineType({
  name: PORTABLE_TEXT_BLOCK_TYPE.COOKIE_LIST,
  title: 'Cookie List',
  type: 'object',
  description:
    'Shows the list of cookies and browser storage the site uses, kept current by the platform so it never needs retyping.',
  icon: Cookie,
  fields: [markerField()],
  preview: {
    prepare() {
      return {
        title: 'Cookie list',
        subtitle: 'The site’s cookies and storage, filled in automatically',
      };
    },
  },
});
