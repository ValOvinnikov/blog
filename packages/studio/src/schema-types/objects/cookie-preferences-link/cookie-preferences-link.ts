import { PORTABLE_TEXT_BLOCK_TYPE } from '@blog/config/constants';
import { markerField } from '@blog/studio/schema-types/fields/marker-field/marker-field';
import { toToolbarIcon } from '@blog/studio/schema-types/portable-text/toolbar-icon/toolbar-icon';
import { Cookie } from 'lucide-react';
import { defineType } from 'sanity';

export const cookiePreferencesLinkSchema = defineType({
  name: PORTABLE_TEXT_BLOCK_TYPE.COOKIE_PREFERENCES_LINK,
  title: 'Cookie Preferences',
  type: 'object',
  description:
    'Turns the selected text into a link that opens the cookie preferences, so a reader can change their choice without leaving the page.',
  icon: toToolbarIcon(Cookie),
  fields: [markerField()],
  preview: {
    prepare() {
      return { title: 'Cookie preferences' };
    },
  },
});
