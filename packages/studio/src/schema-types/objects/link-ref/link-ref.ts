import { PORTABLE_TEXT_BLOCK_TYPE } from '@blog/config/constants';
import { linkReferenceField } from '@blog/studio/schema-types/fields/link-reference-field/link-reference-field';
import {
  linkReferencePreviewSelect,
  toLinkReferencePreviewTitle,
} from '@blog/studio/schema-types/fields/link-reference-field/link-reference-preview';
import { toToolbarIcon } from '@blog/studio/schema-types/portable-text/toolbar-icon/toolbar-icon';
import { Link2 } from 'lucide-react';
import { defineType } from 'sanity';

export const linkRefSchema = defineType({
  name: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
  title: 'Link',
  type: 'object',
  description: 'Points at a reusable link document.',
  icon: toToolbarIcon(Link2),
  fields: [
    linkReferenceField({
      description: 'The link document this points at.',
      isRequired: true,
    }),
  ],
  preview: {
    select: linkReferencePreviewSelect,
    prepare(value) {
      return { title: toLinkReferencePreviewTitle(value) };
    },
  },
});
