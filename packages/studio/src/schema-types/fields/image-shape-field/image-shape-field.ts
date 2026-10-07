import type { TCardImageShape } from '@blog/config/constants';
import { toTitleCase } from '@blog/utils/primitives';
import { defineField } from 'sanity';

type TImageShapeFieldOptions = {
  values: readonly TCardImageShape[];
  initialValue: TCardImageShape;
  subject: string;
};

export const imageShapeField = ({
  values,
  initialValue,
  subject,
}: TImageShapeFieldOptions) =>
  defineField({
    name: 'imageShape',
    title: 'Image Shape',
    type: 'string',
    description: `How each ${subject} is cropped.`,
    options: {
      layout: 'dropdown',
      list: values.map((value) => ({ title: toTitleCase(value), value })),
    },
    initialValue,
    validation: (rule) => rule.required(),
  });
