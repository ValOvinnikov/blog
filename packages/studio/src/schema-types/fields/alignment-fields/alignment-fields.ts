import {
  CONTENT_ALIGNMENT,
  type TContentAlignment,
} from '@blog/config/constants';
import { toTitleCase } from '@blog/utils/primitives';
import { defineField, type StringDefinition } from 'sanity';

type TAlignmentField = {
  name: string;
  title: string;
  description: string;
  list?: readonly TContentAlignment[];
  initialValue?: TContentAlignment;
  hidden?: StringDefinition['hidden'];
  fieldset?: string;
  validation?: StringDefinition['validation'];
};

export const alignmentField = ({
  name,
  title,
  description,
  list,
  initialValue,
  hidden,
  fieldset,
  validation,
}: TAlignmentField) =>
  defineField({
    name,
    title,
    type: 'string',
    description,
    options: {
      layout: 'dropdown',
      list: (list ?? Object.values(CONTENT_ALIGNMENT)).map((value) => ({
        title: toTitleCase(value),
        value,
      })),
    },
    initialValue,
    hidden,
    fieldset,
    validation,
  });

type TAlignmentFieldExtra = Omit<TAlignmentField, 'list'> & {
  allow: readonly TContentAlignment[];
};

type TAlignmentFieldsOptions = {
  hasActions?: boolean;
  alignsItems?: boolean;
  alignsCarousel?: boolean;
  fieldset?: string;
  initialValue?: TContentAlignment;
  allow?: readonly TContentAlignment[];
};

const joinAsList = (parts: readonly string[]) =>
  parts.length > 1
    ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1) ?? ''}`
    : (parts[0] ?? '');

const contentAlignmentDescription = ({
  hasActions = false,
  alignsItems = false,
  alignsCarousel = false,
}: TAlignmentFieldsOptions) =>
  [
    `Horizontal alignment of ${joinAsList([
      'the heading',
      'supporting text',
      ...(hasActions ? ['actions'] : []),
    ])}.`,
    ...(alignsItems ? ['Everything below the heading follows it too.'] : []),
    ...(alignsCarousel
      ? [
          "When a carousel's cards don't fill the row, they line up the same way.",
        ]
      : []),
  ].join(' ');

export const alignmentFields = (
  extras: readonly TAlignmentFieldExtra[],
  options: TAlignmentFieldsOptions = {},
) => [
  alignmentField({
    name: 'contentAlignment',
    title: 'Content Alignment',
    description: contentAlignmentDescription(options),
    list: options.allow,
    initialValue: options.initialValue ?? CONTENT_ALIGNMENT.LEFT,
    fieldset: options.fieldset,
  }),
  ...extras.map(({ allow, ...extra }) =>
    alignmentField({ ...extra, list: allow }),
  ),
];
