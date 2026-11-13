import {
  CONTENT_ALIGNMENT,
  type TContentAlignment,
} from '@blog/config/constants';
import { AlignmentPicture } from '@blog/studio/schema-types/fields/alignment-fields/alignment-picture';
import { tileField } from '@blog/studio/schema-types/fields/tile-field/tile-field';
import { hasArrayGotMultipleItems, toTitleCase } from '@blog/utils/primitives';
import type { ComponentType } from 'react';
import type { StringDefinition } from 'sanity';

type TAlignmentField = {
  name: string;
  title: string;
  description: string;
  list?: readonly TContentAlignment[];
  initialValue?: TContentAlignment;
  hidden?: StringDefinition['hidden'];
  fieldset?: string;
  validation?: StringDefinition['validation'];
  Picture?: ComponentType<{ value: TContentAlignment }>;
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
  Picture = AlignmentPicture,
}: TAlignmentField) =>
  tileField({
    name,
    title,
    description,
    tiles: (list ?? Object.values(CONTENT_ALIGNMENT)).map((value) => ({
      title: toTitleCase(value),
      value,
    })),
    Picture,
    initialValue,
    hidden,
    fieldset,
    validation,
  });

const LEFT_CENTER: readonly TContentAlignment[] = [
  CONTENT_ALIGNMENT.LEFT,
  CONTENT_ALIGNMENT.CENTER,
];

type TAlignmentFieldExtra = Omit<TAlignmentField, 'list'> & {
  allow: readonly TContentAlignment[];
};

type TAlignmentFieldsOptions = {
  title?: string;
  hasActions?: boolean;
  alignsItems?: boolean;
  alignsCarousel?: boolean;
  fieldset?: string;
  initialValue?: TContentAlignment;
  allow?: readonly TContentAlignment[];
};

const joinAsList = (parts: readonly string[]) =>
  hasArrayGotMultipleItems(parts)
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
    title: options.title ?? 'Content Alignment',
    description: contentAlignmentDescription(options),
    list: options.allow ?? LEFT_CENTER,
    initialValue: options.initialValue ?? CONTENT_ALIGNMENT.LEFT,
    fieldset: options.fieldset,
  }),
  ...extras.map(({ allow, ...extra }) =>
    alignmentField({ ...extra, list: allow }),
  ),
];
