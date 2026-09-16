import { pageHref } from '@blog/config';
import {
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  type TCtaActionVariant,
} from '@blog/config/constants';
import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { toTitleCase } from '@blog/utils/primitives';
import { MousePointerClick } from 'lucide-react';
import { defineField, defineType } from 'sanity';

type TCtaButtonTypeConfig = {
  name: string;
  variant: TCtaActionVariant;
  variantHidden?: boolean;
  linkRequired: boolean;
};

const NO_LINK_SUBTITLE = 'No link yet';

/** Builds an action object type pointing at a reusable link, shared by `ctaButton` and `ctaSecondaryButton`. */
const buildCtaButtonSchema = ({
  name,
  variant,
  variantHidden,
  linkRequired,
}: TCtaButtonTypeConfig) =>
  defineType({
    name,
    title: 'Action',
    type: 'object',
    description: 'An action pointing at a reusable link.',
    icon: MousePointerClick,
    initialValue: {
      variant,
      appearance: CTA_ACTION_APPEARANCE.CONTAINED,
    },
    fields: [
      defineField({
        name: 'variant',
        title: 'Variant',
        type: 'string',
        description: 'How prominent this action is.',
        options: {
          layout: 'dropdown',
          list: Object.values(CTA_ACTION_VARIANT).map((value) => ({
            title: toTitleCase(value),
            value,
          })),
        },
        initialValue: variant,
        hidden: variantHidden,
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'appearance',
        title: 'Appearance',
        type: 'string',
        description: 'How this action is styled.',
        options: {
          layout: 'dropdown',
          list: Object.values(CTA_ACTION_APPEARANCE).map((value) => ({
            title: toTitleCase(value),
            value,
          })),
        },
        initialValue: CTA_ACTION_APPEARANCE.CONTAINED,
      }),
      defineField({
        name: 'link',
        title: 'Link',
        type: 'reference',
        description: 'Where this action goes.',
        to: [{ type: linkSchema.name }],
        validation: linkRequired ? (rule) => rule.required() : undefined,
      }),
    ],
    preview: {
      select: {
        variant: 'variant',
        appearance: 'appearance',
        url: 'link.url',
        pageType: 'link.internalReference._type',
        pageSlug: 'link.internalReference.slug.current',
      },
      prepare({ variant, appearance, url, pageType, pageSlug }) {
        const href =
          (typeof url === 'string' && url) ||
          pageHref(
            typeof pageType === 'string' ? pageType : undefined,
            typeof pageSlug === 'string' ? pageSlug : undefined,
          );

        return {
          title: `${toTitleCase(String(variant ?? ''))} · ${toTitleCase(String(appearance ?? ''))}`,
          subtitle: href ?? NO_LINK_SUBTITLE,
        };
      },
    },
  });

export const ctaButtonSchema = buildCtaButtonSchema({
  name: 'ctaButton',
  variant: CTA_ACTION_VARIANT.PRIMARY,
  linkRequired: true,
});

export const ctaSecondaryButtonSchema = buildCtaButtonSchema({
  name: 'ctaSecondaryButton',
  variant: CTA_ACTION_VARIANT.SECONDARY,
  variantHidden: true,
  linkRequired: false,
});
