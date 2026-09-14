import {
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
} from '@blog/config/constants';
import { ctaActionFields } from '@blog/studio/schema-types/fields/cta-action-fields/cta-action-fields';
import { linkRefFields } from '@blog/studio/schema-types/fields/link-ref-fields/link-ref-fields';
import { toTitleCase } from '@blog/utils/primitives';
import { MousePointerClick } from 'lucide-react';
import { defineType } from 'sanity';

export const ctaActionRefSchema = defineType({
  name: 'ctaActionRef',
  title: 'Action',
  type: 'object',
  description:
    'A single button or text link, authored by choosing a shared link, used inside a call to action or action group.',
  icon: MousePointerClick,
  initialValue: {
    variant: CTA_ACTION_VARIANT.PRIMARY,
    appearance: CTA_ACTION_APPEARANCE.CONTAINED,
  },
  fields: [...ctaActionFields(), ...linkRefFields()],
  preview: {
    select: {
      labelOverride: 'labelOverride',
      linkLabel: 'link.label',
      variant: 'variant',
      appearance: 'appearance',
    },
    prepare({ labelOverride, linkLabel, variant, appearance }) {
      return {
        title: String(labelOverride ?? linkLabel ?? 'Action'),
        subtitle: `${toTitleCase(String(variant ?? ''))} · ${toTitleCase(String(appearance ?? ''))}`,
      };
    },
  },
});
