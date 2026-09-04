import { CTA_ALIGNMENT, type TCtaAlignment } from '@blog/config/constants';
import { toTitleCase } from '@blog/utils/primitives';
import { defineField, type StringDefinition } from 'sanity';

type TAlignmentField = {
  name: string;
  title: string;
  description: string;
  list?: readonly TCtaAlignment[];
  initialValue?: TCtaAlignment;
  hidden?: StringDefinition['hidden'];
};

const alignmentField = ({
  name,
  title,
  description,
  list,
  initialValue,
  hidden,
}: TAlignmentField) =>
  defineField({
    name,
    title,
    type: 'string',
    description,
    options: {
      layout: 'radio',
      list: (list ?? Object.values(CTA_ALIGNMENT)).map((value) => ({
        title: toTitleCase(value),
        value,
      })),
    },
    initialValue,
    hidden,
  });

type TAlignmentFieldExtra = {
  name: string;
  title: string;
  description: string;
  allow: readonly TCtaAlignment[];
  initialValue?: TCtaAlignment;
  hidden: StringDefinition['hidden'];
};

/**
 * A variant-scoped extra exists because a single field's `options.list` is
 * static and can't vary its option set by another field's value — each
 * extra covers one variant's allowed subset, alongside one baseline field
 * offering every alignment value.
 */
export const defineAlignmentFields = (
  extras: readonly TAlignmentFieldExtra[],
) => [
  ...extras.map((extra) =>
    alignmentField({
      name: extra.name,
      title: extra.title,
      description: extra.description,
      list: extra.allow,
      initialValue: extra.initialValue,
      hidden: extra.hidden,
    }),
  ),
  alignmentField({
    name: 'contentAlignment',
    title: 'Content Alignment',
    description: 'How text and actions align inside the content block.',
  }),
];
